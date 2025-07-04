# Getting started running the ZNG Api services locally

## Prerequisites
- Docker Desktop (or other alternative)
- Means of running SQL scripts (pgAdmin, dbeaver, datagrip, etc.)
- AWS cli installation and credential configuration (needed for localStack)

## Dependent services
All required local services are defined in the [compose.yml](../local/compose.yml) file  
Before running any service locally ensure that these services are started using docker compose  
> // In the **./local directory**  
> docker compose up  

Currently the we are running the following services in docker:
- Postgres
- LocalStack [localstack setup](../local/localstack/localstack-setup.sh)
  - AWS SQS
  - AWS Lamba function(s) (with event source mapping to trigger function from SQS message)  
  - Future dependent services:
    - AWS S3
    - AWS ElastiCache (Redis) ???

## Database
- Database name: `zirtue_next_gen`
- Used schemas: `core, notification, payment`
- Initialization script: [Script](../db/database_init.sql)
  - This initialization is required because TypeORM cannot create DB schemas
  - Requires a running Postgres instance (preferably using docker compose)
  - Needs to be run **BEFORE** running any of the Apps for the 1st time

## Running a Service for debug
All 3 services have a Debug configuration defined here: [launch.json](../.vscode/launch.json)  
To run a service within VSCode (or a VSCode derivative) simple:
- Navigate to the Debug Tab
- Select the appropriate Service to Launch:  
  - Launch Code API  
  - Launch Notification API  
  - Launch Payment API
- Click on the Start Debugging button