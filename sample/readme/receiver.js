// Examples from README

const { Queue: { Factory } } = require('@naturacosmeticos/iris-nodejs-messenger');

const messageBus = Factory.create({
  amqpOptions: {
    serverUrl: 'amqp://rabbitmq',
  },
  developmentMode: true,
});

messageBus.receive({
  checkout: (message) => { // eslint-disable-line arrow-body-style
    return new Promise((resolve) => {
      console.log(message); // eslint-disable-line no-console
      resolve(message);
    });
  },
});
