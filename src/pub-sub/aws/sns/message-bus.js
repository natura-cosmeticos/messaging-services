const bson = require('bson');
const gzip = require('node-gzip');
const Logger = require('@naturacosmeticos/clio-nodejs-logger');
const ClientFactory = require('../../../common/aws/client-factory');
const MessageBusError = require('../../../common/errors/message-bus-error');
const errorMessages = require('../../../common/errors/messages');

/**
 * AWS SNS publisher
 */
class MessageBus {
  /**
   * @param {Array} friendlyNamesToUrl - A map of the friendly queue name to ARN
   */
  constructor(friendlyNamesToArn, compactMessages = false) {
    /** @private */
    this.friendlyNamesToArn = friendlyNamesToArn;
    this.compactMessages = compactMessages;
  }

  /**
   * Publish a message in an AWS SNS topic
   * @param {string} message - The message you want to compact
   */
  async compactMessage(message) {
    const messageCompacted = message;

    if (this.compactMessages) {
      const serialized = bson.serialize(message.body);
      const gzipped = await gzip(serialized);
      const compacted = Buffer.from(gzipped).toString('base64');

      messageCompacted.compacted = true;

      messageCompacted.body = compacted;
    } else {
      messageCompacted.compacted = false;
    }

    return JSON.stringify(messageCompacted);
  }

  /**
   * Publish a message in an AWS SNS topic
   * @param {string} topic - The topic name
   * @param {string} message - The message you want to publish
   */
  async publish(topic, message) {
    const sns = ClientFactory.create('sns');
    const logger = Logger.current().createChildLogger('message-bus:send');

    logger.log('Sending message to SNS', { message });

    try {
      const compactMessage = await this.compactMessage(message);

      return await sns.publish({
        Message: compactMessage,
        TopicArn: this.friendlyNamesToArn[topic],
      }).promise();
    } catch (error) {
      logger.error(error);
      throw new MessageBusError(`${errorMessages.messageBus.unavailable}: ${error}`);
    }
  }
}

module.exports = MessageBus;
