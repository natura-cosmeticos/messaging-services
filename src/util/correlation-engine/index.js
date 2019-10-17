const AsyncHooksStorage = require('@naturacosmeticos/async-hooks-storage');

class CorrelationEngine {
  static wrapMessage(unwrappedMessageJSON) {
    const correlationId = AsyncHooksStorage.getEntry('correlation-id');
    const wrappedMessage = correlationId
      ? { correlationId, message: unwrappedMessageJSON } : unwrappedMessageJSON;

    return wrappedMessage;
  }

  // eslint-disable-next-line complexity
  static unwrapMessage(wrappedMessageJSON) {
    const isCorrelationIdWrappedMessage = (wrappedMessageJSON && wrappedMessageJSON.correlationId
      && wrappedMessageJSON.message && Object.keys(wrappedMessageJSON).length === 2);
    const body = isCorrelationIdWrappedMessage ? wrappedMessageJSON.message : wrappedMessageJSON;
    const correlationId = isCorrelationIdWrappedMessage
      ? wrappedMessageJSON.correlationId : undefined;

    return { body, correlationId };
  }
}

module.exports = CorrelationEngine;
