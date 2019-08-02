const amqp = require('amqplib');
const uuid = require('uuid/v4');
const { assert } = require('chai');

const { PubSub: { Amqp: { MessageBus } } } = require('../../../../index');

const ServerUrl = 'amqp://rabbitmq';

const sleep = () => new Promise(resolve => setTimeout(resolve, 500));

describe('PubSubAmqpMessageBus', () => {
  let connection;
  let channel;

  beforeEach(async () => {
    connection = await amqp.connect(ServerUrl);
    channel = await connection.createChannel();
  });
  afterEach(async () => { // eslint-disable-line require-await
    if (connection) connection.close();
  });

  describe('publish', () => {
    it('sends a message to an AMQP exchange', async () => {
      // Prepare
      const messageBus = new MessageBus(ServerUrl);
      const bus = `test-${uuid()}`;
      const message = uuid();

      await channel.assertExchange(bus, 'fanout');
      const { queue: tempQueue } = await channel.assertQueue('', { exclusive: true });

      await channel.bindQueue(tempQueue, bus);

      // Exercise
      await messageBus.publish(bus, message);

      // Verify

      await sleep();

      const receivedMessage = await channel.get(tempQueue);

      assert.isObject(receivedMessage);
      assert.equal(JSON.parse(receivedMessage.content.toString('utf-8')), message);
    });

    it('creates the target AMQP exchange', async () => {
      // Prepare
      const messageBus = new MessageBus(ServerUrl);
      const bus = `test-${uuid()}`;
      const message = uuid();

      // Exercise
      await messageBus.publish(bus, message);

      // Verify
      await channel.checkExchange(bus);
    });
  });
});
