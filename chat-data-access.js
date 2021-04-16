const fs = require('fs');
const net = require('net');
const _ = require('lodash');
const nanoid = require('nanoid').nanoid;
const utils = require('./utils');

exports.fetchAll = (key, filters) => {
  const events = parseFile();
  const messages = events.filter(evn => evn.type === 'message');
  
  return _.isEmpty(filters) ? messages : _.filter(messages, filters);
}

exports.writeMessage = (body) => {
  body.id = nanoid();
  body.timestamp = utils.unixTime();
  ({ port, ipaddr} = utils.getConfig());

  const socket = net.createConnection(port, ipaddr);
  socket.write(JSON.stringify(body));
  socket.end();

  return body;
}

const parseFile = () => {
  const chatlog = fs.readFileSync(utils.getConfig().logfile).toString();

  return chatlog.split("\n")
    .filter(entry => entry !== '')
    .map(entry => JSON.parse(entry.trim()));
}
