import Loki, { LokiLocalStorageAdapter } from 'lokijs';
import generateId from 'uuid/v4';

class DB {
  constructor() {
    if (DB.exists) return DB.instance;

    this.db = new Loki('papers.db', {
      adapter: new LokiLocalStorageAdapter(),
      autoload: true,
      autoloadCallback: () => {
        if (!this.db.getCollection('papers')) {
          this.collection = this.db.addCollection('papers');
        } else {
          this.collection = this.db.getCollection('papers');
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
}

const db = new DB();

export default db;
