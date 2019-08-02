const CompressEngineEnum = require('./compress-engine-enum');
const CompressEngineFactory = require('./engines');

class CompressEngine {
  static compress(input, engine = CompressEngineEnum.GZIP) {
    const compressEngine = CompressEngineFactory.create(engine);

    if (!compressEngine) return input;

    return compressEngine.compress(input);
  }

  static decompress(input, engine = CompressEngineEnum.GZIP) {
    const compressEngine = CompressEngineFactory.create(engine);

    if (!compressEngine) return input;

    return compressEngine.decompress(input);
  }
}

module.exports = CompressEngine;
