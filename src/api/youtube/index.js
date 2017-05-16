// npm packages
import React from 'react';
import request from 'request-promise-native';
import cheerio from 'cheerio';

// our packages
import db from '../../db';

// main module
class Youtube {
  constructor() {
    this.id = 'youtube';
  }

  async getAllSeries(page = 0) {
    return [
      {
        _id: 'test',
        source: this.id,
        title: 'Youtube test',
        url: 'asd',
        image: 'https://img.youtube.com/vi/02Ikb6B55Qc/maxresdefault.jpg',
        count: 1,
      },
    ];
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
