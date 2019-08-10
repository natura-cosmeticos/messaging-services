const AmqpConnection = require('../../common/amqp/connection');
const LoggerContext = require('../../common/logger/context');
const CorrelationEngine = require('../../util/correlation-engine');
const CompressEngine = require('../../util/compress-engine');
const Logger = require('@naturacosmeticos/clio-nodejs-logger');
const errorMessages = require('../../common/errors/messages');
const MessageBusError = require('../../common/errors/message-bus-error');

/**
 * AMQP MessageBus listener
 */
class AmqpMessageBus {
  /**
   * @param {string} serverUrl - The AMQP server URL e.g. amqp://messaging-rabbitmq
   */
  constructor(serverUrl) {
    /** @private */
    this.serverUrl = serverUrl;
  }

  /**
   * Poll messages from one or more RabbitMQ queues
   * @param {Object} queueHandlerMap - A map of queue names to MessageHandler
   * @returns {Promise<void>}
   */
  async receive(queueHandlerMap) {
    const exchangeNames = Object.keys(queueHandlerMap);

    /** @private */
    this.connection = new AmqpConnection(this.serverUrl);
    await this.connection.open();

    const { channel } = this.connection;

    await Promise.all(exchangeNames.map(this.ensureExchangeExists.bind(this, channel)));
    const consumers = await Promise.all(exchangeNames
      .map(exchangeName => channel.consume(
        this.appQueueName(exchangeName),
        this.handler(exchangeName, channel, queueHandlerMap[exchangeName]),
      )));

    /** @private */
    this.consumerTags = consumers.map(({ consumerTag }) => consumerTag);
  }

  /**
   * Stops polling messages and close all connections
   * @returns {Promise<void>}
   */
  async close() {
    if (!this.connection) {
      return;
    }

    await Promise.all(this.consumerTags.map(tag => this.connection.channel.cancel(tag)));
    await this.connection.close();
  }

  /**
   * @private
   */
  async ensureExchangeExists(channel, exchangeName) {
    const queueName = this.appQueueName(exchangeName);

    await channel.assertExchange(exchangeName, 'fanout', { durable: true });
    await channel.assertQueue(queueName, 'fanout', { durable: true });
    await channel.bindQueue(queueName, exchangeName, '');
  }

  /**
   * Generates an application specific queue name
   * Suppose APP_NAME is order-tower and we receive checkout as the exchangeName,
   * the resulting queue nam will be checkout-order-tower
   * @private
   */
  appQueueName(exchangeName) {
    return `${exchangeName}-${process.env.APP_NAME}`;
  }

  /**
  * @private
  */
  handler(queueName, channel, fn) {
    const logger = Logger.current().createChildLogger('message-bus:receive');

    return message => LoggerContext.run(() => new Promise(async (resolve) => {
      const compressedMessage = JSON.parse(message.content.toString('utf-8'));

      try {
        const decompressedMessage = await CompressEngine.decompressMessage(compressedMessage);
        const wrappedCorrelationIdMessage = JSON.parse(decompressedMessage.Body);
        const { body, correlationId } = CorrelationEngine.unwrapMessage(wrappedCorrelationIdMessage);

        LoggerContext
          .logItemProcessing(() => fn(body, correlationId), queueName, body)
          .then(() => channel.ack(message))
          .catch(() => channel.nack(message))
          .then(resolve);
      } catch (error) {
        logger.error(`${errorMessages.messageBus.decompress} - ${error}`);
        throw new MessageBusError(`${errorMessages.messageBus.decompress}: ${error}`);
      }
    }));
  }
}

module.exports = AmqpMessageBus;
