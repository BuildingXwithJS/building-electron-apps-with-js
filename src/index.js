import React from 'react';
import ReactDOM from 'react-dom';
import {BrowserRouter, Route, Link} from 'react-router-dom';

import Home from './pages/home';
import Other from './pages/other';

// render on page
ReactDOM.render(
  <BrowserRouter>
    <div>
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/other">Other</Link></li>
      </ul>

      <hr />

      <Route exact path="/" component={Home} />
      <Route path="/other" component={Other} />
    </div>
  </BrowserRouter>,
  document.getElementById('app')
);
