import type { DataSource } from './DataSource';
import type { Contribution, Person, PersonLink, Place, Work } from './model';

/**
 * Reads the bundled sample file (public/data/som-sample.jsonld).
 *
 * The file is shaped like a JSON-LD export (@context, @id IRIs, schema.org-ish keys) so that
 * swapping to the real SOM dump is mostly a matter of changing the mapping functions below.
 */

interface RawDoc {
  '@context': unknown;
  source: string;
  places: RawPlace[];
  people: RawPerson[];
  works: RawWork[];
  links: RawLink[];
}
interface RawPlace { '@id': string; name: string; sameAs?: string[] }
interface RawPerson {
  '@id': string; name: string; sortName: string; gender?: Person['gender'];
  birthDate?: number; birthPlace?: string; deathDate?: number; deathPlace?: string;
  hasOccupation?: string[]; description?: string; sameAs?: string[];
}
interface RawWork {
  '@id': string; name: string; alternativeHeadline?: string; dateCreated?: number;
  genre: string; scoring: string; instrumentation?: string[]; publisher?: string;
  shelfmark?: string; price?: string; inLanguage?: string;
  contributor: { person: string; role: Contribution['role']; note?: string }[];
  scan?: string; score?: string; audio?: string;
  cover?: { color: string; accent: string }; featured?: boolean;
}
interface RawLink { from: string; to: string; predicate: string; label: string; inverseLabel: string }

/** Local id from an IRI: "https://.../person/wagenaar" -> "wagenaar". */
const localId = (iri: string) => iri.replace(/[#/]+$/, '').split(/[#/]/).pop() ?? iri;

/** Expand compact IRIs ("som:work/x") using the string prefixes declared in @context. */
function expander(context: unknown) {
  const prefixes = Object.entries((context ?? {}) as Record<string, unknown>)
    .filter(([k, v]) => typeof v === 'string' && !k.startsWith('@')) as [string, string][];
  return (iri: string) => {
    for (const [p, base] of prefixes) if (iri.startsWith(`${p}:`)) return base + iri.slice(p.length + 1);
    return iri;
  };
}

export class MockDataSource implements DataSource {
  readonly label: string;
  private works = new Map<string, Work>();
  private people = new Map<string, Person>();
  private places = new Map<string, Place>();
  private links: PersonLink[] = [];

  private constructor(doc: RawDoc) {
    this.label = doc.source;
    const expand = expander(doc['@context']);
    for (const p of doc.places) {
      this.places.set(localId(p['@id']), { id: localId(p['@id']), iri: expand(p['@id']), name: p.name, sameAs: p.sameAs ?? [] });
    }
    for (const p of doc.people) {
      const id = localId(p['@id']);
      this.people.set(id, {
        id, iri: expand(p['@id']), name: p.name, sortName: p.sortName, gender: p.gender ?? 'unknown',
        birth: { year: p.birthDate, placeId: p.birthPlace && localId(p.birthPlace) },
        death: { year: p.deathDate, placeId: p.deathPlace && localId(p.deathPlace) },
        occupations: p.hasOccupation ?? [], description: p.description, sameAs: p.sameAs ?? [],
      });
    }
    for (const w of doc.works) {
      const id = localId(w['@id']);
      this.works.set(id, {
        id, iri: expand(w['@id']), title: w.name, subtitle: w.alternativeHeadline, year: w.dateCreated,
        genre: w.genre, scoring: w.scoring, instrumentation: w.instrumentation ?? ['piano'],
        publisher: w.publisher, shelfmark: w.shelfmark, price: w.price, language: w.inLanguage,
        contributions: w.contributor.map((c) => ({ personId: localId(c.person), role: c.role, note: c.note })),
        scanUrl: w.scan, scoreUrl: w.score, audioUrl: w.audio, cover: w.cover, featured: w.featured,
      });
    }
    this.links = doc.links.map((l) => ({ ...l, from: localId(l.from), to: localId(l.to) }));
  }

  static async load(url: string): Promise<MockDataSource> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Could not load sample data from ${url}: ${res.status}`);
    return new MockDataSource((await res.json()) as RawDoc);
  }

  async listWorks() { return [...this.works.values()]; }
  async listPeople() { return [...this.people.values()]; }
  async getWork(id: string) { return this.works.get(id); }
  async getPerson(id: string) { return this.people.get(id); }
  async getPlace(id: string) { return this.places.get(id); }

  async worksByPerson(personId: string) {
    return [...this.works.values()].filter((w) => w.contributions.some((c) => c.personId === personId));
  }

  async personLinks(personId: string) {
    return this.links.filter((l) => l.from === personId || l.to === personId);
  }
}
