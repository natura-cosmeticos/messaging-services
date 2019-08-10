const { PubSub: { Factory } } = require('@naturacosmeticos/iris-nodejs-messenger');
const AsyncHookStorage = require('@naturacosmeticos/async-hook-storage');
const uuidV4 = require('uuid/V4');

AsyncHookStorage.enable();
AsyncHookStorage.newEntry('iris');

// Create a SNSMessageBus
const messageBus = Factory.create({
  awsSnsOptions: {
    friendlyNamesToArn: {
      checkout: process.env.ORDER_TOPIC_ARN,
    },
  },
  developmentMode: false,
});

// Publish
messageBus.publish('checkout', { message: 'message without correlation-id' })
  .then((message) => {
    console.log('message sent:', message);
});
AsyncHookStorage.setEntry('correlation-id',uuidV4());
messageBus.publish('checkout', { message: 'message with correlation-id' })
  .then((message) => {
    console.log('message sent:', message);
});