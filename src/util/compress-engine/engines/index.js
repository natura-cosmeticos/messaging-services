const GzipEngine = require('./gzip');
const { GZIP } = require('../compress-engine-enum');

class CompressEngineFactory {
  static create(engine) {
    switch (engine) {
      case GZIP:
        return new GzipEngine();
      default:
        return undefined;
    }
  }
}
module.exports = CompressEngineFactory;
