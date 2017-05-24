// npm packages
import _ from 'lodash';
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
    await this.isInited;

    // load episodes
    const data = await request(`${series.url}/videos`);
    // create cheerio cursor
    const $ = cheerio.load(data);
    const episodesContainer = $('ul.channels-browse-content-grid');
    const episodes = $('.channels-content-item', episodesContainer)
      .map((index, el) => {
        const element = $(el);
        const a = $('a.yt-uix-tile-link', element);
        const _id = a.attr('href');
        const title = a.attr('title').trim();
        const url = `${baseURL}${_id}`;
        const img = $('img', element);
        const image = img.attr('src');
        const description = $('.accessible-description', element).text().trim();
        return {
          _id,
          url,
          image,
          title,
          description,
          source: this.id,
          series: series._id,
        };
      })
      .get();

    // store in the db
    await db.episodes.bulkDocs(episodes);

    return episodes;
  }

  async getEpisode(episode) {
    await this.isInited;

    // load episode page
    const data = await request(episode.url);
    // load into cheerio
    const streamsRegex = /"url_encoded_fmt_stream_map":"(.+?)"/gm;
    const res = streamsRegex.exec(data);
    if (!res) {
      throw new Error('Not able to get streams!');
    }

    const streamsString = decodeURIComponent(res[1]);
    const streamDataRegex = /url=(.+?)\\.+?type=(.+?);/gm;
    const stream = streamDataRegex.exec(streamsString);

    if (!stream) {
      throw new Error('Not able to get streams!');
    }

    const subtitles = undefined;
    const url = stream[1];
    const type = stream[2];

    return {type, url, subtitles};
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
