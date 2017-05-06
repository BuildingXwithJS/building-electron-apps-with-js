// npm packages
import _ from 'lodash';
import React from 'react';
import {Observable} from 'rxjs';
// our packages
import db from '../db';
import {Crunchyroll} from '../api';
// our components
import Navbar from '../components/navbar';
import BookmarkEpisode from '../components/bookmarkEpisode';

export default class MyStuff extends React.Component {
  constructor() {
    super();

    this.state = {
      series: [],
    };

    // trigger list update
    Crunchyroll.getMySeries();
  }

  componentDidMount() {
    this.sub = Observable.fromEvent(
      db.bookmarkSeries.changes({
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
        <Navbar />

        <div>
          {series.map(s => <BookmarkEpisode key={s._id} episode={s} />)}
        </div>
      </div>
    );
  }
}
