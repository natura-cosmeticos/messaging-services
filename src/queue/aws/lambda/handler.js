const Logger = require('@naturacosmeticos/clio-nodejs-logger');
const ClientFactory = require('../../../common/aws/client-factory');
const LoggerContext = require('../../../common/logger/context');
const CorrelationEngine = require('../../../util/correlation-engine');
const CompressEngine = require('../../../util/compress-engine');
const errorMessages = require('../../../common/errors/messages');
const MessageBusError = require('../../../common/errors/message-bus-error');

class LambdaHandler {
  /**
   * @param {Object} arnToQueueInfo - Map of AWS SQS ARNs to queue info
   * @param {Object} handlers - Map of friendly handler names to command handlers
   */
  constructor(arnToQueueInfo, handlers) {
    /** @private */
    this.arnToQueueInfo = arnToQueueInfo;
    this.handlers = handlers;
  }

  async handle({ Records: records }) { // eslint-disable-line require-await
    /** @private */
    this.sqs = ClientFactory.create('sqs');

    return new Promise((resolve, reject) => {
      LoggerContext.run(() => {
        Promise.all(records.map((record) => {
          const { friendlyName } = this.arnToQueueInfo[record.eventSourceARN];

          return LoggerContext
            .logItemProcessing(() => this.handleRecord(record), friendlyName, record);
        })).then(resolve).catch(reject);
      });
    });
  }

  async handleRecord({
    body, eventSourceARN: arn, receiptHandle, messageId,
  }) {
    const logger = Logger.current().createChildLogger('lambdaHandler:handleRecord');
    const queueInfo = this.arnToQueueInfo[arn];
    const awsMessage = JSON.parse(body);

    try {
      const wrappedCorrelationIdMessage = await CompressEngine.decompressMessage(awsMessage);
      const { body, correlationId } = CorrelationEngine.unwrapMessage(wrappedCorrelationIdMessage);

      try {
        await this.handlers[queueInfo.friendlyName](body, correlationId);

        await this.sqs.deleteMessage({
          QueueUrl: queueInfo.url,
          ReceiptHandle: receiptHandle,
        }).promise();
      } catch (error) {
        logger.error(`MessageId ${messageId}: ${errorMessages.messageHandler.error} - ${error}`);
        throw new MessageBusError(`MessageId ${messageId}: ${errorMessages.messageHandler.error}: ${error}`);
      }
    } catch (error) {
      logger.error(`MessageId ${messageId}: ${errorMessages.messageBus.decompress} - ${error}`);
      throw new MessageBusError(`MessageId ${messageId}: ${errorMessages.messageBus.decompress}: ${error}`);
    }
  }
}

module.exports = LambdaHandler;
