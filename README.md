# Iris Node.js Messenger

This project provides utilities to ease the communication between services.

## How to use

Install the package on your project using either npm or yarn:

```bash
npm i '@naturacosmeticos/iris-nodejs-messenger'

yarn add '@naturacosmeticos/iris-nodejs-messenger'
```

### Sending messages

```javascript
const { PubSub: { Factory } } = require('@naturacosmeticos/iris-nodejs-messenger');

// Create a AmqpMessageBus, switable for development environments
const messageBus = Factory.create({ developmentMode: true });

// Create a AwsSnsMessageBus, switable for production environments
const messageBus = Factory.create({ developmentMode: false });

// Publish
messageBus.publish('checkout', { ... })
```

### Receiving messages

#### By connecting SQS to your Lambda function
Use this option when you have an SQS queue connected to a lambda function.

Exports your lambda handler like this:

```javascript
const { CommandFactory, Queue: { Aws: { LambdaHandler } } } = require('@naturacosmeticos/iris-nodejs-messenger');

const handler = new LambdaHandler({
  'arn:aws:sqs:us-east-1:123456789012:inventory-updated': {
    friendlyName: 'inventory-updated',
    url: 'https://queue.amazonaws.com/111111111111/inventory-updated',
  },
  'arn:aws:sqs:us-east-1:123456789012:risk-analysis': {
    friendlyName: 'risk-analysis',
    url: 'https://queue.amazonaws.com/111111111111/risk-analysis',
  },
}, {
  'inventory-updated': async (message) => { },
  'risk-analysis': CommandFactory.createAndPromisify(RiskAnalysisCommandFactory)
})

exports.index = handler.handle.bind(handler);
```

#### By polling
Use this option when you have a long running process, like a Kubernetes
application for example.
In the constructor of the bus you must supply a map of the name of the handler
you want to invoke and the URL of that queue.

```javascript
const { CommandFactory, Queue: { Factory } } = require('@naturacosmeticos/iris-nodejs-messenger');

const messageBus = Factory.create({
  developmentMode: process.env.DEVELOPMENT_MODE === '1',
  awsSqsOptions: {
    friendlyNamesToUrl: {
      'inventory-updated': 'https://queue.amazonaws.com/111111111111/my-risk-analysis-queue',
      'risk-analysis': 'https://queue.amazonaws.com/111111111111/my-inventory-updated-command-queue',
    }
  }
});
messageBus.receive({
  'inventory-updated': async (message) => { },
  'risk-analysis': CommandFactory.createAndPromisify(RiskAnalysisCommandFactory)
})
```

## How to contribute

You can contribute submitting [pull requests](https://github.com/natura-cosmeticos/iris-nodejs-messenger/pulls).

### Setup

To setup your local env, you need to following these steps:

* `docker network create messaging`
* `docker-compose run messaging bash`, inside the container run `npm install`. After the packages installation, exit from the container
* `docker-compose up`

### Testing

Just run `npm test` inside the container (`docker-compose exec messaging bash`).

### Lint

To verify if any lint rule was broken run  inside the container: `npm run lint`.

### Update docs

Run `npm run docs` to generate a new documentation version.