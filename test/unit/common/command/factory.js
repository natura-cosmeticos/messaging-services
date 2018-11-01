const { assert } = require('chai');
const { EventEmitter } = require('events');

const { CommandFactory } = require('../../../..');

class Factory {
  create() {
    return Object.assign({
      async execute(param) { // eslint-disable-line require-await
        if (param === 'success') this.emit('success');
      },
    }, EventEmitter.prototype);
  }
}

describe('CommandFactory', () => {
  it('creates a command from a factory and convert it to a promise', () => {
    const handler = CommandFactory.createAndPromisify(Factory);

    return handler('success');
  });

  it('saves the type of the wrapped factory', () => {
    const handler = CommandFactory.createAndPromisify(Factory);

    assert.instanceOf(handler.wrappedFactory, Factory);
  });

  it('results in a promise failure if the command does not emit success', (done) => {
    const handler = CommandFactory.createAndPromisify(Factory);

    handler('fail').catch(() => done());
  });
});
