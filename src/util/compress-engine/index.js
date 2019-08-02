const CompressEngineEnum = require('./compress-engine-enum');
const CompressEngineFactory = require('./engines');

class CompressEngine {
  static compress(input, engine = CompressEngineEnum.GZIP) {
    CompressEngineFactory.create(engine);
    if (!CompressEngineFactory) return input;

    return CompressEngineFactory.compress(input);
  }

  static decompress(input, engine = CompressEngineEnum.GZIP) {
    CompressEngineFactory.create(engine);
    if (!CompressEngineFactory) return input;

    return CompressEngineFactory.decompress(input);
  }
}

module.exports = CompressEngine;
