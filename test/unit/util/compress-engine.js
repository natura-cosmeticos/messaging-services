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

  it('should compress and decompress a Message as gzip ', async () => {
    const inputData = { teste: 'TESTE MESSAGE' };
    const compressedData = await CompressEngine.compressMessage(inputData, CompressEngineEnum.GZIP);
    const decopressed = await CompressEngine.decompressMessage(compressedData);

    assert.equal(inputData.teste, decopressed.teste);
  });

  it('should not compress a message', async () => {
    const inputData = { teste: 'TESTE MESSAGE' };
    const compressedData = await CompressEngine.compressMessage(inputData, 'unrecognized engine');

    assert.equal(inputData, compressedData);
  });

  it('should not decompress a message', async () => {
    const inputData = { teste: 'TESTE MESSAGE' };
    const decompressedData = await CompressEngine.decompressMessage(inputData, 'unrecognized engine');

    assert.equal(inputData, decompressedData);
  });
});
