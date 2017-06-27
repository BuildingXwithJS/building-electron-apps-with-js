const express = require('express');
const setupWs = require('express-ws');
const uuidV1 = require('uuid/v1');

// init express app
const app = express();
// apply websockets to express
setupWs(app);

// chat sessions storage
const chatSessions = {};

// setup route
// "/berserk/berserk-season-2-erinnerungen-der-hexe-734281"
app.ws('/:series/:episode', (ws, req) => {
  const {series, episode} = req.params;
  const clientId = uuidV1();
  const chatKey = series + episode;

  if (!chatSessions[chatKey]) {
    chatSessions[chatKey] = {
      clients: [],
      messages: [],
    };
  }
  // alias it
  const session = chatSessions[chatKey];

  // assign index and store in memory db
  ws.uuid = clientId;
  session.clients.push(ws);

  ws.on('message', msg => {
    console.log(msg);
    session.messages.push(msg);
    session.clients.forEach(w => w.send(msg));
  });

  ws.on('close', () => {
    const clientIndex = session.clients.findIndex(c => c.uuid === clientId);
    session.clients.splice(clientIndex, 1);
    console.log('Client disconnected:', clientId, session.clients);
    if (session.clients.length === 0) {
      session.messages = [];
    }
  });

  console.log('New connection for', series, episode, 'with client:', clientId, '\n', session.clients);
  session.messages.forEach(msg => ws.send(msg));
});

app.listen(3000, () => {
  console.log('listening on :3000');
});
