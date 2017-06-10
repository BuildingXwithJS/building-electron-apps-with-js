const express = require('express');
const setupWs = require('express-ws');
const uuidV1 = require('uuid/v1');

// init express app
const app = express();
// apply websockets to express
setupWs(app);

const clients = [];
const chatSessions = {};

// setup route
// "/berserk/berserk-season-2-erinnerungen-der-hexe-734281"
app.ws('/:series/:episode', (ws, req) => {
  const {series, episode} = req.params;
  const clientId = uuidV1();
  const chatKey = series + episode;

  if (!chatSessions[chatKey]) {
    chatSessions[chatKey] = [];
  }

  // assign index and store in memory db
  ws.uuid = clientId;
  clients.push(ws);

  ws.on('message', msg => {
    console.log(msg);
  });

  ws.on('close', () => {
    const clientIndex = clients.findIndex(c => c.uuid === clientId);
    clients.splice(clientIndex, 1);
    console.log('Client disconnected:', clientId, clients);
  });

  console.log('New connection for', series, episode, 'with client:', clientId, '\n', clients);
});

app.listen(3000);
