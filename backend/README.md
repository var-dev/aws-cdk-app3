# Backend Overview
This is a template project sole purpose of wich is to document some design patterns that I've discovered worked rather well for me.

## Architecture (AI generated)
The backend portion of this project is designed using a microservices architecture to ensure scalability and maintainability. Each service is responsible for a specific functionality and communicates with other services via RESTful APIs.

## Technologies Used (AI generated)
- **Programming Language**: Typescript
- **Framework**: AWS CDK
- **Database**: N/A
- **Authentication**: Okta
- **Containerization**: AWS Lambda
- **Orchestration**: AWS CDK

## Key Functionalities (AI generated)
- **Certificate Generation**: Handles the creation and signing of digital certificates.
- **User Management**: Manages user registration, authentication, and authorization.
- **API Gateway**: Acts as a single entry point for all client requests and routes them to the appropriate services.
- **Logging and Monitoring**: Implements logging and monitoring to track the performance and health of the services.

## Setup Instructions (AI generated)
1. Clone the repository.
2. Navigate to the `backend` directory.
3. Build the Docker images using `npm run build`.
4. Follow the URL *AppStack.distributionUrl

## Contribution Guidelines
- Fork the repository.
- Create a new branch for your feature or bugfix.
- Submit a pull request with a detailed description of your changes.


### Here is the folder structure with a brief description of each folder:

```
.vscode/                  # Contains Visual Studio Code specific settings
cdk.out/                  # Output directory for CDK synth and deploy
src/                      # Contains the source code of the project
  infra/                  # Infrastructure related code
    constructs/           # Contains AWS CDK constructs
    services/             # Contains AWS lambda handlerd and their modules 
    stacks/               # Contains CDK stack definitions
    utils/                # Contains utility functions
temp/                     # Temporary files
```