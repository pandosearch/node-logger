'use strict';

const dgram = require('dgram');
const os = require('os');
const {Transport} = require('winston');

class LogstashUDP extends Transport {
  constructor(options = {}) {
    super(options);
    this.localhost = options.localhost || os.hostname();
    this.host = options.host || '127.0.0.1';
    this.port = options.port || 9999;
    this.application = options.appName || process.title;
    this.pid = options.pid || process.pid;
    this.trailingLineFeed = options.trailingLineFeed === true;
    this.trailingLineFeedChar = options.trailingLineFeedChar || os.EOL;
    this.connect();
  }

  connect() {
    this.client = dgram.createSocket('udp4');
    this.client.on('error', () => {});
  }

  log(info, callback) {
    const message = JSON.stringify(Object.assign({}, info, {
      application: this.application,
      serverName: this.localhost,
      pid: this.pid
    }));

    this.sendLog(
      this.trailingLineFeed ? message.replace(/\s+$/, '') + this.trailingLineFeedChar : message,
      callback
    );
  }

  sendLog(message, callback) {
    const buf = Buffer.from(message);
    this.client.send(buf, 0, buf.length, this.port, this.host, err => {
      this.emit('logged', !err);
      callback(err, !err);
    });
  }
}

module.exports = LogstashUDP;
