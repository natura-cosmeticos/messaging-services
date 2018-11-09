// Examples from README

const { PubSub: { Factory } } = require('@naturacosmeticos/iris-nodejs-messenger');

// Create a AmqpMessageBus, suitable for development environments
const messageBus = Factory.create({
  amqpOptions: {
    serverUrl: 'amqp://rabbitmq',
  },
  developmentMode: true,
});

// Publish
messageBus.publish('checkout', { message: 'my message' });

// If no error occurred, the message should have been sent to RabbitMQ.
// You can verify accessing RabbitMQ Dashboard: http://rabbitmq.messaging.localtest.me/#/ quest | quest
