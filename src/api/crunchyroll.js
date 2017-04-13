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
        const url = `${baseURL}${a.attr('href')}`;
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
  getEpisodes(series) {},
  getEpisode(episode) {},
  getMySeries() {},
  search(query) {},
};
