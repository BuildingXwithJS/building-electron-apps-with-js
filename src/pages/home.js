// npm packages
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
        {series.map(s => <Series key={s._id} series={s} />)}
      </div>
    );
  }
}
