// npm packages
import React from 'react';

export default ({series}) => (
  <div>
    <img src={series.image} />
    <a href={series.url}>{series.title}</a>
    <span>{series.count}</span>
  </div>
);
