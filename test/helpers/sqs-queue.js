const { Endpoint, SQS } = require('aws-sdk');
const { camelizeKeys } = require('humps');
const CompressEngine = require('../../src/util/compress-engine');

class SqsQueue {
  constructor(name) {
    this.name = name;
    this.sqs = new SQS({ endpoint: new Endpoint(process.env.SQS_ENDPOINT) });
  }

  async arn() {
    return (await this.attributes()).queueArn;
  }

  async attributes() {
    const { attributes } = camelizeKeys(await this.sqs.getQueueAttributes({
      AttributeNames: ['All'],
      QueueUrl: this.queueUrl(),
    }).promise());

    return attributes;
  }

  async length() {
    return (await this.attributes()).approximateNumberOfMessages;
  }

  create() {
    return this.sqs.createQueue({ QueueName: this.name }).promise();
  }

  queueUrl() {
    return `http://localstack:4576/queue/${this.name}`;
  }

  receive(maxMessages) {
    return this.sqs.receiveMessage({
      MaxNumberOfMessages: maxMessages,
      QueueUrl: this.queueUrl(),
      VisibilityTimeout: 0,
    }).promise();
  }

  remove() {
    return this.sqs.deleteQueue({ QueueUrl: this.queueUrl() });
  }

  send(messageBody) {
    return this.sqs.sendMessage({
      MessageBody: JSON.stringify(messageBody),
      QueueUrl: this.queueUrl(),
    }).promise();
  }

  async sendManyRepeatedly(count, message) {
    const compressedMessage = await CompressEngine.compressMessage(message);

    return Promise.all(new Array(count).fill(0).map(() => this.send(compressedMessage)));
  }
}

module.exports = SqsQueue;
