const { promisify } = require('util');
const zlib = require('zlib');

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

class GzipEngine {
  async compress(input) {
    const buff = await gzip(input, { level: zlib.constants.Z_MAX_LEVEL });

    return buff.toString('base64');
  }

  async decompress(input) {
    const debased = Buffer.from(input, 'base64');
    const unziped = await gunzip(debased);

    return unziped.toString();
  }
}

module.exports = GzipEngine;
