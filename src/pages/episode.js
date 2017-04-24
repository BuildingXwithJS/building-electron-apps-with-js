// npm packages
import _ from 'lodash';
import React from 'react';
import videojs from 'video.js';
import {Link} from 'react-router-dom';
// our packages
import {Crunchyroll} from '../api';

export default class Series extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      episode: null,
      filename: null,
    };

    // trigger episode loading
    this.init(props);
  }

  async init(props) {
    const {location} = props;
    const filename = await Crunchyroll.getEpisode(location.state);
    this.setState({
      episode: location.state,
      filename,
    });
  }

  componentDidUpdate() {
    const {episode, filename} = this.state;

    if (!episode || !filename) {
      return;
    }

    videojs('video');
  }

  render() {
    const {episode, filename} = this.state;

    if (!episode || !filename) {
      return <div>Loading...</div>;
    }

    return (
      <div>
        <video id="video" className="video-js" controls autoPlay preload="auto">
          <source src={filename} type="video/mp4" />
        </video>
      </div>
    );
  }
}
