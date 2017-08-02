// npm packages
import React from 'react';
// our packages
import Chat from '../components/chat/index';
import PluginManager from '../api/index';

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
      fluid: true,
      plugins: {
        ass: {
          src: file.subtitles,
        },
      },
    });
  }

  componentWillUnmount() {
    videojs('video').dispose();
  }

  async init(props) {
    const {location} = props;
    const file = await PluginManager.getEpisode(location.state);
    this.setState({
      episode: location.state,
      file,
    });
  }

  render() {
    const {episode, file} = this.state;
    const {history} = this.props;

    let body = <div>Loading...</div>;

    if (episode && file) {
      body = (
        <video
          id="video"
          className="video-js vjs-default-skin vjs-big-play-centered vjs-fluid"
          controls
          autoPlay
          preload="auto"
        >
          <source src={file.url} type={file.type} />
        </video>
      );
    }

    return (
      <div>
        <nav className="nav">
          <div className="nav-left nav-menu">
            <div className="nav-item">
              <a href="#back" className="button" onClick={() => history.goBack()}>
                <span className="icon">
                  <i className="fa fa-arrow-left" />
                </span>
                <span>Back</span>
              </a>
            </div>
          </div>
        </nav>

        <div className="columns">
          <div className="column">
            {body}
          </div>
          <Chat episode={episode} />
        </div>
      </div>
    );
  }
}
