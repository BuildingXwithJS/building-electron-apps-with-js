// npm packages
import _ from 'lodash';
import React from 'react';
import {Observable} from 'rxjs';
import {Link} from 'react-router-dom';
// our packages
import db from '../db/index';
import PluginManager from '../api/index';
// our components
import Episode from '../components/episode/index';

export default class Series extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      episodes: [],
    };

    // trigger episodes loading
    this.init(props);
  }

  async componentDidMount() {
    const series = await this.getSeries(this.props);

    this.sub = Observable.fromEvent(
      db.episodes.changes({
        since: 0,
        live: true,
        include_docs: true,
      }),
      'change'
    )
      .filter(change => !change.deleted)
      .map(change => change.doc)
      .filter(doc => doc.series === series._id)
      .scan((acc, doc) => acc.concat([doc]), [])
      .debounceTime(1000)
      .subscribe(episodes => this.setState({episodes}));
  }

  componentWillUnmount() {
    this.sub.unsubscribe();
  }

  async getSeries(props) {
    const {location} = props;
    let series = location.state;
    if (!series) {
      const {data} = await db.current.get('series');
      series = data;
    }
    return series;
  }

  async init(props) {
    const series = await this.getSeries(props);
    PluginManager.getEpisodes(series);
  }

  render() {
    const {episodes} = this.state;

    return (
      <div>
        <nav className="nav">
          <div className="nav-left nav-menu">
            <div className="nav-item">
              <Link to="/" className=" button">
                <span className="icon">
                  <i className="fa fa-arrow-left" />
                </span>
                <span>Back</span>
              </Link>
            </div>
          </div>
        </nav>

        {_.chunk(episodes, 4).map((chunk, i) => (
          <div key={`chunk_${i}`} className="columns">
            {chunk.map(ep => <Episode key={ep._id} episode={ep} />)}
          </div>
        ))}
      </div>
    );
  }
}
