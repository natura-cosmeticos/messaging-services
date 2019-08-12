const amqp = require('amqplib');
const async = require('async');
const faker = require('faker/locale/en');
const { assert } = require('chai');
const compressEngine = require('../../../../src/util/compress-engine');

const { Queue: { Amqp: { MessageBus } } } = require('../../../../index');

const ServerUrl = 'amqp://rabbitmq';

describe('QueueAmqpMessageBus', () => {
  describe('receive', () => {
    let connection;
    let channel;
    let messageBus;

    beforeEach(async () => {
      messageBus = new MessageBus(ServerUrl);
      connection = await amqp.connect(ServerUrl);
      channel = await connection.createChannel();
    });
    afterEach(async () => {
      await messageBus.close();
      if (connection) await connection.close();
    });

    it('receives messages from a single queue', (done) => {
      (async () => {
        const bus = `${faker.company.bsBuzz()}-${faker.company.bsNoun()}`;
        const message = { message: faker.random.words() };

        await messageBus.receive({
          [bus]: async (receivedMessage) => { // eslint-disable-line require-await
            const decompressedMessage = await compressEngine.decompressMessage(receivedMessage);
            assert.deepEqual(decompressedMessage, message);
            done();
          },
        });
        await channel.publish(bus, '', Buffer.from(JSON.stringify(message)));
      })();
    });

    it('receives messages from multiple queues', (done) => {
      (async () => {
        const busList = [
          `${faker.company.bsBuzz()}-${faker.company.bsNoun()}`,
          `${faker.company.bsBuzz()}-${faker.company.bsNoun()}`,
        ];
        const callbacks = [];

        async.each(
          busList,
          (bus, cb) => callbacks.push(async () => cb()), // eslint-disable-line require-await
          done,
        );

        await messageBus.receive({
          [busList[0]]: callbacks[0],
          [busList[1]]: callbacks[1],
        });

        const buffer = Buffer.from(JSON.stringify({ message: faker.random.words() }));

        await channel.publish(busList[0], '', buffer);
        await channel.publish(busList[1], '', buffer);
      })();
    });
  });
});
