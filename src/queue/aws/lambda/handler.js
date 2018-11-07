const ClientFactory = require('../../../common/aws/client-factory');
const LoggerContext = require('../../../common/logger/context');

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

  async handleRecord({ body, eventSourceARN: arn, receiptHandle }) {
    const queueInfo = this.arnToQueueInfo[arn];

    await this.handlers[queueInfo.friendlyName](JSON.parse(JSON.parse(body).Message));

    await this.sqs.deleteMessage({
      QueueUrl: queueInfo.url,
      ReceiptHandle: receiptHandle,
    }).promise();
  }
}

module.exports = LambdaHandler;
