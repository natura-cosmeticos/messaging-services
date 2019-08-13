const CompressEngineEnum = require('./compress-engine-enum');
const CompressEngineFactory = require('./engines');

class CompressEngine {
  static async extractInputMessage(inputMessage) {
    try {
      const input = await this.decompress(inputMessage['x-iris-data'], inputMessage['x-iris-engine']);
      const resultData = JSON.parse(input);

      return resultData;
    } catch (err) {
      throw err;
    }
  }

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

  static async decompress(input, engine = CompressEngineEnum.GZIP) {
    const compressEngine = CompressEngineFactory.create(engine);

    if (!compressEngine) return input;

    const decompressedMessage = await compressEngine.decompress(input);

    return decompressedMessage;
  }

  static async decompressMessage(message) {
    let inputMessage = message;

    if (typeof inputMessage === 'string') {
      inputMessage = JSON.parse(inputMessage);
    }

    if (inputMessage['x-iris-engine'] && inputMessage['x-iris-data']) {
      inputMessage = await this.extractInputMessage(inputMessage);
    }

    return inputMessage;
  }
}

module.exports = CompressEngine;
