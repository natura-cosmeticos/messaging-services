const Logger = require('@naturacosmeticos/clio-nodejs-logger');

const CompressEngine = require('../../../util/compress-engine');
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
  constructor(friendlyNamesToArn, compressEngine) {
    /** @private */
    this.friendlyNamesToArn = friendlyNamesToArn;
    this.compressEngine = compressEngine || process.env.IRIS_COMPRESS_ENGINE;
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
    const compressedMessage = await CompressEngine.compressMessage(message, this.compressEngine);

    try {
      return await sns.publish({
        Message: JSON.stringify(compressedMessage),
        TopicArn: this.friendlyNamesToArn[topic],
      }).promise();
    } catch (error) {
      logger.error(error);
      throw new MessageBusError(`${errorMessages.messageBus.unavailable}: ${error}`);
    }
  }
}

module.exports = MessageBus;
