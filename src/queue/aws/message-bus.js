const async = require('async');
const Consumer = require('sqs-consumer');
const Logger = require('@naturacosmeticos/clio-nodejs-logger');
const { promisify } = require('util');

const ClientFactory = require('../../common/aws/client-factory');
const LoggerContext = require('../../common/logger/context');
const MessageBusError = require('../../common/errors/message-bus-error');
const errorMessages = require('../../common/errors/messages');
const CompressEngine = require('../../../util/compress-engine');
const CorrelationEngine = require('../../util/correlation-engine/correlationEngine');

/**
 * AWS Queue MessageBus listener
 */
class MessageBus {
  /**
   * @param {Array} friendlyNamesToUrl - A map of the friendly queue name to URL
   */
  constructor(friendlyNamesToUrl) {
    /** @private */
    this.friendlyNamesToUrl = friendlyNamesToUrl;
  }

  /**
  * Poll messages from one or more AWS SQS queues
  * @param {Object} queueHandlerMap - A map of queue names to MessageHandler
  * @returns {Promise<void>}
  */
  async receive(queueHandlerMap) {
    this.sqs = ClientFactory.create('sqs');
    const logger = Logger.current().createChildLogger('message-bus:receive');

    /** @private */
    this.consumers = Object.keys(queueHandlerMap).map(queueName => Consumer.create({
      handleMessage: this.handler(queueName, queueHandlerMap[queueName]),
      queueUrl: this.friendlyNamesToUrl[queueName],
      sqs: this.sqs,
    }));

    try {
      await Promise.all(this.consumers.map(consumer => consumer.start()));
    } catch (error) {
      logger.error(error);
      throw new MessageBusError(`${errorMessages.messageBus.unavailable}: ${error}`);
    }
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
    return (message, done) => LoggerContext.run(() => {

      const logger = Logger.current().createChildLogger('message-bus:handler');

      try {
        const wrappedCorrelationIdMessage = await CompressEngine.decompressMessage(message.body);
        const { body, correlationId } = CorrelationEngine.unwrapMessage(wrappedCorrelationIdMessage);

        logger.log('Receiving message from SQS\nUnwrapped message', { body }, '\nWrapped message', wrappedCorrelationIdMessage);

        LoggerContext
          .logItemProcessing(() => fn(body, correlationId), queueName, body)
          .then(() => {
            try {
              await this.sqs.deleteMessage({
                QueueUrl: queueInfo.url,
                ReceiptHandle: receiptHandle,
              }).promise();
            } catch (error) {
              logger.error(`MessageId ${message.messageId}: ${errorMessages.messageBus.delete} - ${error}`);
            }

            done();
          })
          .catch(done);
      } catch (error) {
        logger.error(`${errorMessages.messageBus.decompress} - ${error}`);
        throw new MessageBusError(`${errorMessages.messageBus.decompress}: ${error}`)
      }
    });
  }
}

module.exports = MessageBus;
