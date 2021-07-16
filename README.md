# Node.js logger module

[![build:?](https://img.shields.io/travis/Enrise/node-logger.svg?style=flat-square)](https://travis-ci.org/Enrise/node-logger)
[![Coverage Status](https://img.shields.io/coveralls/Enrise/node-logger/master.svg?style=flat-square)](https://coveralls.io/github/Enrise/node-logger?branch=master)
[![dependencies:?](https://img.shields.io/david/Enrise/node-logger.svg?style=flat-square)](https://david-dm.org/Enrise/node-logger)
[![devDependencies:?](https://img.shields.io/david/dev/Enrise/node-logger.svg?style=flat-square)](https://david-dm.org/Enrise/node-logger)

> A simple wrapper around [winston](https://github.com/winstonjs/winston).

## Deprecated
This repository is deprecated and will be archived.

### Installation
NPM: `npm install enrise-logger --save`  
Yarn: `yarn add enrise-logger`

### Initialization and usage
At the beginning of your application, be sure to initialize the logger:  
`require('enrise-logger')([config: Object]);`

Where `config` is an optional object. See [below](#configuration) for further instructions.

After the module is initialized, simply call `.get(name: String)` on the module to return a namespaced logger:  
`const log = require('enrise-logger').get('MyLogger');`

The `log` object contains functions for each [log-level](#levels):

- `log.info('Some log message');`
- `log.error(new Error('Some error'));`

#### `.get(name: String, [level: String], [transportConfig: Object])`
The `.get()` function allows additional customization. The level can overwrite the logging-level defined during initialization. A third argument can be passed to overwrite transport configuration. This will be merged onto the object passed to the transports.

### Configuration

The default configuration looks as follows. Everything can be overwritten on initialization.
```javascript
{
  winston: {
    transports: {
      Console: {
        level: 'info',
        colorize: true
      }
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
  }
}
```

#### `winston: Object`
The top-level key `winston` in the config contains winston-specific configuration.

#### `<namedloggerKey>: {level: String}`
You can add other toplevel-keys to provide named-logger specific level-information. This functionality allows you to set the log-level through configuration.

``` javascript
{
  winston: {...},
  namedlogger1: {
    level: debug
  }
}
```

The above configuration would set the `level` of logging to `debug` for the logger which was created as follows:

```javascript
const log = require('enrise-logger').get('NamedLogger1');
```

Be aware that the way you'll read and apply your config dictates the actions you should take to change the actual log-level
at run-time. If you only read and apply the config at the start of your program you'd have to restart your program to apply the changed log-level.

#### `winston.transports: Object`
The keys define the transports that the logger should use, the value is the configuration passed to the transport constructor. Multiple transports can be combined. Defaults to only the Console with the settings above. To exclude the Console transport, set it to `null`. Possible transports are:

- `Console`: [winston.Console documentation](https://github.com/winstonjs/winston/blob/master/docs/transports.md#console-transport)
- `File`: [winston.File documentation](https://github.com/winstonjs/winston/blob/master/docs/transports.md#file-transport)
- `Http`: [winston.Http documentation](https://github.com/winstonjs/winston/blob/master/docs/transports.md#http-transport)
- `LogstashUDP`: [winston.LogstashUDP documentation](https://www.npmjs.com/package/winston-logstash-udp)

#### `winston.levels`
The node-logger uses more detailed log-levels than winston does. The higher the priority the more important the message is considered to be, and the lower the corresponding integer priority. These levels can be modified to your liking.
