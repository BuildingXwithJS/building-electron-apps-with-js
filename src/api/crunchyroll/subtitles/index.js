// @ts-check
/**
 * Code adapted from https://github.com/Deathspike/crunchyroll.js under MIT
 */
import crypto from 'crypto';
import bigInt from 'big-integer';
import zlib from 'zlib';

/**
 * Decrypts the data.
 */
const decrypt = (id, iv, data) => {
  const ivBuffer = typeof iv === 'string' ? new Buffer(iv, 'base64') : iv;
  const dataBuffer = typeof data === 'string' ? new Buffer(data, 'base64') : data;
  const decipher = crypto.createDecipheriv('aes-256-cbc', key(id), ivBuffer);
  decipher.setAutoPadding(false);
  return Buffer.concat([decipher.update(dataBuffer), decipher.final()]);
};

/**
 * Decompresses the data.
 */
const decompress = data =>
  new Promise((resolve, reject) => {
    try {
      zlib.inflate(data, (err, res) => err ? reject(err) : resolve(res));
    } catch (e) {
      resolve(data);
    }
  });

/**
 * Generates a secret string based on a Fibonacci sequence.
 */
const secret = (size, modulo, firstSeed, secondSeed) => {
  let currentValue = firstSeed + secondSeed;
  let previousValue = secondSeed;
  let result = '';
  for (let i = 0; i < size; i += 1) {
    const oldValue = currentValue;
    result += String.fromCharCode(currentValue % modulo + 33);
    currentValue += previousValue;
    previousValue = oldValue;
  }
  return result;
};

/**
 * Generates a magic number.
 */
const magic = subtitleId => {
  const base = Math.floor(Math.sqrt(6.9) * Math.pow(2, 25));
  const hash = bigInt(base).xor(subtitleId).toJSNumber();
  const multipliedHash = bigInt(hash).multiply(32).toJSNumber();
  return bigInt(hash).xor(hash >> 3).xor(multipliedHash).toJSNumber();
};

/**
 * Generates a key.
 */
const key = subtitleId => {
  const hash = secret(20, 97, 1, 2) + magic(subtitleId);
  const result = new Buffer(32);
  result.fill(0);
  crypto.createHash('sha1').update(hash).digest().copy(result);
  return result;
};

/**
 * Decodes the data.
 */
export default (id, iv, data) => decompress(decrypt(id, iv, data));
