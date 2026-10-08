/**
 * Domain model for the shop. This is the contract between the DATA LAYER (src/data) and the
 * PRESENTATION LAYER (src/scenes, src/game). Scenes only ever see these types, never raw RDF/JSON,
 * so the same game can be pointed at another linked-data source (NDE "Van data naar dienst").
 *
 * Every entity keeps its IRI so we can show provenance and link out (sameAs) to Wikidata, RKD, etc.
 */

export type IRI = string;

export interface Place {
  id: string;
  iri: IRI;
  name: string;
  sameAs: IRI[];
}

export interface LifeEvent {
  year?: number;
  placeId?: string;
}

export interface Person {
  id: string;
  iri: IRI;
  name: string;
  /** "Wagenaar, Johan" — used for the alphabetical card index. */
  sortName: string;
  gender?: 'male' | 'female' | 'unknown';
  birth?: LifeEvent;
  death?: LifeEvent;
  /** Free-text occupations as they appear in the people dataset ("componist", "sopraan"...). */
  occupations: string[];
  description?: string;
  sameAs: IRI[];
}

/** Roles a person can have on a piece of sheet music. Mapped from the SOM role vocabulary. */
export type ContributorRole =
  | 'composer'
  | 'lyricist'
  | 'arranger'
  | 'performer'
  | 'dedicatee'
  | 'collector';

export interface Contribution {
  personId: string;
  role: ContributorRole;
  note?: string;
}

export interface Work {
  id: string;
  iri: IRI;
  title: string;
  subtitle?: string;
  year?: number;
  /** Shop section / genre, e.g. "Liederen", "Orkest", "Viool". Drives the cabinet drawers. */
  genre: string;
  /** Human description of the scoring ("zang en piano"). */
  scoring: string;
  /** Machine hint for the audio layer: which instruments the score is written for. */
  instrumentation: string[];
  publisher?: string;
  shelfmark?: string;
  price?: string;
  language?: string;
  contributions: Contribution[];
  /** Digitised scan (IIIF manifest or image) — for the page-flip view later. */
  scanUrl?: string;
  /** A MusicXML/MEI file produced by OMR — consumed by the audio layer when present. */
  scoreUrl?: string;
  /** A real recording, if SOM or another source has one. Wins over synthesis. */
  audioUrl?: string;
  /** Purely presentational: cover colours for the procedural sheet-music cover. */
  cover?: { color: string; accent: string };
  /** Put in the shop window ("Nieuw verschenen"). */
  featured?: boolean;
}

/** A typed edge between two people from the people dataset (teacher of, friend of, ...). */
export interface PersonLink {
  from: string;
  to: string;
  predicate: IRI;
  /** Dutch label shown on the red thread, read "from <label> to". */
  label: string;
  /** Label read in the other direction ("leerling van"). */
  inverseLabel: string;
}

/** A relation as presented to the UI: already oriented from the person you are looking at. */
export interface RelatedPerson {
  person: Person;
  label: string;
  /** 'link' = explicit edge in the data; 'place' = derived via a shared place; 'work' = co-credited on a work. */
  kind: 'link' | 'place' | 'work';
}

export const ROLE_LABEL_NL: Record<ContributorRole, string> = {
  composer: 'Componist',
  lyricist: 'Tekstdichter',
  arranger: 'Bewerker',
  performer: 'Uitvoerende',
  dedicatee: 'Opgedragen aan',
  collector: 'Verzamelaar',
};
