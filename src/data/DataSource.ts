import type { Person, PersonLink, Place, Work } from './model';

/**
 * Anything that can answer these questions can power the shop:
 * the bundled JSON-LD sample (MockDataSource), the SOM SPARQL endpoint (SparqlDataSource),
 * or a future API from the NDE "koppelvlak".
 *
 * Keep this interface small and "raw". Derived relations (shared birthplace, co-credits)
 * live in ShopData so every source gets them for free.
 */
export interface DataSource {
  /** Shown in-world on catalogue slips ("Bron: ..."). */
  readonly label: string;

  listWorks(): Promise<Work[]>;
  listPeople(): Promise<Person[]>;

  getWork(id: string): Promise<Work | undefined>;
  getPerson(id: string): Promise<Person | undefined>;
  getPlace(id: string): Promise<Place | undefined>;

  /** All works where the person appears in any role. */
  worksByPerson(personId: string): Promise<Work[]>;
  /** Explicit person↔person edges touching this person (either direction). */
  personLinks(personId: string): Promise<PersonLink[]>;
}
