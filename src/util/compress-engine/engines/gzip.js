const { gzip, ungzip } = require('node-gzip');

class GzipEngine {
  async compress(input) {
    const buff = await gzip(input);

    return buff.toString('base64');
  }

  async decompress(input) {
    const debased = Buffer.from(input, 'base64');
    const unziped = await ungzip(debased);

    return unziped.toString();
  }
}

module.exports = GzipEngine;
