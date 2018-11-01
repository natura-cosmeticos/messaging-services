module.exports = {
  inputFromSqsResponse(queueArn, response) {
    return {
      Records: response.Messages.map(message => ({
        attributes: {
          ApproximateFirstReceiveTimestamp: '1529104986230',
          ApproximateReceiveCount: '0',
          SenderId: '594035263019',
          SentTimestamp: '1529104986221',
        },
        awsRegion: process.env.AWS_REGION,
        body: JSON.stringify({ Message: message.Body }),
        eventSource: 'aws:sqs',
        eventSourceARN: queueArn,
        md5OfBody: message.MD5OfBody,
        messageAttributes: {},
        messageId: message.MessageId,
        receiptHandle: message.ReceiptHandle,
      })),
    };
  },
};
