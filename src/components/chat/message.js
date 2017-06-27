// npm packages
import React from 'react';

export default ({message}) => {
  const date = new Date(message.date);

  return (
    <article className="media">
      <div className="media-content">
        <div className="content">
          <p>
            <strong>{message.user}</strong>
            {' '}
            <small>{date.toLocaleTimeString()} {date.toLocaleDateString()}</small>
            <br />
            {message.message}
          </p>
        </div>
      </div>
    </article>
  );
};
