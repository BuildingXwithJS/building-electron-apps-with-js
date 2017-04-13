import PouchDB from 'pouchdb-browser';

const db = {
  series: new PouchDB('series'),
  episodes: new PouchDB('episodes'),
};

export default db;
