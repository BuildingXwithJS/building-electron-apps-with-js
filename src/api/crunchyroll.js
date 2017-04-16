// npm packages
import axios from 'axios';
import cheerio from 'cheerio';

// our packages
import db from '../db';

// base URL used for most requests
const baseURL = 'http://www.crunchyroll.com';

// main module
export const Crunchyroll = {
  async getAllSeries(page = 0) {
    // load catalogue
    const {data} = await axios.get(
      `${baseURL}/videos/anime/popular/ajax_page?pg=${page}`
    );
    // create cheerio cursor
    const $ = cheerio.load(data);
    const series = $('li.group-item')
      .map((index, el) => {
        const element = $(el);
        // get title & url
        const a = $('a', element);
        const title = a.attr('title');
        const id = a.attr('href');
        const url = `${baseURL}${id}`;
        // get image
        const img = $('img', element);
        const image = img.attr('src');
        // get videos count
        const seriesData = $('.series-data', element);
        const count = parseInt(
          seriesData.text().trim().replace('Videos', '').trim(),
          10
        );
        // return series data
        return {
          id,
          source: 'crunchyroll',
          title,
          url,
          image,
          count,
        };
      })
      .get();

    // store in the db
    await db.series.bulkDocs(series);

    return series;
  },
  async getEpisodes(series) {
    console.log('gettin episodes for:', series);
    // load episodes
    const {data} = await axios.get(series.url);
    console.log(data);
    // create cheerio cursor
    const $ = cheerio.load(data);
    const episodesContainer = $('.list-of-seasons ul.portrait-grid');
    const episodes = $('.group-item', episodesContainer)
      .map((index, el) => {
        const element = $(el);
        const id = $('a.episode', element).attr('href');
        const url = `${baseURL}${id}`;
        const img = $('img', element);
        console.log(img.parent().html());
        const image = img.attr('src') || img.attr('data-thumbnailurl');
        console.log(img.attr('srt'), img.attr('data-thumbnailurl'), image);
        const title = $('.series-title', element).text().trim();
        const description = $('.short-desc', element).text().trim();
        return {
          id,
          url,
          image,
          title,
          description,
        };
      })
      .get();

    // store in the db
    await db.episodes.bulkDocs(episodes);

    return episodes;
  },
  getEpisode(episode) {},
  getMySeries() {},
  search(query) {},
};
