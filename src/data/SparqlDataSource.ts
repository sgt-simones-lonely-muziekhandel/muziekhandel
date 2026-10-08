import type { DataSource } from './DataSource';
import type { ContributorRole, Person, PersonLink, Place, Work } from './model';

/**
 * Live source for the SOM linked data (sheet music + people), via a SPARQL endpoint.
 *
 * STATUS: written against schema.org terms as a starting point. Once we have the actual SOM
 * dataset (NDE Datasetregister / the SOM endpoint), adjust the PREFIXES and the property paths
 * in the queries below — the mapping to our model stays the same.
 *
 * Enable with:  VITE_DATA_SOURCE=sparql VITE_SOM_SPARQL=https://.../sparql npm run dev
 */

const PREFIXES = `
PREFIX schema: <https://schema.org/>
PREFIX sdo: <http://schema.org/>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
`;

type Binding = Record<string, { type: string; value: string } | undefined>;

/** Map the role IRIs/labels used in the source to our small role vocabulary. */
function mapRole(raw: string | undefined): ContributorRole {
  const r = (raw ?? '').toLowerCase();
  if (/(lyric|tekst|text|librett)/.test(r)) return 'lyricist';
  if (/(arrang|bewerk)/.test(r)) return 'arranger';
  if (/(perform|uitvoer|singer|zang|conduct|dirig)/.test(r)) return 'performer';
  if (/(dedicat|opgedragen)/.test(r)) return 'dedicatee';
  if (/(collect|verzamel)/.test(r)) return 'collector';
  return 'composer';
}

const localId = (iri: string) => encodeURIComponent(iri);
const iriOf = (id: string) => decodeURIComponent(id);
const year = (v?: string) => (v ? Number.parseInt(v.slice(0, 4), 10) || undefined : undefined);

export class SparqlDataSource implements DataSource {
  readonly label: string;
  private workCache = new Map<string, Work>();
  private personCache = new Map<string, Person>();

  constructor(private endpoint: string, label = 'Stichting Omroep Muziek (SPARQL)') {
    this.label = label;
  }

  private async select(query: string): Promise<Binding[]> {
    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/sparql-query', Accept: 'application/sparql-results+json' },
      body: PREFIXES + query,
    });
    if (!res.ok) throw new Error(`SPARQL ${res.status}: ${await res.text()}`);
    const json = await res.json();
    return json.results.bindings as Binding[];
  }

  async listWorks(): Promise<Work[]> {
    const rows = await this.select(`
      SELECT ?w ?title ?date ?genre ?person ?role WHERE {
        ?w a schema:MusicComposition ; schema:name ?title .
        OPTIONAL { ?w schema:dateCreated ?date }
        OPTIONAL { ?w schema:genre ?genre }
        OPTIONAL { ?w schema:composer ?person . BIND("composer" AS ?role) }
      } LIMIT 500`);
    const byIri = new Map<string, Work>();
    for (const b of rows) {
      const iri = b.w!.value;
      let w = byIri.get(iri);
      if (!w) {
        w = {
          id: localId(iri), iri, title: b.title?.value ?? '(zonder titel)', year: year(b.date?.value),
          genre: b.genre?.value ?? 'Diversen', scoring: '', instrumentation: ['piano'], contributions: [],
        };
        byIri.set(iri, w);
      }
      if (b.person) w.contributions.push({ personId: localId(b.person.value), role: mapRole(b.role?.value) });
    }
    for (const w of byIri.values()) this.workCache.set(w.id, w);
    return [...byIri.values()];
  }

  async listPeople(): Promise<Person[]> {
    const rows = await this.select(`
      SELECT ?p ?name ?birth ?death ?bplace ?dplace ?occ ?same WHERE {
        ?p a schema:Person ; schema:name ?name .
        OPTIONAL { ?p schema:birthDate ?birth } OPTIONAL { ?p schema:deathDate ?death }
        OPTIONAL { ?p schema:birthPlace ?bplace } OPTIONAL { ?p schema:deathPlace ?dplace }
        OPTIONAL { ?p schema:hasOccupation ?occ } OPTIONAL { ?p owl:sameAs ?same }
      } LIMIT 2000`);
    const byIri = new Map<string, Person>();
    for (const b of rows) {
      const iri = b.p!.value;
      let p = byIri.get(iri);
      if (!p) {
        const name = b.name!.value;
        const parts = name.split(' ');
        p = {
          id: localId(iri), iri, name, sortName: `${parts.slice(-1)[0]}, ${parts.slice(0, -1).join(' ')}`,
          birth: { year: year(b.birth?.value), placeId: b.bplace && localId(b.bplace.value) },
          death: { year: year(b.death?.value), placeId: b.dplace && localId(b.dplace.value) },
          occupations: [], sameAs: [],
        };
        byIri.set(iri, p);
      }
      if (b.occ && !p.occupations.includes(b.occ.value)) p.occupations.push(b.occ.value);
      if (b.same && !p.sameAs.includes(b.same.value)) p.sameAs.push(b.same.value);
    }
    for (const p of byIri.values()) this.personCache.set(p.id, p);
    return [...byIri.values()];
  }

  async getWork(id: string) {
    if (!this.workCache.size) await this.listWorks();
    return this.workCache.get(id);
  }

  async getPerson(id: string) {
    if (!this.personCache.size) await this.listPeople();
    return this.personCache.get(id);
  }

  async getPlace(id: string): Promise<Place | undefined> {
    const iri = iriOf(id);
    const rows = await this.select(`SELECT ?name WHERE { <${iri}> rdfs:label|schema:name ?name } LIMIT 1`);
    return { id, iri, name: rows[0]?.name?.value ?? iri, sameAs: [] };
  }

  async worksByPerson(personId: string) {
    const all = this.workCache.size ? [...this.workCache.values()] : await this.listWorks();
    return all.filter((w) => w.contributions.some((c) => c.personId === personId));
  }

  async personLinks(personId: string): Promise<PersonLink[]> {
    const iri = iriOf(personId);
    const rows = await this.select(`
      SELECT ?from ?to ?pred WHERE {
        { BIND(<${iri}> AS ?from) ?from ?pred ?to . ?to a schema:Person . }
        UNION
        { BIND(<${iri}> AS ?to) ?from ?pred ?to . ?from a schema:Person . }
      } LIMIT 50`);
    return rows.map((b) => {
      const pred = b.pred!.value;
      const name = pred.split(/[#/]/).pop() ?? pred;
      return { from: localId(b.from!.value), to: localId(b.to!.value), predicate: pred, label: name, inverseLabel: name };
    });
  }
}
