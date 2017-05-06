// npm packages
import _ from 'lodash';
import React from 'react';
import {Observable} from 'rxjs';
// our packages
import db from '../db';
import {Crunchyroll} from '../api';
// our components
import Series from '../components/series';

export default class Home extends React.Component {
  constructor() {
    super();

    this.state = {
      series: [],
    };

    // trigger list update
    Crunchyroll.getAllSeries();
    // Crunchyroll.getEpisode({url: 'http://www.crunchyroll.com/boruto-naruto-next-generations/episode-4-a-ninjutsu-battle-of-the-sexes-732529'})
  }

  componentDidMount() {
    this.sub = Observable.fromEvent(
      db.series.changes({
        since: 0,
        live: true,
        include_docs: true,
      }),
      'change'
    )
      .filter(change => !change.deleted)
      .map(change => change.doc)
      .scan((acc, doc) => acc.concat([doc]), [])
      .debounceTime(1000)
      .subscribe(series => this.setState({series}));
  }

  componentWillUnmount() {
    this.sub.unsubscribe();
  }

  render() {
    const {series} = this.state;

    return (
      <div>
        {_.chunk(series, 4).map((chunk, i) => (
          <div key={`chunk_${i}`} className="columns">
            {chunk.map(s => <Series key={s._id} series={s} />)}
          </div>
        ))}
      </div>
    );
  }
}
