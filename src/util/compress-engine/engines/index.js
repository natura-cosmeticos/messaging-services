const gzip = require('./gzip');
const { GZIP } = require('../compress-engine-enum');

class CompressEngineFactory {
  static create(engine) {
    switch (engine) {
      case GZIP:
        return gzip;
      default:
        return undefined;
    }
  }
}
module.exports = CompressEngineFactory;
