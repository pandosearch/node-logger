'use strict';

const defaultSettings = require('./settings.js');

const _ = require('lodash');
const winston = require('winston');
require('winston-logstash-udp');

function Logger(settings) {
  if (!(this instanceof Logger)) {
    return new Logger(settings);
  }

  const winstonSettings = _.get(settings, 'winston', {});

  this._settings = _.defaultsDeep(_.cloneDeep(winstonSettings), defaultSettings.winston);
  this._namedSettings = _.mapKeys(_.omit(settings, 'winston'), (v, k) => {return k.toUpperCase();});
  this._container = new winston.Container({
    exitOnError: false
  });

  // Overwrite module, this instance will be included on next require.
  module.exports = this;
}

Logger.prototype.get = function (label, level, transportConfig) {
  const conf = _.cloneDeep(this._settings.transports);

  if (_.isPlainObject(transportConfig)) {
    _.merge(conf, transportConfig);
  }

  // Check for a config specific for the logger we're about to create
  const namedSetting = _.get(this._namedSettings, label.toUpperCase());
  // Named Config level comes before programmatic set level, as the config can be changed post-deploy
  const levelToUse = _.get(namedSetting, 'level', level);

  // Filter out falsey values
  const transportKeys = _.keys(_.pickBy(this._settings.transports, _.identity));

  const transports = _.map(transportKeys, (transport) => {
    const transportSettings = conf[transport];

    transportSettings.label = label;
    transportSettings.level = levelToUse || transportSettings.level;

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
