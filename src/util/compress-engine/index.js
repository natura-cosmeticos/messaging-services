const CompressEngineEnum = require('./compress-engine-enum');

class CompressEngine {
  static compress(input, engine = CompressEngineEnum.GZIP) {
    return `${input}, ${engine}`;
  }

  static decompress(input, engine = CompressEngineEnum.GZIP) {
    return `${input}, ${engine}`;
  }
}

module.exports = CompressEngine;
