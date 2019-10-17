// Examples from README

const { Queue: { Factory } } = require('@naturacosmeticos/iris-nodejs-messenger');

const messageBus = Factory.create({
  amqpOptions: {
    serverUrl: 'amqp://rabbitmq',
  },
  developmentMode: true,
});

messageBus.receive({
  checkout: (message, correlationId) => { // eslint-disable-line arrow-body-style
    return new Promise((resolve) => {
      console.log('correlationId:',correlationId); // eslint-disable-line no-console
      console.log('message:',message); // eslint-disable-line no-console
      resolve({message,correlationId});
    });
  },
});
