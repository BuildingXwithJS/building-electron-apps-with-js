// npm packages
import React from 'react';
import request from 'request-promise-native';
import cheerio from 'cheerio';
import electron from 'electron';

// our packages
import db from '../../db/index';

// base URL used for most requests
const baseURL = 'http://youtube.com';
const continueURL = 'https://www.youtube.com/signin?' +
  'action_handle_signin=true&' +
  'app=desktop&' +
  'next=%2F&' +
  'hl=en&' +
  'feature=sign_in_button';
const loginURL = 'https://accounts.google.com/ServiceLogin?' +
  'passive=true&' +
  'continue=' +
  encodeURIComponent(continueURL) +
  '&service=youtube&uilel=3&hl=en';

// main module
class Youtube {
  constructor() {
    this.authCookies = null;
    this.id = 'youtube';

    this.isInited = this.init();
  }

  auth() {
    if (this.authCookies !== null) {
      // console.log('already authorized:', this.authCookies);
      return;
    }

    // create new electron browser window
    const remote = electron.remote;
    const BrowserWindow = remote.BrowserWindow;
    let win = new BrowserWindow({width: 800, height: 600});
    // cleanup on close
    win.on('closed', () => {
      win = null;
    });
    // wait for page to finish loading
    win.webContents.on('did-finish-load', () => {
      // if auth was succesful
      if (win.webContents.getURL() === 'https://www.youtube.com/') {
        // get all cookies
        win.webContents.session.cookies.get({}, async (error, cookies) => {
          if (error) {
            console.error('Error getting cookies:', error);
            return;
          }

          // store cookies
          this.authCookies = cookies.filter(c => c.domain.includes('youtube.com'));
          await db.auth.put({_id: 'youtube', cookies: this.authCookies});

          // close window
          win.close();
        });
      }
    });
    // Load a crunchyroll login page
    win.loadURL(loginURL);
  }

  async logout() {
    await db.auth.remove(this.authCookies);
    this.authCookies = null;
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

  async getMySeries() {
    await this.isInited;

    const jar = request.jar();
    // add auth cookies
    this.authCookies.cookies.forEach(data => {
      const cookie = request.cookie(`${data.name}=${data.value}`);
      jar.setCookie(cookie, `${baseURL}${data.path}`);
    });

    // load catalogue
    const data = await request({url: `${baseURL}/feed/subscriptions`, jar});
    // create cheerio cursor
    const $ = cheerio.load(data);
    const fetchedChannels = [];
    const items = $('li.yt-shelf-grid-item')
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
        // make sure we're only showing channel once
        if (fetchedChannels.indexOf(_id) !== -1) {
          return undefined;
        }
        fetchedChannels.push(_id);
        // return series data
        return {
          _id,
          source: this.id,
          title,
          url,
          image,
          bookmarked: true,
          count: -1,
        };
      })
      .get()
      .filter(it => it !== undefined);

    const newSeries = [];

    for (let item of items) {
      // mark series as bookmarked or create a new one
      try {
        const series = await db.series.get(item._id);
        if (!series.bookmarked) {
          await db.series.put(Object.assign(series, {bookmarked: true}));
        }
      } catch (e) {
        // if series not found - get full info, then save to db
        newSeries.push(item);
      }
    }

    // store in the db
    await db.series.bulkDocs(newSeries);

    return items;
  }

  async search(query) {
    await this.isInited;

    // clear old search results
    const oldDocs = await db.search.allDocs();
    await Promise.all(oldDocs.rows.map(row => db.search.remove(row.id, row.value.rev)));

    // load search results
    const data = await request(`${baseURL}/results?search_query=${encodeURIComponent(query)}`);
    // create cheerio cursor
    const $ = cheerio.load(data);
    const fetchedChannels = [];
    const matches = $('div.yt-lockup-tile')
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
        // make sure we're only showing channel once
        if (fetchedChannels.indexOf(_id) !== -1) {
          return undefined;
        }
        fetchedChannels.push(_id);
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

    // store into search db
    await db.search.bulkDocs(matches);

    return matches;
  }

  drawSettings() {
    const loggedIn = this.authCookies !== null;

    return (
      <div key="youtube" className="card">
        <header className="card-header">
          <p className="card-header-title">
            YouTube
          </p>
        </header>
        <div className="card-content">
          Youtube settings card.
        </div>
        <footer className="card-footer">
          {loggedIn
            ? <a className="card-footer-item" href="#crlogout" onClick={() => this.logout()}>
                Logout
              </a>
            : <a className="card-footer-item" href="#crlogin" onClick={() => this.auth()}>
                Login
              </a>}
        </footer>

      </div>
    );
  }
}

export default new Youtube();
