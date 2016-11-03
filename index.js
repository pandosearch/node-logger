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
  const conf = _.cloneDeep(this._settings.transports);

  // Filter out falsey values
  const transportKeys = _.keys(_.pickBy(this._settings.transports, _.identity));

  const transports = _.map(transportKeys, (transport) => {
    const transportSettings = conf[transport];

    transportSettings.label = label;
    transportSettings.level = level || transportSettings.level;

    return new winston.transports[transport](transportSettings);
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
