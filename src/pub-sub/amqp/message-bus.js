const Logger = require('@naturacosmeticos/clio-nodejs-logger');

const AmqpConnection = require('../../common/amqp/connection');
const MessageBusError = require('../../common/errors/message-bus-error');
const errorMessages = require('../../common/errors/messages');

/**
 * RabbitMQ message bus implementation
 */
class MessageBus {
  /**
   * @param {string} serverUrl - URL of the target RabbitMQ server
   */
  constructor(serverUrl) {
    /** @private */
    this.serverUrl = serverUrl;
  }

  /**
   * Publish a message in a RabbitMQ exchange. Use this method for a fanout scenario
   * @param {string} bus - The name of the bus (exchange) you want to send a message
   * @param {Object} message - The raw message content
   * @returns {Promise<void>}
   */
  async publish(bus, message) {
    const connection = new AmqpConnection(this.serverUrl);
    const logger = Logger.current().createChildLogger('message-bus:send');

    logger.log('Sending message to AMQP bus', { message });

    try {
      await connection.open();

      await connection.channel.assertExchange(bus, 'fanout', { durable: true });
      await connection.channel.publish(bus, '', Buffer.from(JSON.stringify(message)), { persistent: true });
    } catch (error) {
      logger.error(error);
      throw new MessageBusError(`${errorMessages.messageBus.unavailable}: ${error}`);
    } finally {
      connection.close();
    }
  }
}

module.exports = MessageBus;
