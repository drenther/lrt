import Loki, { LokiLocalStorageAdapter } from 'lokijs';
import generateId from 'uuid/v4';

const DB_NAME = 'papers.db';
const BACKUP = 'backup.db';
const COLLECTION_NAME = 'papers';

class DB {
  constructor() {
    if (DB.exists) return DB.instance;

    this.db = new Loki(DB_NAME, {
      adapter: new LokiLocalStorageAdapter(),
      autoload: true,
      autoloadCallback: () => {
        if (!this.db.getCollection(COLLECTION_NAME)) {
          this.collection = this.db.addCollection(COLLECTION_NAME);
        } else {
          this.collection = this.db.getCollection(COLLECTION_NAME);
        }
      },
      autosave: true,
      autosaveInterval: 4000,
    });

    DB.instance = this;
    DB.exists = true;

    return this;
  }

  add = data => {
    return this.collection.insert({ ...data, _id: generateId() });
  };

  find = (query = {}, multi = true) => {
    if (multi) return this.collection.find(query);
    return this.collection.findOne(query);
  };

  findById = _id => {
    return this.collection.findOne({ _id });
  };

  update = (_id, data) => {
    const result = this.findById(_id);
    this.collection.update({ ...result, ...data });
  };

  remove = _id => {
    return this.collection.removeWhere({ _id });
  };

  importData = data => {
    try {
      localStorage.setItem(DB_NAME, data);
    } catch (err) {
      console.error(err);
    }
  };

  exportData = dbName => {
    try {
      return localStorage.getItem(dbName || DB_NAME);
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  backupData = () => {
    try {
      localStorage.setItem(BACKUP, this.exportData());
    } catch (err) {
      console.error(err);
    }
  };

  retrieveBackup = () => {
    try {
      localStorage.setItem(DB_NAME, this.exportData(BACKUP));
    } catch (err) {
      console.error(err);
    }
  };
}

const db = new DB();

export default db;
