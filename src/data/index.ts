import { MockDataSource } from './MockDataSource';
import { ShopData } from './ShopData';
import { SparqlDataSource } from './SparqlDataSource';
import type { DataSource } from './DataSource';

/**
 * Picks the data source from env vars:
 *   VITE_DATA_SOURCE=sparql VITE_SOM_SPARQL=<endpoint>  → live SOM linked data
 *   (default)                                         → bundled JSON-LD sample
 */
export async function createShopData(): Promise<ShopData> {
  let source: DataSource;
  const kind = import.meta.env.VITE_DATA_SOURCE ?? 'mock';
  if (kind === 'sparql' && import.meta.env.VITE_SOM_SPARQL) {
    source = new SparqlDataSource(import.meta.env.VITE_SOM_SPARQL);
  } else {
    source = await MockDataSource.load(`${import.meta.env.BASE_URL}data/som-sample.jsonld`);
  }
  const data = new ShopData(source);
  await data.warmUp();
  return data;
}

export type { ShopData };
export * from './model';
