import PouchDB from 'pouchdb-browser';

const db = {
  series: new PouchDB('series'),
  episodes: new PouchDB('episodes'),
  current: new PouchDB('current'),
  auth: new PouchDB('auth'),
  search: new PouchDB('search'),
  bookmarkSeries: new PouchDB('bookmarkSeries'),
  bookmarkEpisodes: new PouchDB('bookmarkEpisodes'),
};

export default db;
