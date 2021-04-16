const fs = require('fs');
const validate = require('jsonschema').validate;

const DEFAULT_CONFIG = {
  port: 8675,
  ipaddr: '127.0.0.1',
  logfile: 'chat.log'
}

exports.getConfig = () => {
  try {
    const config = JSON.parse(fs.readFileSync('config.json'));
    return validateConfig(config)

  } catch (exception) {
    return DEFAULT_CONFIG;
  }
};

const validateConfig = (config) => {
  const configSchema = {
    id: 'ChatConfig',
    type: 'object',
    properties: {
      port: {
        type: 'integer',
        minimum: 8000
      },
      ipaddr: {
        type: 'string',
        format: 'ipv4'
      },
      logfile: {
        type: 'string'
      }
    }
  };

  validate(config, configSchema, { throwFirst: true });
  return config;
}

exports.unixTime = () => Math.floor(new Date().getTime() / 1000);
exports.prettyLocalTime = (unixTimeStamp) => new Date(unixTimeStamp).toLocaleTimeString('en-US'); // Everybody online is American right?
