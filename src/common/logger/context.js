const _ = require('lodash');
const domain = require('domain');
const uuid = require('uuid/v4');
const Logger = require('@naturacosmeticos/node-logger');

/** @private */
class LoggerContext {
  /** @private */
  static run(fn) {
    const currentDomain = domain.create();

    currentDomain.logger = new Logger({ requestId: uuid() }, 'message-bus:receive');
    currentDomain.run(fn);
  }

  /** @private */
  static logItemProcessing(fn, itemName, body) {
    Logger.current().log('Processing item', { body, itemName });

    return fn()
      .then(() => Logger.current().log('Finished processing item successfully', { itemName }))
      .catch((error) => {
        const serializedError = _.pick(error, Object.getOwnPropertyNames(error || {}));

        Logger.current().error(
          'Finished processing item with error',
          { error: serializedError, itemName },
        );
        throw error;
      });
  }
}

module.exports = LoggerContext;
