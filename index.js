'use strict';

const defaultSettings = require('./settings.js');

const _ = require('lodash');
const winston = require('winston');
require('winston-logstash-udp');

function Logger(settings) {
  if (!(this instanceof Logger)) {
    return new Logger(settings);
  }

  this._settings = _.defaultsDeep(settings, defaultSettings);
  this._container = new winston.Container({
    exitOnError: false
  });

  // Overwrite module, this instance will be included on next require.
  module.exports = this;
}

Logger.prototype.get = function (label, level) {
  const conf = _.cloneDeep(this._settings.winston);

  conf.console.label = label;
  conf.console.level = level || conf.console.level;

  const transports = _.map(this._settings.transports, (transport) => {
    const transportConfig = this._settings[`get${transport}Config`](conf);

    return new winston.transports[transport](transportConfig);
  });

  // Create a new logger with the console transport layer by default
  return this._container.get(label, {
    transports: transports
  }).setLevels(this._settings.levels);
};

// Protect against usage without instantiation
Logger.get = () => {
  throw new Error('Logger not instantiated');
};

module.exports = Logger;
