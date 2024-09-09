# Bedrock Proxy

This repository contains a serverless application built with AWS CDK, Hono, and Zod. The application serves as a proxy for Bedrock, providing a chat interface and handling various chat-related requests and responses.

## Table of Contents

- [Bedrock Proxy](#bedrock-proxy)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Usage](#usage)
  - [Project Structure](#project-structure)
  - [Schemas](#schemas)
    - [Response Schemas](#response-schemas)
    - [Request Schemas](#request-schemas)
  - [API Endpoints](#api-endpoints)
    - [`/chat/completions`](#chatcompletions)
  - [Deployment](#deployment)

## Installation

To install the dependencies, run:

```sh
npm install
```

## Usage

To start the development server, run:

```sh
npm run dev
```

## Project Structure

The project is organized as follows:

- `lambda/bedrock-proxy/src/`: Contains the source code for the Lambda functions and related schemas.
- `lib/`: Contains the AWS CDK constructs and stack definitions.

## Schemas

The project uses Zod for schema validation. The schemas are defined in the `lambda/bedrock-proxy/src/schema` directory.

### Response Schemas

The response schemas are defined in `lambda/bedrock-proxy/src/schema/response/chat.ts`:

### Request Schemas

The request schemas are defined in `lambda/bedrock-proxy/src/schema/request/chat.ts`:

## API Endpoints

The API endpoints are defined in `lambda/bedrock-proxy/src/api/chat.ts`:


### `/chat/completions`

- **Method**: POST
- **Description**: Handles chat completions.
- **Request Body**: Validated against `ChatRequestSchema`.
- **Response**: Returns a chat response.


## Deployment

To deploy the project, run:

```sh
npm run deploy
```

This will build the project, create a zip file, and update the Lambda function code.