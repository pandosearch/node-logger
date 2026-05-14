'use strict';

const chai = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
proxyquire.noPreserveCache();
const expect = chai.expect;
chai.use(require('sinon-chai').default);

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

// Unique sentinel objects so tests can identity-check which formats were applied
const colorizeFormat = {name: 'colorize'};
const prettyPrintFormat = {name: 'prettyPrint'};
const padLevelsFormat = {name: 'padLevels'};
const combinedFormat = {name: 'combined'};

const winston = {
  loggers: {
    add: sinon.stub().returns(winstonCLI)
  },
  Container: sinon.stub().returns(winstonContainer),
  transports: {},
  format: {
    colorize: sinon.stub().returns(colorizeFormat),
    prettyPrint: sinon.stub().returns(prettyPrintFormat),
    padLevels: sinon.stub().returns(padLevelsFormat),
    combine: sinon.stub().returns(combinedFormat)
  }
};

// Keep reference to main (Proxied) Logger constructor.
const ProxiedLogger = proxyquire('../index.js', {
  winston
});

// When no need to verify stub-calls use the Logger
const Logger = require('../index.js');

beforeEach(() => {
  winston.transports = {
    Console: sinon.stub(),
    LogstashUDP: sinon.stub()
  };
  winston.format.colorize.resetHistory();
  winston.format.prettyPrint.resetHistory();
  winston.format.padLevels.resetHistory();
  winston.format.combine.resetHistory();
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
      levels
    });
  });

  it('creates the default transports defined by config.transports', () => {
    new ProxiedLogger().get('TEST');
    expect(winston.transports.Console).to.have.been.calledWith({
      level: 'info',
      format: combinedFormat,
      label: 'TEST'
    });
  });

  it('correctly sets the log-levels', () => {
    new ProxiedLogger().get('TEST');
    expect(winstonContainer.get).to.have.been.calledWith('TEST', sinon.match({levels}));
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
      format: combinedFormat,
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
      format: combinedFormat,
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
      format: combinedFormat,
      label: 'Number1'
    });
    expect(winston.transports.LogstashUDP).to.have.been.calledWith({
      level: 'trace',
      label: 'Number1'
    });

    new ProxiedLogger(config).get('Number2');
    expect(winston.transports.Console).to.have.been.calledWith({
      level: 'info',
      format: combinedFormat,
      label: 'Number2'
    });
    expect(winston.transports.LogstashUDP).to.have.been.calledWith({
      level: 'verbose',
      label: 'Number2'
    });
  });

  describe('winston 2.x format option conversion', () => {
    it('converts colorize: true to winston.format.colorize() and removes the key', () => {
      new ProxiedLogger().get('TEST');
      expect(winston.format.colorize).to.have.been.calledOnce;
      expect(winston.format.combine).to.have.been.calledWith(colorizeFormat);
      expect(winston.transports.Console).to.have.been.calledWith(sinon.match({format: combinedFormat}));
      expect(winston.transports.Console).to.not.have.been.calledWith(sinon.match.has('colorize'));
    });

    it('converts prettyPrint: true to winston.format.prettyPrint() and removes the key', () => {
      new ProxiedLogger({
        winston: {transports: {Console: {colorize: null, prettyPrint: true}}}
      }).get('TEST');
      expect(winston.format.prettyPrint).to.have.been.calledOnce;
      expect(winston.format.combine).to.have.been.calledWith(prettyPrintFormat);
      expect(winston.transports.Console).to.have.been.calledWith(sinon.match({format: combinedFormat}));
      expect(winston.transports.Console).to.not.have.been.calledWith(sinon.match.has('prettyPrint'));
    });

    it('converts padLevels: true to winston.format.padLevels() and removes the key', () => {
      new ProxiedLogger({
        winston: {transports: {Console: {colorize: null, padLevels: true}}}
      }).get('TEST');
      expect(winston.format.padLevels).to.have.been.calledOnce;
      expect(winston.format.combine).to.have.been.calledWith(padLevelsFormat);
      expect(winston.transports.Console).to.have.been.calledWith(sinon.match({format: combinedFormat}));
      expect(winston.transports.Console).to.not.have.been.calledWith(sinon.match.has('padLevels'));
    });

    it('combines multiple format options into a single format.combine() call', () => {
      new ProxiedLogger({
        winston: {transports: {Console: {colorize: true, prettyPrint: true, padLevels: true}}}
      }).get('TEST');
      expect(winston.format.combine).to.have.been.calledWith(colorizeFormat, prettyPrintFormat, padLevelsFormat);
    });

    it('does not add a format when no format options are set', () => {
      new ProxiedLogger({
        winston: {transports: {Console: {colorize: null}}}
      }).get('TEST');
      expect(winston.format.combine).to.not.have.been.called;
      expect(winston.transports.Console).to.not.have.been.calledWith(sinon.match.has('format'));
    });
  });
});
