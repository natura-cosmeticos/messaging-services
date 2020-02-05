// Examples from README

const {
  PubSub: { Factory }
} = require('@naturacosmeticos/iris-nodejs-messenger');
const AsyncHookStorage = require('@naturacosmeticos/async-hooks-storage');
const uuidV4 = require('uuid/V4');
const retry = require('retry');

AsyncHookStorage.enable();
AsyncHookStorage.newEntry('iris');

// Create a AmqpMessageBus, suitable for development environments
const messageBus = Factory.create({
  amqpOptions: {
    serverUrl: 'amqp://rabbitmq'
  },
  developmentMode: true
});

const operation = retry.operation({
  retries: 2,
  /**
   * Exponential factor
   */
  factor: 5,
  minTimeout: 1 * 1000,
  maxTimeout: 60 * 1000,
  randomize: true
});

operation.attempt(currentAttempt => {
  /**
   * currentAttempt represent the iteration number
   */

  // Publish
  messageBus
    .publish('checkout', {
      message: 'message without correlation-id'
    })
    .catch(err => {
      operation.retry(err);
    });

  // If no error occurred, the message should have been sent to RabbitMQ.
  // You can verify accessing RabbitMQ Dashboard: http://rabbitmq.messaging.localtest.me/#/ quest | quest
  // Otherwise, it will attempt to execute again with a total of the retries
  // property defined on the operation object

  // For more usages of the retry, check the package on npm
  // https://www.npmjs.com/package/retry
});
