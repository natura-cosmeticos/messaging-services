const Logger = require('@naturacosmeticos/clio-nodejs-logger');

const AmqpConnection = require('../../common/amqp/connection');
const MessageBusError = require('../../common/errors/message-bus-error');
const errorMessages = require('../../common/errors/messages');
const CorrelationEngine = require('../../util/correlation-engine/correlationEngine');
const CompressEngine = require('../../../util/compress-engine');

/**
 * RabbitMQ message bus implementation
 */
class MessageBus {
  /**
   * @param {string} serverUrl - URL of the target RabbitMQ server
   * @param {String} compressEngine - String defining the compress engine
   */
  constructor(serverUrl, compressEngine) {
    /** @private */
    this.serverUrl = serverUrl;
    this.compressEngine = compressEngine || process.env.IRIS_COMPRESS_ENGINE;
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

    const wrappedMessage = CorrelationEngine.wrapMessage(message);
    let compressedMessage;

    try {
      compressedMessage = await CompressEngine.compressMessage(wrappedMessage, this.compressEngine);
    } catch (error) {
      logger.error(`${errorMessages.messageBus.compress}, ${error}`);
      compressedMessage = wrappedMessage;
    }

    try {
      await connection.open();

      await connection.channel.assertExchange(bus, 'fanout', { durable: true });

      logger.log('Sending message to AMQP bus\nUnwrapped message', { message }, '\nWrapped message', compressedMessage);

      await connection.channel.publish(bus, '', Buffer.from(JSON.stringify(compressedMessage)), { persistent: true });
    } catch (error) {
      logger.error(error);
      throw new MessageBusError(`${errorMessages.messageBus.unavailable}: ${error}`);
    } finally {
      connection.close();
    }
  }
}

module.exports = MessageBus;
