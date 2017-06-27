// npm packages
import React from 'react';

// our packages
import Message from './message';

export default class Chat extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      episode: props.episode,
      connected: false,
      username: undefined,
      messages: [],
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.episode && (!this.state.episode || nextProps.episode._id !== this.state.episode._id)) {
      this.setState({episode: nextProps.episode, messages: [], connected: false}, () => {
        this.connectToServer();
      });
    }
  }

  setUsername() {
    const username = this.usernameInput.value;
    this.setState({username});
  }

  connectToServer() {
    const {episode} = this.state;

    // Create WebSocket connection.
    const url = `ws://localhost:3000${episode._id}`;
    this.socket = new WebSocket(url);

    // Connection opened
    this.socket.addEventListener('open', () => this.setState({connected: true}));

    // Listen for messages
    this.socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      console.log('Message from server', message);
      const {messages: oldMessages} = this.state;
      const messages = oldMessages.concat([message]).sort((a, b) => a.date < b.date);
      this.setState({messages});
    });
  }

  sendMessage() {
    const message = this.messageInput.value;

    if (!message || message.length < 3) {
      return;
    }

    this.messageInput.value = '';
    this.socket.send(JSON.stringify({user: this.state.username, message, date: new Date()}));
  }

  handleMessageKey(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.sendMessage();
      return false;
    }

    return true;
  }

  render() {
    const {username, messages, connected} = this.state;

    if (!connected) {
      return (
        <div className="column" style={{width: 340, maxWidth: 340, display: 'flex', flexDirection: 'column'}}>
          Connecting..
        </div>
      );
    }

    return (
      <div className="column" style={{width: 340, maxWidth: 340, display: 'flex', flexDirection: 'column'}}>
        <div className="is-flex" style={{flexGrow: 1, flexDirection: 'column'}}>
          {messages.map((m, i) => <Message key={`msg_${i}`} message={m} />)}
        </div>
        {username &&
          <div className="is-flex">
            <div className="field has-addons" style={{flexGrow: 1}}>
              <p className="control" style={{flexGrow: 1}}>
                <input
                  className="input"
                  type="text"
                  placeholder="Send a message.."
                  ref={m => {
                    this.messageInput = m;
                  }}
                  onKeyUp={e => this.handleMessageKey(e)}
                />
              </p>
              <p className="control" style={{marginRight: 10}}>
                <a className="button is-info" onClick={() => this.sendMessage()}>
                  Send
                </a>
              </p>
            </div>
          </div>}
        {!username &&
          <div className="is-flex">
            <div className="field has-addons" style={{flexGrow: 1}}>
              <p className="control" style={{flexGrow: 1}}>
                <input
                  className="input"
                  type="text"
                  placeholder="Pick a username.."
                  ref={u => {
                    this.usernameInput = u;
                  }}
                />
              </p>
              <p className="control" style={{marginRight: 10}}>
                <a className="button is-primary" onClick={() => this.setUsername()}>
                  Set username
                </a>
              </p>
            </div>
          </div>}
      </div>
    );
  }
}
