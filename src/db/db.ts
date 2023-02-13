import Dexie, { Table } from 'dexie';

export interface BffOrderBook {
  id?: number;
  orderBookKey: string;
}

export interface BffOOR {
  id?: number;
  OORKey: string;
}

export interface BffOTR {
  id?: number;
  OTRKey: string;
}

export interface BffSA {
  id?: number;
  SAKey: string;
}

export interface BffOLR {
  id?: number;
  OLRKey: string;
}

// Development by RavinduJ - Starts ---------------------------------------------------------------------------------------------------------
export interface AAS {
  id?: number;
  AASKey: string;
}

export interface PVHSS {
  id?: number;
  PVHSSKey: string;
}

export interface APLOB {
  id?: number;
  APLOBKey: string;
}

export interface M3SP {
  id?: number;
  M3SPKey: string;
}

export interface SWSPR {
  id?: number;
  SWSPRKey: string;
}

export interface CLOG {
  id?: number;
  SWSPRKey: string;
}

// Development by RavinduJ - Ends ---------------------------------------------------------------------------------------------------------

export class AppDB extends Dexie {
    bffOrderBook!: Table<BffOrderBook, number>;
    bffOOR!: Table<BffOOR, number>;
    bffOTR!: Table<BffOTR, number>;
    bffSA!: Table<BffSA, number>;
    bffOLR!: Table<BffOLR, number>;

// Development by RavinduJ - Starts ---------------------------------------------------------------------------------------------------------

    pvhss!: Table<PVHSS, number>;
    aas!: Table<AAS, number>;
    aplob!: Table<APLOB, number>;
    m3sp!: Table<M3SP, number>;
    
    swspr!: Table<SWSPR, number>;
    clog!: Table<CLOG, number>;

// Development by RavinduJ - Ends ---------------------------------------------------------------------------------------------------------

  constructor() {
    super('BrandixDB');
    this.version(3).stores({
      bffOrderBook: '++id, OBKey, OORKey, OTRKey, SAKey, OLRKey',
      bffOOR: '++id, OORKey',
      bffOTR: '++id, OTRKey',
      bffSA: '++id, SAKey',
      bffOLR: '++id, OLRKey',

// Development by RavinduJ - Starts ---------------------------------------------------------------------------------------------------------

      pvhss: '++id, PVHSSKey, PVHSSVPOKey',
      aas: '++id, AASKey1, AASKey2, AASVPOKey',
      aplob: '++id, APLOBKey, APLOBVPOKey, APLOBVPOKey2',
      m3sp: '++id, M3SPKey',

      spswr: '++id, SPSWRKey',
      clog: '++id, CLVPOKey',
// Development by RavinduJ - Ends ---------------------------------------------------------------------------------------------------------
    
    });
    this.on('populate', () => console.log("Starting the dexie database", new Date() ));
  }
}

export const db = new AppDB();
