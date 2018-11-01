const async = require('async');
const faker = require('faker/locale/en');
const { assert } = require('chai');
const SqsQueue = require('helpers/sqs-queue');

const { Queue: { Aws: { MessageBus } } } = require('../../../../index');

describe('QueueAwsSqsMessageBus', () => {
  it('receives messages from a single queue', (done) => {
    (async () => {
      let sqsQueue;
      let messageBus;

      try {
        sqsQueue = new SqsQueue(`${faker.company.bsNoun()}-${faker.random.number()}`);
        messageBus = new MessageBus({ [sqsQueue.name]: sqsQueue.queueUrl() });
        const message = faker.random.words();

        await sqsQueue.create();

        await messageBus.receive({
          [sqsQueue.name]: async (receivedMessage) => { // eslint-disable-line require-await
            assert.equal(receivedMessage, message);
            done();
          },
        });
        await sqsQueue.send(message);
      } finally {
        await messageBus.close();
        await sqsQueue.remove();
      }
    })();
  });

  it('receives messages from multiple queues', (done) => {
    (async () => {
      let sqsQueues;
      let messageBus;

      try {
        sqsQueues = [
          new SqsQueue(`${faker.company.bsNoun()}-${faker.random.number()}`),
          new SqsQueue(`${faker.company.bsNoun()}-${faker.random.number()}`),
        ];
        messageBus = new MessageBus({
          [sqsQueues[0].name]: sqsQueues[0].queueUrl(),
          [sqsQueues[1].name]: sqsQueues[1].queueUrl(),
        });
        await Promise.all(sqsQueues.map(queue => queue.create()));

        const callbacks = [];

        async.each(
          sqsQueues,
          (queue, cb) => callbacks.push(async () => cb()), // eslint-disable-line require-await
          done,
        );

        await messageBus.receive({
          [sqsQueues[0].name]: callbacks[0],
          [sqsQueues[1].name]: callbacks[1],
        });
        await sqsQueues[0].send('');
        await sqsQueues[1].send('');
      } finally {
        await messageBus.close();
        await Promise.all(sqsQueues.map(queue => queue.remove()));
      }
    })();
  });
});
