module.exports = {
  transports: {
    Console: {
      level: 'info',
      colorize: true
    }
  },
  longtrace: false,
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