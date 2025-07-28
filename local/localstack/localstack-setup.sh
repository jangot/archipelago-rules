#!/bin/bash
set -e

# Set AWS environment variables for LocalStack
export AWS_DEFAULT_REGION=us-east-1
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_ENDPOINT_URL=http://localhost:4566

QUEUE_NAME="zng-events-queue"
TOPIC_NAME="zng-events-topic"
QUEUE_URL=${AWS_EVENTS_QUEUE_URL:-"http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/$QUEUE_NAME"}
TOPIC_ARN=${AWS_EVENTS_TOPIC:-"arn:aws:sns:us-east-1:000000000000:$TOPIC_NAME"}

echo "Creating SQS queue: $QUEUE_NAME"
awslocal sqs create-queue --queue-name "$QUEUE_NAME" --no-cli-pager

echo "Creating SNS topic: $TOPIC_NAME"
awslocal sns create-topic --name "$TOPIC_NAME" --no-cli-pager

echo "Queue URL: $QUEUE_URL"
echo "Topic ARN: $TOPIC_ARN"

QUEUE_ARN=$(awslocal sqs get-queue-attributes \
  --queue-url "$QUEUE_URL" \
  --attribute-name QueueArn \
  --query "Attributes.QueueArn" \
  --output text \
  --no-cli-pager)

echo "Queue ARN: $QUEUE_ARN"

POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "Allow-SNS-SendMessage",
    "Effect": "Allow",
    "Principal": { "Service": "sns.amazonaws.com" },
    "Action": "sqs:SendMessage",
    "Resource": "$QUEUE_ARN",
    "Condition": {
      "ArnEquals": { "aws:SourceArn": "$TOPIC_ARN" }
    }
  }]
}
EOF
)

POLICY_ESCAPED=$(echo "$POLICY" | tr -d '\n' | sed 's/"/\\"/g')

awslocal sqs set-queue-attributes \
  --queue-url "$QUEUE_URL" \
  --attributes "Policy=\"$POLICY_ESCAPED\"" \
  --no-cli-pager

echo "Policy set on queue"

awslocal sns subscribe \
  --topic-arn "$TOPIC_ARN" \
  --protocol sqs \
  --notification-endpoint "$QUEUE_ARN" \
  --no-cli-pager

echo "Subscription complete"
