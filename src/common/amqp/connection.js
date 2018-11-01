const amqp = require('amqplib');
const Logger = require('@naturacosmeticos/node-logger');

const MessageBusError = require('../errors/message-bus-error');
const errorMessages = require('../errors/messages');

/** @ignore */
class AmqpConnection {
  /** @ignore */
  constructor(serverUrl) {
    /** @private */
    this.serverUrl = serverUrl;
    /** @private */
    this.connection = null;
    /** @private */
    this.channel = null;

    this.logger = Logger.current().createChildLogger('message-bus:connection');
    Object.preventExtensions(this);
  }

  /** @ignore */
  async open() {
    try {
      this.connection = await amqp.connect(this.serverUrl);
      this.channel = await this.connection.createChannel();
      process.on('exit', () => this.close());
    } catch (error) /* istanbul ignore next */ {
      await this.close();
      this.logger.error(error);
      throw new MessageBusError(`${errorMessages.messageBus.unavailable}: ${error}`);
    }

    return {
      channel: this.channel,
      connection: this.connection,
    };
  }

  /** @ignore */
  async close() {
    if (this.channel) {
      await this.channel.close();
    }

    if (this.connection) {
      await this.connection.close();
    }
  }
}

module.exports = AmqpConnection;
