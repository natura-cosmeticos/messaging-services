const async = require('async');
const bson = require('bson');
const Consumer = require('sqs-consumer');
const ungzip = require('node-gzip');
const Logger = require('@naturacosmeticos/clio-nodejs-logger');
const { promisify } = require('util');

const ClientFactory = require('../../common/aws/client-factory');
const LoggerContext = require('../../common/logger/context');
const MessageBusError = require('../../common/errors/message-bus-error');
const errorMessages = require('../../common/errors/messages');

/**
 * AWS Queue MessageBus listener
 */
class MessageBus {
  /**
   * @param {Array} friendlyNamesToUrl - A map of the friendly queue name to URL
   */
  constructor(friendlyNamesToUrl, compactMessages) {
    /** @private */
    this.friendlyNamesToUrl = friendlyNamesToUrl;
    this.compactMessages = compactMessages;
  }

  /**
  * Poll messages from one or more AWS SQS queues
  * @param {Object} queueHandlerMap - A map of queue names to MessageHandler
  * @returns {Promise<void>}
  */
  async receive(queueHandlerMap) {
    const sqs = ClientFactory.create('sqs');
    const logger = Logger.current().createChildLogger('message-bus:receive');

    /** @private */
    this.consumers = Object.keys(queueHandlerMap).map(queueName => Consumer.create({
      handleMessage: this.handler(queueName, queueHandlerMap[queueName]),
      queueUrl: this.friendlyNamesToUrl[queueName],
      sqs,
    }));

    try {
      await Promise.all(this.consumers.map(consumer => consumer.start()));
    } catch (error) {
      logger.error(error);
      throw new MessageBusError(`${errorMessages.messageBus.unavailable}: ${error}`);
    }
  }

  /**
   * Decompress message
   * @param {string} message - The message you want to decompress
   */
  async decompressMessage(message) {
    const buff = Buffer.from(message.body, 'base64');

    const unzipped = await ungzip(buff);

    const messageDecompressed = bson.deserialize(unzipped);

    return messageDecompressed;
  }

  /**
   * Stops polling messages
   * @returns Promise<void>
   */
  async close() {
    const logger = Logger.current().createChildLogger('message-bus:close');

    try {
      await promisify(async.each)(
        this.consumers,
        (consumer, cb) => {
          consumer.on('stopped', cb);
          consumer.stop();
        },
      );
    } catch (error) {
      logger.error(error);
      throw new MessageBusError(`${errorMessages.messageBus.close}: ${error}`);
    }
  }

  /** @private */
  handler(queueName, fn) {
    return (message, done) => LoggerContext.run(async () => {
      let messageDecompressed;

      if (this.compactMessages && message.Body.compacted) {
        messageDecompressed = await this.decompressMessage(message.Body);
      } else {
        messageDecompressed = message.Body;
      }

      const body = messageDecompressed;

      LoggerContext.logItemProcessing(() => fn(body), queueName, body)
        .then(() => done())
        .catch(done);
    });
  }
}

module.exports = MessageBus;
