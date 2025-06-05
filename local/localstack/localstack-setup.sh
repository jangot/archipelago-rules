#!/bin/sh
echo "Initializing localstack sqs"

awslocal sqs create-queue --queue-name zng-events-queue
awslocal sqs create-queue --queue-name zng-events-queue.fifo --attributes FifoQueue=true

awslocal lambda create-function --function-name localstack-lambda-test --runtime nodejs22.x --zip-file fileb:///tmp/function.zip --handler test-lamda-handler.handler --role arn:aws:iam::000000000000:role/lambda-role

# Get queue ARN
QUEUE_ARN=$(awslocal sqs get-queue-attributes --queue-url http://localhost:4566/000000000000/zng-events-queue --attribute-name QueueArn --query 'Attributes.QueueArn' --output text)

# Create Event Source Mapping
awslocal lambda create-event-source-mapping --function-name localstack-lambda-test --event-source-arn "$QUEUE_ARN" --batch-size 1