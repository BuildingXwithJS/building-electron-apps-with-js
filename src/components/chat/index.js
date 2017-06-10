// npm packages
import React from 'react';

export default class Chat extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      episode: props.episode,
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.episode && (!this.state.episode || nextProps.episode._id !== this.state.episode._id)) {
      this.setState({episode: nextProps.episode}, () => {
        this.connectToServer();
      });
    }
  }

  connectToServer() {
    const {episode} = this.state;

    // Create WebSocket connection.
    const url = `ws://localhost:3000${episode._id}`;
    this.socket = new WebSocket(url);

    // Connection opened
    // this.socket.addEventListener('open', event => {
    // this.socket.send('Hello Server!');
    // });

    // Listen for messages
    this.socket.addEventListener('message', event => {
      console.log('Message from server', event.data);
    });
  }

  render() {
    return (
      <div className="column" style={{width: 340, maxWidth: 340, display: 'flex', flexDirection: 'column'}}>
        <div className="is-flex" style={{flexGrow: 1}}>
          Chat history
        </div>
        <div className="is-flex">
          <div className="field has-addons" style={{flexGrow: 1}}>
            <p className="control" style={{flexGrow: 1}}>
              <input className="input" type="text" placeholder="Send a message.." />
            </p>
            <p className="control" style={{marginRight: 10}}>
              <a className="button is-info">
                Send
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }
}
