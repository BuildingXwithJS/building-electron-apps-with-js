// npm packages
import React from 'react';
import request from 'request-promise-native';
import cheerio from 'cheerio';
import {M3U} from 'playlist-parser';
import electron from 'electron';

// our packages
import db from '../../db/index';
import parseXml from './parseXml';
import decode from './subtitles/index';
import bytesToAss from './subtitles/ass';
import getSeries from './getSeries';

// base URL used for most requests
const baseURL = 'http://www.crunchyroll.com';

const sleep = t => new Promise(r => setTimeout(r, t));

// main module
class Crunchyroll {
  constructor() {
    this.authCookies = null;
    this.id = 'crunchyroll';

    this.isInited = this.init();
  }

  async init() {
    if (this.authCookies) {
      return;
    }

    // load auth parameters
    try {
      this.authCookies = await db.auth.get('crunchyroll');
    } catch (e) {
      if (e.name === 'not_found') {
        this.authCookies = null;
      }
    }
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
      if (win.webContents.getURL() === 'http://www.crunchyroll.com/') {
        // get all cookies
        win.webContents.session.cookies.get({}, async (error, cookies) => {
          if (error) {
            console.error('Error getting cookies:', error);
            return;
          }

          // store cookies
          this.authCookies = cookies.filter(c => c.domain.includes('crunchyroll.com'));
          await db.auth.put({_id: 'crunchyroll', cookies: this.authCookies});

          // close window
          win.close();
        });
      }
    });
    // Load a crunchyroll login page
    win.loadURL(`${baseURL}/login?next=%2F`);
  }

  async logout() {
    await db.auth.remove(this.authCookies);
    this.authCookies = null;
  }

  async getAllSeries(page = 0) {
    await this.isInited;

    // load catalogue
    const data = await request(`${baseURL}/videos/anime/popular/ajax_page?pg=${page}`);
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
        const count = parseInt(seriesData.text().trim().replace('Videos', '').trim(), 10);
        // return series data
        return {
          _id,
          source: this.id,
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
  }

  async getEpisodes(series) {
    await this.isInited;

    // load episodes
    const data = await request(series.url);
    // create cheerio cursor
    const $ = cheerio.load(data);
    const episodesContainer = $('.list-of-seasons');
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
    const $ = cheerio.load(data);
    // find available formats
    const formats = [];
    $('a[token^=showmedia]').each((index, el) => {
      const token = $(el).attr('token');
      if (!token.includes('showmedia.')) {
        return;
      }
      const formatId = token.replace('showmedia.', '').replace(/p$/, '');
      formats.push(formatId);
    });

    // get episode id from URL
    const format = formats[0];
    const idRegex = /([0-9]+)$/g;
    const idMatches = idRegex.exec(episode.url);
    const id = idMatches[0];

    // load xml of the episode
    const xmlUrl = `http://www.crunchyroll.com/xml/?req=RpcApiVideoPlayer_GetStandardConfig&` +
      `media_id=${id}&video_format=${format}&video_quality=${format}`;
    const xmlData = await request({
      url: xmlUrl,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      form: {
        // querystring.stringify(
        current_page: episode.url,
      },
    });

    const xmlObj = await parseXml(xmlData);
    const preload = xmlObj['config:Config']['default:preload'][0];
    const subtitlesInfo = preload.subtitles[0].subtitle;
    const streamInfo = preload.stream_info[0];
    const streamFile = streamInfo.file[0];

    // load stream urls playlist
    const streamFileData = await request(streamFile);
    const playlist = M3U.parse(streamFileData);

    // get subtitles
    const englishSubs = subtitlesInfo.map(s => s.$).filter(s => s.title.includes('English')).pop();
    const subData = await request(englishSubs.link);
    const subsObj = await parseXml(subData);
    const subsId = parseInt(subsObj.subtitle.$.id, 10);
    const subsIv = subsObj.subtitle.iv.pop();
    const subsData = subsObj.subtitle.data.pop();

    const subBytes = await decode(subsId, subsIv, subsData);
    const subtitlesText = await bytesToAss(subBytes);
    const subBlob = new Blob([subtitlesText], {
      type: 'application/octet-binary',
    });

    const subtitles = URL.createObjectURL(subBlob);
    const url = playlist.pop().file;
    const type = 'application/x-mpegURL';

    return {type, url, subtitles};
  }

  async getMySeries() {
    await this.isInited;

    if (this.authCookies === null) {
      await sleep(10);
      return this.getMySeries();
    }

    const jar = request.jar();
    // add auth cookies
    this.authCookies.cookies.forEach(data => {
      const cookie = request.cookie(`${data.name}=${data.value}`);
      jar.setCookie(cookie, `${baseURL}${data.path}`);
    });
    // force english language
    jar.setCookie(request.cookie(`c_locale=enUS`), baseURL);

    // request page html
    const data = await request({
      url: `${baseURL}/home/queue`,
      jar,
    });

    // load into cheerio
    const $ = cheerio.load(data);
    const mainContent = $('#main_content');
    const items = $('li.queue-item', mainContent)
      .map((index, el) => {
        const element = $(el);
        const epLink = $('a.episode', element);
        const episodeTitle = epLink.attr('title');
        const episodeImage = $('img.landscape', element).attr('src');
        const episodeDescription = $('.short-desc', element).text().trim();
        const seriesTitle = $('.series-title', element).text().trim();
        const seriesUrl = $('div.queue-controls > a.left', element).attr('href');

        const link = epLink.attr('href');
        const linkParts = link.split('?');
        const episodeUrl = linkParts[0];
        const episodeTime = linkParts[1].replace('t=', '');

        return {
          episodeTitle,
          episodeImage,
          episodeUrl,
          episodeTime,
          episodeDescription,
          seriesTitle,
          seriesUrl,
        };
      })
      .toArray();

    const newSeries = [];

    for (let item of items) {
      // mark series as bookmarked or create a new one
      try {
        const series = await db.series.get(item.seriesUrl);
        if (!series.bookmarked) {
          await db.series.put(Object.assign(series, {bookmarked: true}));
        }
      } catch (e) {
        // if series not found - get full info, then save to db
        const series = await getSeries(item.seriesUrl);
        newSeries.push(series);
      }
    }

    await db.series.bulkDocs(newSeries);

    return items;
  }

  async search(query) {
    await this.isInited;

    // clear old search results
    const oldDocs = await db.search.allDocs();
    await Promise.all(oldDocs.rows.map(row => db.search.remove(row.id, row.value.rev)));

    const jar = request.jar();
    // force english language
    jar.setCookie(request.cookie(`c_locale=enUS`), baseURL);

    // load search catalogue
    const body = await request({
      url: `${baseURL}/ajax/?req=RpcApiSearch_GetSearchCandidates`,
      jar,
    });

    // parse json
    const lines = body.split('\n');
    const dataJson = lines[1];
    const data = JSON.parse(dataJson);

    // filter series
    const series = data.data.filter(it => it.type === 'Series');
    // find matches
    const matches = series.filter(it => it.name.toLowerCase().includes(query.toLowerCase())).map(it => ({
      _id: it.link,
      source: this.id,
      title: it.name,
      url: `${baseURL}${it.link}`,
      image: it.img,
      count: '',
    }));

    // store into search db
    await db.search.bulkDocs(matches);

    return matches;
  }

  drawSettings() {
    const loggedIn = this.authCookies !== null;

    return (
      <div id="crunchyroll" key="crunchyroll" className="card">
        <header className="card-header">
          <p className="card-header-title">
            Crunchyroll
          </p>
        </header>
        <div className="card-content">
          Crunchyroll settings card.
        </div>
        <footer className="card-footer">
          {loggedIn
            ? <a id="crLogout" className="card-footer-item" href="#crlogout" onClick={() => this.logout()}>
                Logout
              </a>
            : <a id="crLogin" className="card-footer-item" href="#crlogin" onClick={() => this.auth()}>
                Login
              </a>}
        </footer>

      </div>
    );
  }
}

export default new Crunchyroll();
