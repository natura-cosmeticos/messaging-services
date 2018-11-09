const { PubSub: { Factory } } = require('@naturacosmeticos/iris-nodejs-messenger');

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
messageBus.publish('checkout', { message: 'my message' })
  .then((message) => {
    console.log('message sent:', message);
  });