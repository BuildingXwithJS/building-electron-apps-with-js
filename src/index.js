import React from 'react';
import ReactDOM from 'react-dom';
import {HashRouter, Route, Switch} from 'react-router-dom';

// pages
import Home from './pages/home';
import MyStuff from './pages/my';
import Settings from './pages/settings';
import Series from './pages/series';
import Episode from './pages/episode';

// render on page
ReactDOM.render(
  <HashRouter>
    <div className="container is-fluid">
      <Switch>
        <Route exact path="/" component={Home} />
        <Route exact path="/settings" component={Settings} />
        <Route exact path="/my" component={MyStuff} />
        <Route path="/series/:id" component={Series} />
        <Route path="/episode/:id" component={Episode} />
        <Route component={Home} />
      </Switch>
    </div>
  </HashRouter>,
  document.getElementById('app')
);
