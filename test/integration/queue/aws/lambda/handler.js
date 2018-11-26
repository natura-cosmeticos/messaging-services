const faker = require('faker/locale/en');
const { assert } = require('chai');

const SqsQueue = require('helpers/sqs-queue.js');

const { inputFromSqsResponse } = require('fixtures/aws-lambda');
const { Queue: { Aws: { LambdaHandler } } } = require('../../../../../');

async function handler(message) { // eslint-disable-line require-await
  if (message !== 'success') {
    throw new Error(`Message ${message} was not expected`);
  }
}

describe('LambdaHandler', () => {
  let queue;

  beforeEach(() => {
    queue = new SqsQueue(`${faker.company.bsNoun()}-${faker.random.number()}`);

    return queue.create();
  });
  afterEach(() => queue.remove());

  describe('with all the commands successfully executed', () => {
    it('removes all messages from the queues', async () => {
      const messageCount = faker.random.number({ max: 6, min: 3 });

      await queue.sendManyRepeatedly(messageCount, 'success');
      assert.equal(await queue.length(), messageCount);

      const lambdaInput = inputFromSqsResponse(
        await queue.arn(),
        await queue.receive(messageCount),
      );

      const arnToQueueInfo = {
        [await queue.arn()]: {
          friendlyName: queue.name,
          url: queue.queueUrl(),
        },
      };
      const handlerFactories = {
        [queue.name]: handler,
      };

      await new LambdaHandler(arnToQueueInfo, handlerFactories).handle(lambdaInput);
      assert.equal(await queue.length(), 0);
    });
  });

  describe('with only some commands successfully executed', () => {
    it('removes only successful messages from the queue', async () => {
      const messageCount = faker.random.number({ max: 8, min: 3 });
      const failedMessages = messageCount - 2;
      const successMessages = messageCount - failedMessages;

      assert.equal(await queue.length(), 0);
      await queue.sendManyRepeatedly(failedMessages, 'fail');
      await queue.sendManyRepeatedly(successMessages, 'success');
      assert.equal(await queue.length(), messageCount);
      const lambdaInput = inputFromSqsResponse(
        await queue.arn(),
        await queue.receive(messageCount),
      );

      const arnToQueueInfo = {
        [await queue.arn()]: {
          friendlyName: queue.name,
          url: queue.queueUrl(),
        },
      };
      const handlerFactories = {
        [queue.name]: handler,
      };

      await new LambdaHandler(arnToQueueInfo, handlerFactories)
        .handle(lambdaInput).catch(() => { });

      /*
        this sleep is necessary because testing with localstack sometimes the queue still
        has some messages that are in process of being deleted.
      */
      await new Promise(resolve => setTimeout(resolve, 500));

      assert.equal(await queue.length(), failedMessages);
    });
  });
});
