#!/bin/bash
set -e

QUEUE_URL=${AWS_EVENTS_QUEUE_URL:-"http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/zng-events-queue"}
TOPIC_ARN=${AWS_EVENTS_TOPIC:-"arn:aws:sns:us-east-1:000000000000:zng-events-topic"}

echo "Queue URL: $QUEUE_URL"
echo "Topic ARN: $TOPIC_ARN"

QUEUE_ARN=$(awslocal sqs get-queue-attributes \
  --queue-url "$QUEUE_URL" \
  --attribute-name QueueArn \
  --query "Attributes.QueueArn" \
  --output text)

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
  --attributes "Policy=\"$POLICY_ESCAPED\""

echo "Policy set on queue"

awslocal sns subscribe \
  --topic-arn "$TOPIC_ARN" \
  --protocol sqs \
  --notification-endpoint "$QUEUE_ARN"

echo "Subscription complete"
