import babel from 'rollup-plugin-babel';

export default {
  entry: 'src/index.js',
  format: 'cjs',
  dest: 'dist/app.min.js',
  plugins: [babel({exclude: 'node_modules/**'})],
  external: [
    'big-integer',
    'cheerio',
    'crypto',
    'electron',
    'lodash',
    'playlist-parser',
    'pouchdb-browser',
    'react-dom',
    'react-router-dom',
    'react',
    'request-promise-native',
    'rxjs',
    'xml2js',
    'zlib',
  ],
};
