const CommandFactory = require('./src/common/commands/factory');
const PubSubAmqpMessageBus = require('./src/pub-sub/amqp/message-bus');
const PubSubMessageBusFactory = require('./src/pub-sub/factory');
const PubSubSnsMessageBus = require('./src/pub-sub/aws/sns/message-bus');
const QueueAmqpMessageBus = require('./src/queue/amqp/message-bus');
const QueueAwsSqsMessageBus = require('./src/queue/aws/message-bus');
const QueueMessageBusFactory = require('./src/queue/factory');
const TestingMessageBus = require('./src/pub-sub/testing-message-bus');
const LambdaHandler = require('./src/queue/aws/lambda/handler');

module.exports = {
  CommandFactory,
  PubSub: {
    Amqp: {
      MessageBus: PubSubAmqpMessageBus,
    },
    Aws: {
      MessageBus: PubSubSnsMessageBus,
    },
    Factory: PubSubMessageBusFactory,
    Testing: {
      MessageBus: TestingMessageBus,
    },
  },
  Queue: {
    Amqp: {
      MessageBus: QueueAmqpMessageBus,
    },
    Factory: QueueMessageBusFactory,
    Aws: {
      MessageBus: QueueAwsSqsMessageBus,
      LambdaHandler,
    },
  },
};
