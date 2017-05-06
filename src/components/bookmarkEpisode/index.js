// npm packages
import React from 'react';
import {withRouter} from 'react-router-dom';

export default withRouter(({episode, history}) => {
  const openEpisodePage = () => {
    // but you can use a location instead
    const location = {
      pathname: `/episode${episode.episodeUrl}`,
      state: null, // FIXME: make it work
    };

    history.push(location);
  };

  return (
    <div className="media" onClick={openEpisodePage}>
      <figure className="media-left">
        <p className="image is-64x64">
          <img src={episode.episodeImage} alt={episode.episodeTitle} />
        </p>
      </figure>

      <div className="media-content">
        <div className="content">
          <p>
            <strong>{episode.episodeTitle}</strong>
            {' '}
            <small><a href={episode.seriesUrl}>{episode.seriesTitle}</a></small>
            {' '}
            <br />
            {episode.episodeDescription}
          </p>
        </div>
      </div>
    </div>
  );
});
