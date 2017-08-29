// npm packages
import React from 'react';
import {Link} from 'react-router-dom';

// our packages
import PluginManager from '../api/index';

export default class Settings extends React.Component {
  constructor() {
    super();

    this.state = {};
  }

  componentDidMount() {}

  componentWillUnmount() {}

  render() {
    // const {series} = this.state;

    return (
      <div>
        <nav className="nav">
          <div className="nav-left nav-menu">
            <div className="nav-item">
              <Link to="/" className=" button">
                <span className="icon">
                  <i className="fa fa-arrow-left" />
                </span>
                <span>Back</span>
              </Link>
            </div>
          </div>
        </nav>

        <div className="content columns">
          <div className="column">
            {PluginManager.drawSettings()}
          </div>
        </div>
      </div>
    );
  }
}
