const fs = require('fs');
const net = require('net');
const faker = require('faker');
const utils = require('./utils.js');
const nanoid = require('nanoid').nanoid;

const users = {};
({ port, ipaddr, logfile } = utils.getConfig());
const logStream = fs.createWriteStream(logfile, { flags: 'a' });

const log = (output) => {
  logStream.write(output + "\n");
  console.log(output);
}

const processWrite = (socket, data) => {
  const incomingEvent = JSON.parse(data.toString());

  ['join-chat', 'change-name'].includes(incomingEvent.type)
    ? processSlashCommand(socket, incomingEvent) 
    : processMessage(incomingEvent);
}

const processMessage = (eventObject) => {
  eventObject.id = nanoid();
  output = JSON.stringify(eventObject);

  broadcastToSpecificChats(eventObject, [eventObject.chatroom]);
  log(output);
}

const processSlashCommand = (socket, eventObject) => {
  const outgoingEvent = {
    id: nanoid(),
    type: 'message',
    uid: eventObject.uid
  };

  if (eventObject.type === 'join-chat') {
    oldRoom = users[eventObject.uid].chatroom;
    users[eventObject.uid].chatroom = eventObject.payload;

    outgoingEvent.timestamp = utils.unixTime();
    outgoingEvent.payload = `${eventObject.username} left ${oldRoom} and joined ${eventObject.payload}!`;
    outgoingEvent.username = 'chat-server'
    output = JSON.stringify(outgoingEvent);

    socket.write(JSON.stringify({ type: 'new-room', payload: eventObject.payload, timestamp: utils.unixTime()}));
    broadcast(outgoingEvent);
    log(output);
  }

  if (eventObject.type === 'change-name' ) {
    if (!usernameInUse(eventObject.payload)) {
      users[eventObject.uid].username = eventObject.payload;
      socket.write(JSON.stringify({ type: 'new-name', payload: eventObject.payload, timestamp: utils.unixTime()}));

      outgoingEvent.timestamp = utils.unixTime();
      outgoingEvent.payload = `User ${eventObject.username} is now ${eventObject.payload}!`;
      outgoingEvent.username = 'chat-server'
      output = JSON.stringify(outgoingEvent);

      broadcast(outgoingEvent);
      log(output);
    } else {
      outgoingEvent.timestamp = utils.unixTime();
      outgoingEvent.payload = `Error: could not update username to ${eventObject.payload} from ${eventObject.username}. It's already in use. Please try again.`
      outgoingEvent.username = 'chat-server'

      socket.write(JSON.stringify(outgoingEvent));
    }
  }
}

const broadcast = (eventObject) => {
  Object.values(users).forEach(({ client }) => client.write(JSON.stringify(eventObject)));
}

const broadcastToSpecificChats = (eventObject, chats) => {
  Object.entries(users).forEach(([uid, { client, chatroom }])  => {
    if (eventObject.uid !== uid && chats.includes(chatroom)) {
      client.write(JSON.stringify(eventObject));
    }
  });
}

const createUser = () => {
  let newUsername = faker.internet.userName();
  
  while (usernameInUse(newUsername)) {
    newUserName = faker.internet.userName();
  }

  return { username: newUsername, uid: nanoid(), chatroom: 'general' };
}

const usernameInUse = (username) => {
  return Object.values(users).map(elem => elem.username).includes(username);
}

const server = net.createServer((socket) => {
  console.log('Hey! A client connected');

  ({ username, uid, chatroom } = createUser());
  users[uid] = { username, chatroom, client: socket };

  const eventObject = { 
    id: nanoid(),
    type: 'registration',
    payload: {
      username,
      uid,
      chatroom
    },
    timestamp: utils.unixTime()
  };

  const eventMessage = JSON.stringify(eventObject);
  log(eventMessage);
  socket.write(eventMessage);

  socket.on('data', (data) => {
    processWrite(socket, data);
  });
    
});

console.clear();
server.listen({ host: ipaddr, port });
console.log(`Starting chat server on ${ipaddr}:${port}. . .`);
