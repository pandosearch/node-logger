'use strict';

const _ = require('lodash');
const chai = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
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
  transports: {
    Console: sinon.stub(),
    LogstashUDP: sinon.stub()
  },
  Container: sinon.stub().returns(winstonContainer)
};

// Keep reference to main Logger constructor.
const Logger = proxyquire('../index.js', {
  winston: winston
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
    const logger = new Logger();
    expect(logger).to.equal(require('../index.js'));
  });

  it('overwrites and merges with default settings', () => {
    const logger = new Logger({
      winston: {
        console: {
          level: 'verbose'
        }
      }
    });
    expect(logger._settings).to.deep.equal({
      transports: ['Console'],
      getConsoleConfig: logger._settings.getConsoleConfig,
      getLogstashUDPConfig: logger._settings.getLogstashUDPConfig,
      longtrace: false,
      winston: {
        console: {
          level: 'verbose',
          colorize: true
        },
        logstashUDP: {}
      },
      levels: levels
    });
    expect(logger._settings.getConsoleConfig).to.be.a('function');
    expect(logger._settings.getLogstashUDPConfig).to.be.a('function');
  });

  it('creates the default transports defined by config.transports', () => {
    new Logger().get('TEST');
    expect(winston.transports.Console).to.have.been.calledWith({
      level: 'info',
      colorize: true,
      label: 'TEST'
    });
  });

  it('calls a custom get config function with a clone of the winston data', () => {
    let winstonConfig;
    const loggerConfig = {
      winston: {
        console: {}
      },
      getConsoleConfig: (_config) => {
        winstonConfig = _config;
        return winstonConfig;
      }
    };
    new Logger(loggerConfig).get('LABEL');
    expect(loggerConfig.winston).to.not.equal(winstonConfig);
    expect(_.set(loggerConfig.winston, 'console.label', 'LABEL')).to.deep.equal(winstonConfig);
  });

  it('calls a custom get config function for the console transport', () => {
    new Logger({
      getConsoleConfig: () => {
        return {
          foo: 'bar'
        };
      }
    }).get('TEST');
    expect(winston.transports.Console).to.have.been.calledWith({
      foo: 'bar'
    });
  });

  it('correctly sets the log-levels', () => {
    new Logger().get('TEST');
    expect(winstonLogger.setLevels).to.have.been.calledWith(levels);
  });

  it('allows modifying the transports configuration', () => {
    new Logger({
      transports: ['Console', 'LogstashUDP'],
      winston: {
        logstashUDP: {
          bar: 'foo',
          level: 'verbose'
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
});
