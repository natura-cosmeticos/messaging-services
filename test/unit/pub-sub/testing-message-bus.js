const { assert } = require('chai');
const uuid = require('uuid/v4');
const { PubSub: { Testing: { MessageBus } } } = require('../../..');

describe('TestingMessageBus', () => {
  it('should not have any published messages by default', () => {
    const testingBus = new MessageBus();

    assert.isEmpty(testingBus.topics);
  });

  it('should populate topic data as we publish messages', () => {
    const testingBus = new MessageBus();
    const firstTopic = `Topic ${uuid()}`;
    const firstTopicMessage = `Message ${uuid()}`;
    const secondTopic = `Topic ${uuid()}`;
    const secondTopicMessage = `Message ${uuid()}`;

    testingBus.publish(firstTopic, firstTopicMessage);
    testingBus.publish(firstTopic, firstTopicMessage);
    testingBus.publish(secondTopic, secondTopicMessage);

    assert.lengthOf(Object.keys(testingBus.topics), 2);
    assert.lengthOf(testingBus.topics[firstTopic], 2);
    assert.lengthOf(testingBus.topics[secondTopic], 1);
  });
});
