import {parseString} from 'xml2js';

export default (data, opts = {}) =>
  new Promise((resolve, reject) => parseString(data, opts, (err, res) => err ? reject(err) : resolve(res)));
