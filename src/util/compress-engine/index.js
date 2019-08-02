const CompressEngineEnum = require('./compress-engine-enum');
const CompressEngineFactory = require('./engines');

async function extractInputMessage(inputMessage) {
  const compressEngine = CompressEngineFactory.create(inputMessage['x-iris-engine']);

  if (!compressEngine) return inputMessage['x-iris-data'];

  const input = await compressEngine.decompress(inputMessage['x-iris-data']);
  let resultData;

  try {
    resultData = JSON.parse(input);
  } catch (err) {
    resultData = input;
  }

  return resultData;
}

class CompressEngine {
  static compress(input, engine = CompressEngineEnum.GZIP) {
    const compressEngine = CompressEngineFactory.create(engine);

    if (!compressEngine) return input;

    return compressEngine.compress(input);
  }

  static async compressMessage(input, engine = CompressEngineEnum.GZIP) {
    const compressEngine = CompressEngineFactory.create(engine);

    if (!compressEngine) return input;
    let value = input;

    if (typeof value === 'object') value = JSON.stringify(value);
    const compressedData = await compressEngine.compress(value);

    return { 'x-iris-data': compressedData, 'x-iris-engine': engine };
  }

  static decompress(input, engine = CompressEngineEnum.GZIP) {
    const compressEngine = CompressEngineFactory.create(engine);

    if (!compressEngine) return input;

    return compressEngine.decompress(input);
  }

  static async decompressMessage(message) {
    let inputMessage = message;

    if (typeof inputMessage === 'string') {
      inputMessage = JSON.parse(inputMessage);
    }

    if (inputMessage['x-iris-engine'] && inputMessage['x-iris-data']) {
      inputMessage = await extractInputMessage(inputMessage);
    }

    return inputMessage;
  }
}

module.exports = CompressEngine;
