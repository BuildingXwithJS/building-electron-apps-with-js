// npm packages
import React from 'react';

export default ({series}) => (
  <div className="column card">
    <div className="card-image">
      <figure className="image">
        <img src={series.image} alt={series.title} />
      </figure>
    </div>
    <div className="card-content">
      <div className="media">
        <div className="media-content">
          <p className="title is-4">{series.title}</p>
          <p className="subtitle is-6">Videos count: {series.count}</p>
        </div>
      </div>
    </div>
  </div>
);
