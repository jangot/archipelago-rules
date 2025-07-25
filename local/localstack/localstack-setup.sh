#!/bin/sh
echo "Initializing localstack services"

# Create SQS queues
echo "Creating SQS queues..."
awslocal sqs create-queue --queue-name zng-events-queue
awslocal sqs create-queue --queue-name zng-events-queue.fifo --attributes FifoQueue=true

# Create SNS topic
echo "Creating SNS topic..."
awslocal sns create-topic --name zng-events-topic

echo "LocalStack initialization completed"