# Iris Node.js Messenger

This project provides utilities to ease the communication between services.

Iris was created with the scenario where the local enviroment would use RabbitMQ and the production enviroment would use SNS and SQS services from AWS.

You can use that same interface to communicate with RabbitMQ and SNS/SQS. Providing an easy way to create integration tests without AWS Services.

In future versions we are planning to add new services like Kafka and ActiveMQ.

## How to use

Install the package on your project using either npm or yarn:

```bash
npm i '@naturacosmeticos/iris-nodejs-messenger'

yarn add '@naturacosmeticos/iris-nodejs-messenger'
```

In the following section we are going to present some examples, that can be found also inside `sample/readme`.

### RabbitMQ

For now, RabbitMQ can be used only for developmentMode, so you need to pass `development` equals `true`.

#### Sending messages

The `publish` will post a message inside the `checkout` exchange, that will fanout to the queue `checkout-messaging-services`.

```javascript
const { PubSub: { Factory } } = require('@naturacosmeticos/iris-nodejs-messenger');

// Create a AmqpMessageBus
const messageBus = Factory.create({
  amqpOptions: {
    serverUrl: 'amqp://rabbitmq',
  },
  developmentMode: true,
});

// Publish
messageBus.publish('checkout', { message: 'my message' });
```

You can verify the message created accessing RabbitMQ Dashboard:

* http://rabbitmq.messaging.localtest.me/#/
* user: quest
* password: quest

#### Receiving messages

Now to receive the messages posted you just need to pass an object where the attributes need to be the name of our exchange and the value a promise that will be executed.

```javascript
const { Queue: { Factory } } = require('@naturacosmeticos/iris-nodejs-messenger');

const messageBus = Factory.create({
  amqpOptions: {
    serverUrl: 'amqp://rabbitmq',
  },
  developmentMode: true,
});

messageBus.receive({
  checkout: (message) => {
    return new Promise((resolve) => {
      console.log(message);
      resolve(message);
    });
  },
});
```

### AWS

#### Sending messages

Before you test the following example you need to change some configurations in the `docker-compose.yml`:

* Remove `SNS_ENDPOINT` and `SQS_ENDPOINT`. Those variables are only used when you want to test using the localstack container
* Update `AWS_ACCOUNT_ID`, `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` with your AWS user credentials. Also you may need to change the `AWS_REGION` variable, if you are not using `us-east-1`

```javascript
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
```

#### Receiving messages
Use this option when you have an SQS queue connected to a lambda function.

Exports your lambda handler like this:

```javascript
const { Queue: { Aws: { LambdaHandler } } } = require('@naturacosmeticos/iris-nodejs-messenger');

const handler = new LambdaHandler({
  [process.env.CHECKOUT_SQS_ARN]: {
    friendlyName: 'checkout',
    url: process.env.CHECKOUT_SQS_URL,
  },
}, {
  checkout: (message) => {
    return new Promise((resolve) => {
      console.log(message);
      resolve(message);
    });
  },
});

exports.index = handler.handle.bind(handler);
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