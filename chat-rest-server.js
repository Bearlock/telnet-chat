const nanoid = require('nanoid');
const express = require('express');
const validate = require('jsonschema').validate;
const dataAccess = require('./chat-data-access.js');

const app = express();
app.use(express.json());

const messageSchema = {
  id: 'MessageSchema',
  type: 'object',
  properties: {
    type: {
      type: 'string',
      pattern: 'message'
    },
    payload: {
      type: 'string'
    },
    chatroom: {
      type: 'string'
    },
    uid: {
      type: 'string'
    }
  }
}

app.listen(8080, () => {
  console.clear();
  console.log('Server running on port 8080');
});

app.get('/messages', (req, res, next) => {
  console.log('GET Filters: ', req.query);
  res.json((dataAccess.fetchAll('messages', req.query)));
});

app.post('/messages', (req, res, next) => {
  console.log('POST payload :', req.body);
  try {
    validate(req.body, messageSchema, { throwFirst: true });
  } catch (exception) {
    return res.status(400).json({ error: 'Invalid message schema!' });
  }

  return res.json(dataAccess.writeMessage(req.body));
})
