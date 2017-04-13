import React from 'react';
import ReactDOM from 'react-dom';
import {BrowserRouter, Route, Link, Switch} from 'react-router-dom';

// pages
import Home from './pages/home';
import Other from './pages/other';

// render on page
ReactDOM.render(
  <BrowserRouter>
    <div className="container is-fluid">
      <Switch>
        <Route exact path="/" component={Home} />
        <Route path="/other" component={Other} />
        <Route component={Home} />
      </Switch>
    </div>
  </BrowserRouter>,
  document.getElementById('app')
);
