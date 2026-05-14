'use strict';

const chai = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
proxyquire.noPreserveCache();
const expect = chai.expect;
chai.use(require('sinon-chai').default);
const os = require('os');

function makeSocket() {
  return {
    on: sinon.stub(),
    send: sinon.stub().callsFake((buf, offset, length, port, host, cb) => cb && cb(null))
  };
}

function makeTransport(options, socketOverride) {
  const socket = socketOverride || makeSocket();
  const dgram = {createSocket: sinon.stub().returns(socket)};
  const LogstashUDP = proxyquire('../lib/logstash-udp-transport', {dgram});
  return {transport: new LogstashUDP(options), socket, dgram};
}

describe('LogstashUDP', () => {
  it('registers itself on winston.transports', () => {
    const winston = require('winston');
    expect(winston.transports.LogstashUDP).to.be.a('function');
  });

  it('applies default options', () => {
    const {transport} = makeTransport();
    expect(transport.host).to.equal('127.0.0.1');
    expect(transport.port).to.equal(9999);
    expect(transport.localhost).to.equal(os.hostname());
    expect(transport.application).to.equal(process.title);
    expect(transport.pid).to.equal(process.pid);
    expect(transport.trailingLineFeed).to.equal(false);
  });

  it('applies custom options', () => {
    const {transport} = makeTransport({
      host: '10.0.0.1',
      port: 5000,
      localhost: 'myhost',
      appName: 'myapp',
      pid: 42,
      trailingLineFeed: true,
      trailingLineFeedChar: '\n'
    });
    expect(transport.host).to.equal('10.0.0.1');
    expect(transport.port).to.equal(5000);
    expect(transport.localhost).to.equal('myhost');
    expect(transport.application).to.equal('myapp');
    expect(transport.pid).to.equal(42);
    expect(transport.trailingLineFeed).to.equal(true);
    expect(transport.trailingLineFeedChar).to.equal('\n');
  });

  it('creates a udp4 socket on connect', () => {
    const {dgram} = makeTransport();
    expect(dgram.createSocket).to.have.been.calledWith('udp4');
  });

  it('silently swallows socket errors', () => {
    const {socket} = makeTransport();
    const [, errorHandler] = socket.on.args.find(([event]) => event === 'error');
    expect(() => errorHandler(new Error('socket error'))).to.not.throw();
  });

  it('sends a JSON payload via UDP on log()', done => {
    const {transport, socket} = makeTransport({host: '10.0.0.1', port: 5000, appName: 'myapp', pid: 1});
    const info = {level: 'info', message: 'hello'};

    transport.log(info, () => {
      expect(socket.send).to.have.been.called;
      const sent = JSON.parse(socket.send.firstCall.args[0].toString());
      expect(sent.level).to.equal('info');
      expect(sent.message).to.equal('hello');
      expect(sent.application).to.equal('myapp');
      expect(sent.serverName).to.equal(transport.localhost);
      expect(sent.pid).to.equal(1);
      done();
    });
  });

  it('sends to the configured host and port', done => {
    const {transport, socket} = makeTransport({host: '10.0.0.1', port: 5000});
    transport.log({level: 'info', message: 'x'}, () => {
      expect(socket.send.firstCall.args[3]).to.equal(5000);
      expect(socket.send.firstCall.args[4]).to.equal('10.0.0.1');
      done();
    });
  });

  it('appends trailing line feed when configured', done => {
    const {transport, socket} = makeTransport({trailingLineFeed: true, trailingLineFeedChar: '\n'});
    transport.log({level: 'info', message: 'x'}, () => {
      const sent = socket.send.firstCall.args[0].toString();
      expect(sent.endsWith('\n')).to.equal(true);
      done();
    });
  });

  it('does not append trailing line feed by default', done => {
    const {transport, socket} = makeTransport();
    transport.log({level: 'info', message: 'x'}, () => {
      const sent = socket.send.firstCall.args[0].toString();
      expect(sent.endsWith('\n')).to.equal(false);
      done();
    });
  });

  it('emits logged event after send', done => {
    const {transport} = makeTransport();
    transport.on('logged', result => {
      expect(result).to.equal(true);
      done();
    });
    transport.log({level: 'info', message: 'x'}, () => {});
  });

  it('passes send errors to callback', done => {
    const socket = makeSocket();
    const err = new Error('send failed');
    socket.send.callsFake((buf, offset, length, port, host, cb) => cb(err));
    const {transport} = makeTransport({}, socket);
    transport.log({level: 'info', message: 'x'}, (cbErr, result) => {
      expect(cbErr).to.equal(err);
      expect(result).to.equal(false);
      done();
    });
  });
});
