// npm packages
import _ from 'lodash';
import React from 'react';
import {Link} from 'react-router-dom';
// our packages
import {Crunchyroll} from '../api';

export default class Series extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      episode: null,
    };

    // trigger episode loading
    const {location} = props;
    Crunchyroll.getEpisode(location.state);
  }

  render() {
    const {episode} = this.state;

    return (
      <div>
        episode video here
      </div>
    );
  }
}
