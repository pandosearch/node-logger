# Changelog

## 2.0.1

### Changes

#### Automatic conversion of winston 2.x transport format options

Transport config keys that were removed in winston 3.x (`colorize`, `prettyPrint`, `padLevels`) are now automatically converted to their `winston.format` equivalents by the logger. Existing transport configuration requires no changes:

```js
new Logger({
  winston: {
    transports: {
      Console: {
        colorize: true,   // still works — converted to winston.format.colorize()
        prettyPrint: true // still works — converted to winston.format.prettyPrint()
      }
    }
  }
});
```

Multiple options are combined into a single `winston.format.combine()` call.

---

## 2.0.0

### Breaking changes

#### Node.js ≥ 20 required

The minimum supported Node.js version has been raised from 4.0.0 to 20.

#### winston upgraded from v2 to v3

The underlying `winston` dependency has been upgraded from `^2.2.0` to `^3.19.0`. Consumers that build their own winston container (rather than using `.get()` from this package) need to update the following:

**`logger.setLevels(levels)` removed**

Pass `levels` directly to `container.get()` or `winston.createLogger()` instead:

```js
// Before
const logger = container.get(label, { transports });
logger.setLevels(levels);

// After
const logger = container.get(label, { transports, levels });
```

**`logger.rewriters` removed**

The `rewriters` array no longer exists in winston v3. Replace it with a `winston.format` transform:

```js
// Before
logger.rewriters.push((level, msg, meta) => { ... });

// After (configure on the logger or transport)
const { createLogger, format } = require('winston');
const logger = createLogger({
  format: format.combine(
    format(info => {
      // same transformation logic here
      return info;
    })()
  ),
  transports
});
```

**Timestamps no longer included by default**

In winston v2, log entries always included a `timestamp` field. In v3, add `winston.format.timestamp()` explicitly if your logstash consumer depends on it.

#### `winston-logstash-udp` replaced with a built-in transport

The third-party `winston-logstash-udp` package has been removed. An equivalent winston v3-compatible transport is now included in this package.

**If you required `LogstashUDP` directly** (e.g. `require('winston-logstash-udp').LogstashUDP`), update the import:

```js
// Before
const { LogstashUDP } = require('winston-logstash-udp');

// After
const LogstashUDP = require('enrise-logger/lib/logstash-udp-transport');
```

Alternatively, `winston.transports.LogstashUDP` is registered automatically when `enrise-logger` is required.

The constructor options (`host`, `port`, `appName`, `localhost`, `pid`, `trailingLineFeed`, `trailingLineFeedChar`) are identical to the old package.

### Other changes

- Replaced `istanbul` with `nyc` for coverage reporting.
- All devDependencies updated to current versions (`mocha`, `chai`, `sinon`, `sinon-chai`, `proxyquire`).
- Production dependencies updated: `lodash` → 4.18.1, `longjohn` → 0.2.12.
- Removed `.travis.yml` (CI no longer used).
