import type { DataSource } from './DataSource';
import type { Contribution, Person, Place, RelatedPerson, Work } from './model';

/**
 * The shop's view of the linked data: wraps any DataSource and adds the graph walks the
 * scenes need (work → people, person → works, person → related people).
 *
 * Derived relations are where linked data shines for the visitor, e.g. "also born in Utrecht"
 * comes from two people pointing at the same place IRI — the user never sees the IRI.
 */
export class ShopData {
  private works: Work[] = [];
  private people: Person[] = [];

  constructor(readonly source: DataSource) {}

  /** Fetch the lists once at boot so the shop can be furnished synchronously. */
  async warmUp() {
    [this.works, this.people] = await Promise.all([this.source.listWorks(), this.source.listPeople()]);
  }

  get sourceLabel() { return this.source.label; }

  allWorks() { return this.works; }
  allPeople() { return this.people; }
  featuredWorks() {
    const f = this.works.filter((w) => w.featured);
    return f.length ? f : this.works.slice(0, 4);
  }

  /** Distinct shop sections in a stable order. */
  genres(): string[] {
    return [...new Set(this.works.map((w) => w.genre))].sort((a, b) => a.localeCompare(b, 'nl'));
  }

  worksInGenre(genre: string | null) {
    return genre ? this.works.filter((w) => w.genre === genre) : this.works;
  }

  /** People who appear on most works first — these get a portrait on the wall. */
  notablePeople(limit: number): Person[] {
    const count = new Map<string, number>();
    for (const w of this.works) for (const c of w.contributions) count.set(c.personId, (count.get(c.personId) ?? 0) + 1);
    return [...this.people].sort((a, b) => (count.get(b.id) ?? 0) - (count.get(a.id) ?? 0)).slice(0, limit);
  }

  getWork(id: string) { return this.source.getWork(id); }
  getPerson(id: string) { return this.source.getPerson(id); }
  getPlace(id: string): Promise<Place | undefined> { return this.source.getPlace(id); }

  /** Main composer (or first contributor) — for "door J. Wagenaar" on covers. */
  primaryPerson(work: Work): Person | undefined {
    const c = work.contributions.find((x) => x.role === 'composer') ?? work.contributions[0];
    return c && this.people.find((p) => p.id === c.personId);
  }

  async peopleForWork(work: Work): Promise<{ person: Person; contribution: Contribution }[]> {
    const out: { person: Person; contribution: Contribution }[] = [];
    for (const c of work.contributions) {
      const person = await this.source.getPerson(c.personId);
      if (person) out.push({ person, contribution: c });
    }
    return out;
  }

  async worksForPerson(person: Person): Promise<{ work: Work; role: Contribution['role'] }[]> {
    const works = await this.source.worksByPerson(person.id);
    return works.map((work) => ({
      work,
      role: work.contributions.find((c) => c.personId === person.id)!.role,
    }));
  }

  /**
   * People connected to `person`, from three kinds of evidence:
   *  1. explicit edges in the people dataset (teacher of, friend of ...)
   *  2. credited together on the same sheet music (SOM catalogue)
   *  3. sharing a birthplace (two datasets meeting on a place IRI)
   */
  async relatedPeople(person: Person): Promise<RelatedPerson[]> {
    const out = new Map<string, RelatedPerson>();
    const add = (p: Person | undefined, label: string, kind: RelatedPerson['kind']) => {
      if (p && p.id !== person.id && !out.has(p.id)) out.set(p.id, { person: p, label, kind });
    };

    for (const l of await this.source.personLinks(person.id)) {
      const outgoing = l.from === person.id;
      add(await this.source.getPerson(outgoing ? l.to : l.from), outgoing ? l.label : l.inverseLabel, 'link');
    }

    for (const w of await this.source.worksByPerson(person.id)) {
      for (const c of w.contributions) {
        if (c.personId === person.id) continue;
        add(this.people.find((p) => p.id === c.personId), `samen op „${w.title}"`, 'work');
      }
    }

    const birthPlace = person.birth?.placeId;
    if (birthPlace) {
      const place = await this.source.getPlace(birthPlace);
      for (const p of this.people) {
        if (p.birth?.placeId === birthPlace) add(p, `ook geboren in ${place?.name ?? '?'}`, 'place');
      }
    }
    return [...out.values()];
  }

  async lifeLine(person: Person): Promise<string> {
    const part = async (ev?: { year?: number; placeId?: string }) => {
      if (!ev) return '?';
      const place = ev.placeId ? (await this.source.getPlace(ev.placeId))?.name : undefined;
      return [place, ev.year].filter(Boolean).join(', ') || '?';
    };
    return `${await part(person.birth)} — ${await part(person.death)}`;
  }
}
