import React from 'react';
import ReactDOM from 'react-dom';
import {HashRouter, Route, Switch} from 'react-router-dom';

// pages
import Home from './pages/home';
import Series from './pages/series';

// render on page
ReactDOM.render(
  <HashRouter>
    <div className="container is-fluid">
      <Switch>
        <Route exact path="/" component={Home} />
        <Route path="/series/:id" component={Series} />
        <Route component={Home} />
      </Switch>
    </div>
  </HashRouter>,
  document.getElementById('app')
);
