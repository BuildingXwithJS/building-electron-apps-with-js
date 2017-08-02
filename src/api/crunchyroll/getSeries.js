// npm packages
import request from 'request-promise-native';
import cheerio from 'cheerio';

// base url
const baseURL = 'http://www.crunchyroll.com';

export default async _id => {
  // load catalogue
  const url = `${baseURL}${_id}`;
  const data = await request(url);
  // create cheerio cursor
  const $ = cheerio.load(data);

  const title = $('span[itemprop=name]').text();
  const image = $('img[itemprop=image]').attr('src');
  const count = $('.list-of-seasons .group-item').length;

  // construct result
  const series = {
    _id,
    source: 'crunchyroll',
    title,
    url,
    image,
    count,
  };

  return series;
};
