'use strict';

const chai = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
proxyquire.noPreserveCache();
const expect = chai.expect;
chai.use(require('sinon-chai'));

const levels = {
  error: 0,
  warn: 1,
  help: 2,
  data: 3,
  info: 4,
  trace: 5,
  debug: 6,
  prompt: 7,
  verbose: 8
};

const winstonCLI = {
  log: sinon.stub()
};

const winstonLogger = {
  setLevels: sinon.stub()
};

const winstonContainer = {
  get: sinon.stub().returns(winstonLogger)
};

const winston = {
  loggers: {
    add: sinon.stub().returns(winstonCLI)
  },
  Container: sinon.stub().returns(winstonContainer)
};

// Keep reference to main (Proxied) Logger constructor.
const ProxiedLogger = proxyquire('../index.js', {
  winston: winston
});

// When no need to verify stub-calls use the Logger
const Logger = require('../index.js');

beforeEach(() => {
  winston.transports = {
    Console: sinon.stub(),
    LogstashUDP: sinon.stub()
  };
});

describe('Logger', () => {
  it('throws an error when trying to use without instantiating', () => {
    let err;
    try {
      Logger.get('TestLogger');
    } catch (e) {
      err = e;
    }
    expect(err).to.not.equal(undefined);
    expect(err.message).to.equal('Logger not instantiated');
  });

  it('correctly instantiates without `new` and overwrites the module after instantiation', () => {
    const logger = require('../index.js')();
    expect(logger).to.equal(require('../index.js'));
  });

  it('instantiates with `new` and overwrites the module', () => {
    const logger = new require('../index.js'); // eslint-disable-line new-cap
    expect(logger).to.equal(require('../index.js'));
  });

  it('overwrites and merges with default settings', () => {
    const logger = new Logger({
      winston: {
        transports: {
          Console: {
            level: 'verbose'
          }
        }
      }
    });
    expect(logger._settings).to.deep.equal({
      longtrace: false,
      transports: {
        Console: {
          level: 'verbose',
          colorize: true
        }
      },
      levels: levels
    });
  });

  it('creates the default transports defined by config.transports', () => {
    new ProxiedLogger().get('TEST');
    expect(winston.transports.Console).to.have.been.calledWith({
      level: 'info',
      colorize: true,
      label: 'TEST'
    });
  });

  it('correctly sets the log-levels', () => {
    new ProxiedLogger().get('TEST');
    expect(winstonLogger.setLevels).to.have.been.calledWith(levels);
  });

  it('allows modifying the transports configuration', () => {
    new ProxiedLogger({
      winston: {
        transports: {
          LogstashUDP: {
            bar: 'foo',
            level: 'verbose'
          }
        }
      }
    }).get('TEST');
    expect(winston.transports.Console).to.have.been.calledWith({
      level: 'info',
      colorize: true,
      label: 'TEST'
    });
    expect(winston.transports.LogstashUDP).to.have.been.calledWith({
      bar: 'foo',
      level: 'verbose',
      label: 'TEST'
    });
  });

  it('allows removal of default Console transport', () => {
    new ProxiedLogger({
      winston: {
        transports: {
          Console: null,
          LogstashUDP: {
            bar: 'foo',
            level: 'verbose'
          }
        }
      }
    }).get('TEST');
    expect(winston.transports.Console).to.not.have.been.called;
    expect(winston.transports.LogstashUDP).to.have.been.calledWith({
      bar: 'foo',
      level: 'verbose',
      label: 'TEST'
    });
  });

  it('clones the passed configuration', () => {
    const config = {
      foo: 'bar',
      deep: {
        yes: []
      }
    };

    const logger = new Logger(config);

    // Default values will be merged on the config, it is not modified if it is still the same.
    expect(config).to.deep.equal({
      foo: 'bar',
      deep: {
        yes: []
      }
    });
    expect(config).to.not.equal(logger._settings);
  });

  it('allows passing extra transport configuration to the .get() function', () => {
    new ProxiedLogger().get('label', null, {
      Console: {
        extra: 'settings'
      }
    });

    expect(winston.transports.Console).to.have.been.calledWith({
      level: 'info',
      colorize: true,
      extra: 'settings',
      label: 'label'
    });
  });

  it('wont crash when colorize is set to true and level is trace', () => {
    const log = new Logger().get('test');
    expect(log.trace('test')).to.not.throw;
  });

  it('allows overriding of the level using configuration per named logger', () => {
    const config = {
      number1: {
        level: 'trace'
      },
      winston: {
        transports: {
          LogstashUDP: {
            level: 'verbose'
          }
        }
      }
    };
    new ProxiedLogger(config).get('Number1');
    expect(winston.transports.Console).to.have.been.calledWith({
      level: 'trace',
      colorize: true,
      label: 'Number1'
    });
    expect(winston.transports.LogstashUDP).to.have.been.calledWith({
      level: 'trace',
      label: 'Number1'
    });

    new ProxiedLogger(config).get('Number2');
    expect(winston.transports.Console).to.have.been.calledWith({
      level: 'info',
      colorize: true,
      label: 'Number2'
    });
    expect(winston.transports.LogstashUDP).to.have.been.calledWith({
      level: 'verbose',
      label: 'Number2'
    });
  });
});
