const { assert } = require('chai');
const CompressEngine = require('../../../src/util/compress-engine');
const CompressEngineEnum = require('../../../src/util/compress-engine/compress-engine-enum');

describe('Testing Compression', () => {
  it('should compress and decompress as gzip', async () => {
    const inputData = 'TESTE MESSAGE';
    const compressedData = await CompressEngine.compress(inputData, CompressEngineEnum.GZIP);
    const decopressed = await CompressEngine.decompress(compressedData, CompressEngineEnum.GZIP);

    assert.equal(inputData, decopressed);
  });

  it('should not compress', async () => {
    const inputData = 'TESTE MESSAGE';
    const compressedData = await CompressEngine.compress(inputData, 'unrecognized engine');

    assert.equal(inputData, compressedData);
  });
});
