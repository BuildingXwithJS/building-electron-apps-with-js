// npm packages
import React from 'react';
import {Link} from 'react-router-dom';
// our packages
import {Crunchyroll} from '../api';

export default class Series extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      episode: null,
      file: null,
    };

    // trigger episode loading
    this.init(props);
  }

  componentDidUpdate() {
    const {episode, file} = this.state;

    if (!episode || !file) {
      return;
    }

    videojs('video', {
      plugins: {
        ass: {
          src: file.subtitles,
        },
      },
    });
  }

  async init(props) {
    const {location} = props;
    const file = await Crunchyroll.getEpisode(location.state);
    this.setState({
      episode: location.state,
      file,
    });
  }

  render() {
    const {episode, file} = this.state;

    if (!episode || !file) {
      return <div>Loading...</div>;
    }

    return (
      <div>
        <video id="video" className="video-js" controls autoPlay preload="auto">
          <source src={file.url} type={file.type} />
        </video>
      </div>
    );
  }
}
