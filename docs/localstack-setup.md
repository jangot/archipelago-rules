# LocalStack Setup for Local Development

## Overview

LocalStack is used to emulate AWS services (SQS, SNS) in the local development environment. This allows testing AWS integrations without the need to connect to the real AWS.

## Configuration

### Docker Compose

LocalStack is configured in `local/compose.yml` with the following services:
- **SQS** - for message queues
- **SNS** - for event publishing

### Environment Variables

To work with LocalStack, add the following variables to your `.env` file:

```bash
# AWS LocalStack settings
AWS_REGION=us-east-1
AWS_ENDPOINT_URL=http://localhost:4566
AWS_EVENTS_QUEUE_URL=http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/zng-events-queue
AWS_EVENTS_TOPIC=arn:aws:sns:us-east-1:000000000000:zng-events-topic

# Local development settings
IS_LOCAL=1
AWS_PROFILE=localstack
```

**Important**: LocalStack works without AWS credentials as it is a local emulation.

## Getting Started

1. Start LocalStack:
```bash
cd local
docker compose up localstack
```

2. Wait for initialization (you'll see "LocalStack initialization completed" in the logs)

## Testing

To verify LocalStack is working, use the script:

```bash
./local/localstack/test-localstack-curl.sh
```

Or manually with curl:

```bash
# Check SQS queues
curl -s "http://localhost:4566/?Action=ListQueues&Version=2012-11-05"

# Check SNS topics
curl -s "http://localhost:4566/?Action=ListTopics&Version=2010-03-31"

# Send message to SQS
curl -s -X POST "http://localhost:4566/" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "Action=SendMessage&Version=2012-11-05&QueueUrl=http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/zng-events-queue&MessageBody={\"test\":\"message\"}"

# Publish to SNS
curl -s -X POST "http://localhost:4566/" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "Action=Publish&Version=2010-03-31&TopicArn=arn:aws:sns:us-east-1:000000000000:zng-events-topic&Message={\"test\":\"sns message\"}"
```

Or with AWS CLI (if configured):

```bash
# Setup for LocalStack
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1

# Check SQS queues
aws sqs list-queues --endpoint-url http://localhost:4566

# Check SNS topics
aws sns list-topics --endpoint-url http://localhost:4566
```

## Created Resources

When LocalStack starts, it automatically creates:

### SQS Queues
- `zng-events-queue` - standard queue
- `zng-events-queue.fifo` - FIFO queue

### SNS Topics
- `zng-events-topic` - topic for events

## Application Integration

The application automatically detects the local environment using the `IS_LOCAL=1` variable and:
- Uses LocalStack endpoint for AWS services
- Works with local SQS/SNS resources
- Configures logging to write to files in local environment
- Uses AWS profile for local development

## Troubleshooting

### LocalStack won't start
- Check that Docker is running
- Make sure port 4566 is free
- Check logs: `docker compose logs localstack`

### Application can't connect to LocalStack
- Make sure LocalStack is fully initialized
- Check environment variables
- Ensure `IS_LOCAL=1` is set

### Issues with awslocal
- If awslocal doesn't work correctly, use curl or AWS CLI with endpoint-url
- Make sure awslocal is configured to work with LocalStack