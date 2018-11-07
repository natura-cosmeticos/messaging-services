class TestingMessageBus {
  constructor() {
    this.topics = {};
  }

  async publish(topic, message) { // eslint-disable-line require-await
    this.topics[topic] = this.topics[topic] || [];
    this.topics[topic].push(message);
  }

  /* istanbul ignore next */
  async receive() { // eslint-disable-line require-await
    throw new Error('Not implemented error');
  }
}

module.exports = TestingMessageBus;
