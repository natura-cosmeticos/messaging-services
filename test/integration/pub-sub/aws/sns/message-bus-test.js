const AWS = require('aws-sdk');
const getRawBody = require('raw-body');
const http = require('http');
const os = require('os');
const uuid = require('uuid/v4');
const { assert } = require('chai');

const { PubSub: { Aws: { MessageBus } } } = require('../../../../../index');
const MessageBusError = require('../../../../../src/common/errors/message-bus-error');
const CompressEngine = require('../../../../../src/util/compress-engine/index');

const ipAddress = os.networkInterfaces().eth0[0].address;

AWS.config.region = 'us-east-1';

function createServer(cb) {
  return http.createServer(async (req, res) => {
    try {
      const buffer = await getRawBody(req);

      cb(null, buffer.toString());
    } catch (error) {
      cb(error);
    } finally {
      res.end();
    }
  });
}

describe('MessageBus', () => {
  const endpoint = new AWS.Endpoint(process.env.SNS_ENDPOINT);
  let sns;
  let topicName;
  let topicArn;
  let server;

  beforeEach(() => {
    topicName = `test-topic-${uuid()}`;
    sns = new AWS.SNS({ endpoint, region: process.env.AWS_REGION });

    return sns.createTopic({ Name: topicName }).promise().then((data) => {
      topicArn = data.TopicArn;
    });
  });
  afterEach(() => sns.deleteTopic({ TopicArn: topicArn }).promise());
  afterEach(() => server && server.close());

  it('sends a message to the given AWS SNS topic', (done) => {
    (async () => {
      const message = { message: `Message body  ${uuid()}` };

      server = createServer(async (err, buffer) => {
        const receivedMessage = JSON.parse(buffer.toString()).Message;
        const decompressedMessage = await CompressEngine.decompressMessage(receivedMessage);

        assert.isNull(err);
        assert.deepEqual(message, decompressedMessage);
        done();
      });
      const listener = server.listen(0);

      await sns.subscribe({
        Endpoint: `http://${ipAddress}:${listener.address().port}`,
        Protocol: 'http',
        ReturnSubscriptionArn: false,
        TopicArn: topicArn,
      }).promise();

      await new MessageBus({
        [topicName]: `arn:aws:sns:${process.env.AWS_REGION}:${process.env.AWS_ACCOUNT_ID}:${topicName}`,
      }).publish(topicName, message);

      server.close();
    })();
  });

  it('Send exception when not found topic', async () => {
    const wrongTopicName = `wrong-${topicName}`;
    const message = `Message body  ${uuid()}`;

    try {
      await new MessageBus({
        [wrongTopicName]: `arn:aws:sns:${process.env.AWS_REGION}:${process.env.AWS_ACCOUNT_ID}:${wrongTopicName}`,
      }).publish(topicName, message);
    } catch (error) {
      assert.instanceOf(error, MessageBusError);
    }
  });
});
