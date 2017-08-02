// npm packages
import _ from 'lodash';
import React from 'react';
import {Observable} from 'rxjs';
// our packages
import db from '../db/index';
import PluginManager from '../api/index';
// our components
import Navbar from '../components/navbar/index';
import Series from '../components/series/index';

export default class MyStuff extends React.Component {
  constructor() {
    super();

    this.state = {
      series: [],
    };

    // trigger list update
    PluginManager.getMySeries();
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
      .filter(doc => doc.bookmarked)
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
        <Navbar />

        {_.chunk(series, 4).map((chunk, i) => (
          <div key={`chunk_${i}`} className="tile is-ancestor">
            {chunk.map(s => <Series key={s._id} series={s} />)}
          </div>
        ))}
      </div>
    );
  }
}
