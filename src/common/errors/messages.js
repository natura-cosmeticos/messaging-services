module.exports = {
  messageBus: {
    close: 'Message Bus error on close connection',
    compress: 'Failed to compress message - Sending uncompressed message',
    decompress: 'Failed to decompress message - Aborting message retrieval',
    delete: 'Failed to delete message - It will be reprocessed',
    unavailable: 'Message Bus Unavailable',
  },
  messageHandler: {
    error: 'Message handler failed - Aborting message consumption',
  },
};
