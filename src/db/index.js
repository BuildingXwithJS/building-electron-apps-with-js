import PouchDB from 'pouchdb-browser';

const db = {
  series: new PouchDB('series'),
  episodes: new PouchDB('episodes'),
  current: new PouchDB('current'),
  auth: new PouchDB('auth'),
};

export default db;
