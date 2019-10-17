const { Queue: { Aws: { LambdaHandler } } } = require('@naturacosmeticos/iris-nodejs-messenger');

const handler = new LambdaHandler({
  [process.env.CHECKOUT_SQS_ARN]: {
    friendlyName: 'checkout',
    url: process.env.CHECKOUT_SQS_URL,
  },
}, {
    checkout: (message, correlationId) => { // eslint-disable-line arrow-body-style
      return new Promise((resolve) => {
        console.log('correlationId:', correlationId); // eslint-disable-line no-console
        console.log('message:', message); // eslint-disable-line no-console
        resolve({ message, correlationId });
      });
    },
  });

exports.index = handler.handle.bind(handler);
