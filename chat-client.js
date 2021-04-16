const net = require('net');
const readline = require('readline');
const utils = require('./utils.js');

const myUser = { username: null, uid: null, chatroom: null };
const chatClient = 'chat-client';
const slashCommands = { '/changename': 'change-name', '/join': 'join-chat' };
const config = utils.getConfig();
({ port, ipaddr } = config);

const now = () => utils.prettyLocalTime(utils.unixTime());
const writeOutput = (who, what, when) => {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  console.log(`${who} @ ${when}> ${what}`);
}

const processSlashCommand = (tokens, eventObject) => {
  if (tokens.length > 1 && Object.keys(slashCommands).includes(tokens[0])) {
    eventObject.type = slashCommands[tokens[0]];
    eventObject.payload = tokens[1];
    return eventObject;
  }

  return null;
}

const client = net.createConnection(port, ipaddr, () => {
  writeOutput(chatClient, 'Connected!', now());
});

const reader = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const prompt = () => process.stdout.write(`[${myUser.chatroom}] ${myUser.username}> `);

client.on('data', data => {
  const eventObject = JSON.parse(data.toString());
  ({ type, timestamp, payload } = eventObject); 
  let output;

  if (type === 'registration') {
    myUser.username = payload.username;
    myUser.uid = payload.uid;
    myUser.chatroom = payload.chatroom;

    writeOutput(chatClient, `Welcome! Your username is ${payload.username} and you're in the ${payload.chatroom}.`, now());
    writeOutput(chatClient, `To change your username use the /changename slash command, e.g '/changename Xxbernies-mittensxX'`, now());
    writeOutput(chatClient, `To join a different chatroom, use the /join slash command, e.g '/join kitty-cat-chat'`, now());

  } else if (type === 'new-name') {
    myUser.username = payload;
  } else if (type === 'new-room') {
    myUser.chatroom = payload;
  } else {
    writeOutput(eventObject.username, payload, utils.prettyLocalTime(timestamp));
  }

  prompt();
});

client.on('close', () => {
  writeOutput(chatClient, 'Server shutting down. Bye now!', now());
  process.exit();
});


reader.on('line', line => {
  const trimmedLine = line.trim();
  let eventObject = {
    type: 'message',
    timestamp: utils.unixTime(),
    payload: trimmedLine,
    username: myUser.username,
    chatroom: myUser.chatroom,
    uid: myUser.uid
  };

  if (trimmedLine.startsWith('/')) {
    eventObject = processSlashCommand(trimmedLine.split(' '), eventObject);
    if (!eventObject) {
      writeOutput(chatClient, 'Slash command error', now());
      return;
    }
  }

  prompt();
  client.write(JSON.stringify(eventObject));
});

console.clear();
console.log('Connecting with config:', config);
