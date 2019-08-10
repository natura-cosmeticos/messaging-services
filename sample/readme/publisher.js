// Examples from README

const { PubSub: { Factory } } = require('@naturacosmeticos/iris-nodejs-messenger');
const AsyncHookStorage = require('@naturacosmeticos/async-hooks-storage');
const uuidV4 = require('uuid/V4');

AsyncHookStorage.enable();
AsyncHookStorage.newEntry('iris');

// Create a AmqpMessageBus, suitable for development environments
const messageBus = Factory.create({
  amqpOptions: {
    serverUrl: 'amqp://rabbitmq',
  },
  developmentMode: true,
});

// Publish
messageBus.publish('checkout', { message: 'message without correlation-id' });
AsyncHookStorage.setEntry('correlation-id',uuidV4());
messageBus.publish('checkout', { message: 'message with correlation-id' });

// If no error occurred, the message should have been sent to RabbitMQ.
// You can verify accessing RabbitMQ Dashboard: http://rabbitmq.messaging.localtest.me/#/ quest | quest
