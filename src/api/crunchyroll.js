// npm packages
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import cheerio from 'cheerio';
import electron from 'electron';
import {spawn} from 'child_process';

// our packages
import db from '../db';

// base URL used for most requests
const baseURL = 'http://www.crunchyroll.com';
// folder for videos
const userDataPath = (electron.app || electron.remote.app).getPath('userData');
const targetFolder = path.join(userDataPath, 'crunchyroll');
try {
  fs.accessSync(targetFolder);
} catch (e) {
  fs.mkdirSync(targetFolder);
}
console.log('Using target folder:', targetFolder);

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
        const _id = a.attr('href');
        const url = `${baseURL}${_id}`;
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
          _id,
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
    // load episodes
    const {data} = await axios.get(series.url);
    // create cheerio cursor
    const $ = cheerio.load(data);
    const episodesContainer = $('.list-of-seasons ul.portrait-grid');
    const episodes = $('.group-item', episodesContainer)
      .map((index, el) => {
        const element = $(el);
        const _id = $('a.episode', element).attr('href');
        const url = `${baseURL}${_id}`;
        const img = $('img', element);
        const image = img.attr('src') || img.attr('data-thumbnailurl');
        const title = $('.series-title', element).text().trim();
        const description = $('.short-desc', element).text().trim();
        return {
          _id,
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
  getEpisode(episode) {
    return new Promise((resolve, reject) => {
      console.log('loading episode:', episode);
      const filename = `${episode._id
        .replace(/^\//g, '')
        .replace(/\//g, '-')}.mp4`;
      const dl = spawn(
        'youtube-dl',
        ['--write-sub', '--sub-lang', 'enUS', '-o', filename, episode.url],
        {
          cwd: targetFolder,
        }
      );
      dl.stderr.on('data', data => {
        console.log(data.toString());
      });
      dl.stdout.on('close', () => {
        resolve(path.join(targetFolder, filename));
      });
    });
  },
  getMySeries() {},
  search(query) {},
};
