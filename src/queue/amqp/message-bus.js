const AmqpConnection = require('../../common/amqp/connection');
const LoggerContext = require('../../common/logger/context');

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
    return message => LoggerContext.run(() => new Promise((resolve) => {
      const body = JSON.parse(message.content.toString('utf-8'));

      LoggerContext
        .logItemProcessing(() => fn(body), queueName, body)
        .then(() => channel.ack(message))
        .catch(() => channel.nack(message))
        .then(resolve);
    }));
  }
}

module.exports = AmqpMessageBus;
