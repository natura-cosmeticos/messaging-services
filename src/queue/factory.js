const QueueAmqpMessageBus = require('./amqp/message-bus');
const QueueAwsSqsMessageBus = require('./aws/message-bus');

/**
 * Message Bus Factory
 */
class MessageBusFactory {
  /**
   * Creates a MessageBus implementation, either of QueueAmqpMessageBus or QueueAwsSqsMessageBus
   * Pass the developmentMode option with a truthy value to use the message queue locally
   * @param {Object} options - Optional creation options
   */
  static create(options = {}) {
    if (options.developmentMode) {
      return MessageBusFactory.createAmqpBus(options.amqpOptions || {});
    }

    return MessageBusFactory.createAwsSqsBus(options.awsSqsOptions || {});
  }

  /** @private */
  static createAmqpBus({ serverUrl }) {
    return new QueueAmqpMessageBus(serverUrl || 'amqp://messaging-rabbitmq');
  }

  /** @private */
  static createAwsSqsBus({ friendlyNamesToUrl }) {
    return new QueueAwsSqsMessageBus(friendlyNamesToUrl);
  }
}

module.exports = MessageBusFactory;
