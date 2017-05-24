// npm packages
import React from 'react';
import request from 'request-promise-native';
import cheerio from 'cheerio';

// our packages
import db from '../../db';

// base URL used for most requests
const baseURL = 'http://youtube.com';

// main module
class Youtube {
  constructor() {
    this.authCookies = null;
    this.id = 'youtube';

    this.isInited = this.init();
  }

  async init() {
    if (this.authCookies) {
      return;
    }

    // load auth parameters
    try {
      this.authCookies = await db.auth.get('youtube');
    } catch (e) {
      if (e.name === 'not_found') {
        this.authCookies = null;
      }
    }
  }

  async logout() {
    await db.auth.remove(this.authCookies);
    this.authCookies = null;
  }

  async getAllSeries() {
    await this.isInited;

    // load catalogue
    const data = await request(`${baseURL}/feed/trending`);
    // create cheerio cursor
    const $ = cheerio.load(data);
    const series = $('li.expanded-shelf-content-item-wrapper')
      .map((index, el) => {
        const element = $(el);
        // get title & url
        const a = $('a.g-hovercard', element);
        const title = a.text();
        const _id = a.attr('href');
        const url = `${baseURL}${_id}`;
        // get image
        const img = $('img', element);
        const imageUrl = img.attr('src');
        const imageThumb = img.attr('data-thumb');
        const image = imageUrl.startsWith('/yts/img/pixel') ? imageThumb : imageUrl;
        // return series data
        return {
          _id,
          source: this.id,
          title,
          url,
          image,
          count: -1,
        };
      })
      .get();

    // store in the db
    await db.series.bulkDocs(series);

    return series;
  }

  async getEpisodes(series) {
    return {
      _id: 'other',
      url: 'asd',
      image: 'https://img.youtube.com/vi/02Ikb6B55Qc/maxresdefault.jpg',
      title: 'Test',
      description: 'Test description',
      source: this.id,
      series: series._id,
    };
  }

  async getEpisode(episode) {
    // return {type, url, subtitles};
  }

  async getMySeries() {}

  async search(query) {}

  drawSettings() {
    return (
      <div className="card">
        Youtube settings
      </div>
    );
  }
}

export default new Youtube();
