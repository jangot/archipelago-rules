## Project Prerequisites

### General project level resources
- (mac only)[brew](https://brew.sh/) package manager
- nvm (node version manager): helps manage multiple versions of Node
  - mac: [nvm](https://github.com/nvm-sh/nvm) `brew install nvm`
  - windows: [nvm-windows](https://github.com/coreybutler/nvm-windows)
- [NodeJs](https://nodejs.org/en): `version 22.13`
- [NestJs](https://nestjs.com/): `version 11.0`
- [Postgres](https://www.postgresql.org/) tools
  - mac: `brew install libpq` (for just the tools) or `brew install postgresql@16` (full intall of Postgres v16.6)
  - any: [run postgres in Docker](https://www.docker.com/blog/how-to-use-the-postgres-docker-official-image/) use v16.6
- [Hygen](https://github.com/mleduc-zirtue/hygen) Hygen Code Generation (used to generate various templated files)
  
### Higher level resources (key technologies)
- [AWS](https://console.aws.amazon.com/) Cloud provider for ZNG
- [AWS RDS - Managed Postgres](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/CHAP_AuroraOverview.html)
- [AWS SQS - Simple Queueing Service](https://aws.amazon.com/sqs/)
- [AWS S3 - File Storage](https://aws.amazon.com/s3/)