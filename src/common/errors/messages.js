module.exports = {
  messageBus: {
    close: 'Message Bus error on close connection',
    unavailable: 'Message Bus Unavailable',
    compress: 'Failed to compress message - Sending uncompressed message',
    decompress: 'Failed to decompress message - Aborting message retrieval',
    delete: 'Failed to delete message - It will be reprocessed',
  },
  messageHandler: {
    error: 'Message handler failed - Aborting message consumption',
  },
};
