module.exports = {
  getConsoleConfig: (config) => {
    return config.console;
  },
  getLogstashUDPConfig: (config) => {
    return config.logstash;
  },
  transports: ['Console'],
  longtrace: false,
  winston: {
    console: {
      level: 'info',
      colorize: true
    },
    logstash: {}
  },
  levels: {
    error: 0,
    warn: 1,
    help: 2,
    data: 3,
    info: 4,
    trace: 5,
    debug: 6,
    prompt: 7,
    verbose: 8
  }
};