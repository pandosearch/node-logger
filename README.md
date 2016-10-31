# Node.js logger module
> A simple wrapper around [winston](https://github.com/winstonjs/winston).

### Installation
NPM: `npm install enrise-node-logger --save`  
Yarn: `yarn add enrise-node-logger`

### Initialization and usage
At the beginning of your application, be sure to initialize the logger:  
`require('enrise-node-logger')([config: Object]);`

Where `config` is an optional object. See [below](#configuration) for further instructions.

After the module is initialized, simply call `.get(name: String)` on the module to return a namespaced logger:
`const log = require('enrise-node-logger').get('MyLogger');`

The `log` object contains functions for each [log-level](#levels):
- `log.info('Some log message');`  
- `log.error(new Error('Some error'));`

### Configuration

The default configuration looks as follows. Everything can be overwritten on initialization.
```javascript
{
  transports: ['Console'],
  getConsoleConfig: (config) => {
    return config.console;
  },
  getLogstashUDPConfig: (config) => {
    return config.logstash;
  },
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
}
```

#### `transports`
Define all transports that the logger should use. Defaults to only the Console. The other possible transport is `LogstashUDP`. These can be used together.

#### `getConsoleConfig` & `getLogstashUDPConfig`
Overwrite and modify the configuration used for their corresponding transport. The `config` object is _always_ a clone of the `config.winston` object.

#### `winston`
An object with specific configuration for the transporters.
- `console`: [winston.Console documentation](https://github.com/winstonjs/winston)
- `logstash`: [winston.LogstashUDP documentation](https://www.npmjs.com/package/winston-logstash-udp)

#### `levels`
The node-logger uses more detailed log-levels than winston does. The higher the priority the more important the message is considered to be, and the lower the corresponding integer priority. These levels can be modified to your liking.

