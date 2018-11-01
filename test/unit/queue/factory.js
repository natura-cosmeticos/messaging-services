const { assert } = require('chai');

const {
  Queue: {
    Factory,
    Amqp: { MessageBus: AmqpMessageBus },
    Aws: { MessageBus: AwsSqsMessageBus },
  },
} = require('../../../index');

describe('Queue MessageBusFactory', () => {
  it('creates an amqp instance if developmentMode is specified', () => {
    const messageBus = Factory.create({ developmentMode: true });

    assert.instanceOf(messageBus, AmqpMessageBus);
  });

  it('creates a sns instance if no option is specified', () => {
    const messageBus = Factory.create();

    assert.instanceOf(messageBus, AwsSqsMessageBus);
  });
});
