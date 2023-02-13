import { Injectable, KeyValueDiffers } from '@angular/core';
import { db } from '../../db/db';

@Injectable({
  providedIn: 'root'
})
export class DbconService {

  constructor() { } 

  addToStores(storeName, data) {
    db[storeName].add(data).then((result) => {
      return result
    });
  }

  addBulk(storeName, dataArray) {
    db[storeName].clear().then(() => {
      db[storeName].bulkAdd(dataArray)
        .then((result) => {
          return result
        })
    })
  }

  getAllArray(storeName) {
    return db[storeName].toArray();
  }

  getByKey(storeName, key) {
    return db[storeName].get(key);
  }

  getByIndex(storeName, index, key) {
    return db[storeName].get({ [index]: key });
  }

  getByDate(storeName, from, to) {
    return db[storeName].where('orderplacementDate').between(from, to).toArray()
  }

  deleteBulk(storeName, dataArray) {
    db[storeName].bulkDelete(dataArray).then(() => {
      return true
    })
  }

  deleteByKey(storeName, key) {
    db[storeName].delete(key).then(() => {
      return true
    })
  }

}
