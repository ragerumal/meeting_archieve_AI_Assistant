# Zoom Meeting Archive AI Assistant

A production-grade serverless RAG (Retrieval-Augmented Generation) application that automatically ingests Zoom meeting transcripts, indexes them into a vector database, and enables intelligent querying through a secure web interface powered by Amazon Bedrock's Claude 3 Haiku model.

---

## 📋 Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Key Features](#key-features)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

### Problem Statement

Organizations generate vast amounts of institutional knowledge during team meetings, yet accessing specific information from hours of recorded audio and transcripts is inefficient and time-consuming. Decision items, action items, and crucial context are often lost or difficult to retrieve.

### Solution

Zoom Meeting Archive AI Assistant provides an automated, serverless pipeline that:

1. **Automatically ingests** Zoom meeting transcripts upon completion
2. **Processes and vectors** transcript data using Amazon OpenSearch Serverless
3. **Enables semantic search** through a Retrieval-Augmented Generation (RAG) interface
4. **Delivers answers** using Claude 3 Haiku through Amazon Bedrock
5. **Secures access** with Amazon Cognito user authentication

The entire solution runs on AWS serverless infrastructure with zero servers to manage.

### Use Cases

- **Meeting Intelligence**: Quickly find decisions, action items, and key discussions
- **Compliance & Audit**: Maintain searchable records of team communications
- **Knowledge Management**: Build an organizational knowledge base from meeting transcripts
- **Team Collaboration**: Enable team members to quickly reference past discussions

---

## System Architecture

### Architecture Diagram

![System Architecture](Architecture2.gif)

### Data Flow Pipeline

```
┌─────────────┐
│ Zoom Meeting│ Recording Completed
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────────────┐
│ Data Ingestion Lambda                        │
│ • Retrieves transcript via Zoom API          │
│ • Downloads VTT format transcript            │
│ • Validates format & metadata                │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │   S3 Transcript Bucket│
        │   (Raw VTT Files)    │
        └──────────┬───────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│ Data Processing Lambda                       │
│ • Parses VTT format                          │
│ • Chunks text for vectorization              │
│ • Extracts speaker & timestamp metadata      │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
      ┌────────────────────────────┐
      │  Bedrock Knowledge Base    │
      │  • Chunks transcripts      │
      │  • Generates embeddings    │
      └───────────┬────────────────┘
                  │
                  ▼
         ┌─────────────────────┐
         │ OpenSearch Serverless│
         │ (Vector Database)   │
         └─────────────────────┘
                  ▲
                  │
    ┌─────────────┴──────────────┐
    │ User Query via Web UI       │
    ▼                            ▼
┌─────────────┐        ┌──────────────────┐
│ CloudFront  │        │ API Gateway      │
│ CDN         │◄──────►│ (Cognito Auth)   │
└─────────────┘        └────────┬─────────┘
                                │
                                ▼
                     ┌──────────────────────┐
                     │ Query Lambda         │
                     │ • Retrieves context  │
                     │ • Calls Bedrock      │
                     │ • Returns answer     │
                     └──────────────────────┘
```

### Components Overview

| Component | Purpose | AWS Service |
|-----------|---------|-------------|
| **Data Ingestion** | Fetch Zoom transcripts via API | Lambda + Secrets Manager |
| **Data Processing** | Parse VTT, chunk content | Lambda + S3 |
| **Vectorization** | Convert text to embeddings | Bedrock Knowledge Base |
| **Vector Storage** | Store and search embeddings | OpenSearch Serverless |
| **Query Engine** | Process user questions, generate responses | Bedrock + Lambda |
| **API Layer** | REST endpoints for frontend | API Gateway |
| **Authentication** | User sign-up/login | Cognito Identity Provider |
| **Frontend Hosting** | Serve React SPA | S3 + CloudFront |
| **CDN** | Global content delivery | CloudFront |

---

## Tech Stack

### Backend & Infrastructure

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Compute** | AWS Lambda (Python 3.11) | Serverless functions for data processing & queries |
| **API** | API Gateway + Cognito Authorizer | REST endpoints with JWT authentication |
| **Storage** | Amazon S3 | Transcript storage & frontend hosting |
| **Vector DB** | OpenSearch Serverless | Semantic search on transcript embeddings |
| **AI/LLM** | Amazon Bedrock + Claude 3 Haiku | RAG-powered answer generation |
| **Auth** | Amazon Cognito | User authentication & authorization |
| **IaC** | AWS SAM + CloudFormation | Infrastructure as Code |
| **Monitoring** | CloudWatch | Logs, metrics, alarms |

### Frontend

| Technology | Purpose |
|-----------|---------|
| **React 18** | UI framework |
| **TypeScript** | Type-safe development |
| **AWS Amplify** | Authentication & AWS integration |
| **Axios** | HTTP client with interceptors |
| **Zustand** | State management (lightweight) |
| **CSS3** | Modern styling with animations |

### Data Format

| Aspect | Specification |
|--------|---------------|
| **Transcript Format** | WebVTT (Video Text Track) |
| **Timestamp Format** | `HH:MM:SS.mmm --> HH:MM:SS.mmm` |
| **Metadata** | Speaker identification, duration, participant count |
| **API Format** | JSON (REST) |

---

## Key Features

### 🎯 Core Capabilities

- **Automated Ingestion**: Background-free Zoom transcript syncing immediately after meetings end
- **Speaker-Aware Retrieval**: Intelligent indexing that preserves speaker identification and timestamp context
- **Enterprise Security**: Complete authentication workflow via Cognito with JWT token-based API access
- **Real-Time RAG Answers**: Sub-second semantic search powered by Claude 3 Haiku embeddings
- **Conversation Tracking**: Multi-turn conversations with context preservation
- **Source Attribution**: Answers include citations with exact speaker and timestamp references
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

### 🔐 Security Features

- **JWT Authentication**: Cognito-issued tokens for all API requests
- **Role-Based Access**: IAM policies restrict Lambda access to designated resources
- **Encrypted Storage**: S3 bucket policies and encryption at rest
- **Secret Management**: Zoom credentials stored securely in AWS Secrets Manager
- **API Authorization**: Cognito authorizer on all API Gateway endpoints
- **HTTPS-Only**: CloudFront enforces HTTPS for all frontend traffic

### 📊 Operational Features

- **CloudWatch Monitoring**: Real-time logs and custom metrics
- **Error Handling**: Graceful error handling with informative messages
- **Rate Limiting**: API Gateway throttling to prevent abuse
- **Auto-Scaling**: Lambda auto-scales based on demand
- **Cost Optimization**: Serverless architecture eliminates idle costs

---

## Prerequisites

Before deploying this project, ensure you have:

### Required AWS Account Setup

- ✅ Active AWS account with sufficient IAM permissions
- ✅ AWS CLI v2 installed and configured with credentials
- ✅ AWS SAM CLI v1.96+ installed
- ✅ Appropriate service quotas increased:
  - Lambda: 1000+ concurrent executions
  - OpenSearch Serverless: Vector database capacity units
  - Bedrock: Access to Claude 3 Haiku model

### External Services

- ✅ **Zoom Marketplace Account** with Server-to-Server OAuth application
- ✅ **Zoom JWT or OAuth credentials** for meeting transcript API access
- ✅ **Git** installed for repository cloning

### Local Development Environment

- ✅ **Node.js 18+** (for frontend development)
- ✅ **Python 3.11+** (for Lambda development/testing)
- ✅ **Docker** (for AWS SAM local testing - optional)

### Recommended AWS Regions

Deploy to one of these regions with Bedrock support:
- `us-east-1` (N. Virginia) - Primary region
- `us-west-2` (Oregon)
- `eu-west-1` (Ireland)

---

## Getting Started

### Quick Start (5-10 minutes)

#### 1. Clone the Repository

```bash
git clone https://github.com/ragerumal/meeting_archieve_AI_Assistant.git
cd meeting_archieve_AI_Assistant
```

#### 2. Configure Environment Variables

Copy the environment template and fill in your values:

```bash
cp .env.example .env
# Edit .env with your AWS credentials and Zoom API keys
nano .env
```

#### 3. Deploy Infrastructure

```bash
# Build the SAM template
sam build

# Deploy with guided setup
sam deploy --guided

# Or deploy non-interactively
sam deploy --parameter-overrides \
  BedrockKBId=<your-kb-id> \
  OpenSearchEndpoint=<your-endpoint> \
  ZoomSecretsArn=<your-secrets-arn>
```

#### 4. Configure Frontend

```bash
cd frontend
npm install
npm run build

# Deploy to S3
aws s3 sync ./build s3://<your-frontend-bucket> --delete
```

#### 5. Access the Application

Navigate to your CloudFront URL and log in with your Cognito credentials.

---

## Project Structure

```
meeting_archieve_AI_Assistant/
├── README.md                           # This file
├── DEPLOYMENT.md                       # Detailed deployment guide
├── template.yaml                       # AWS SAM CloudFormation template
├── .env                               # Environment variables (Git ignored)
├── .env.example                       # Environment template
├── .gitignore                         # Git ignore rules
│
├── frontend/                          # React TypeScript Frontend
│   ├── public/
│   │   └── index.html                # HTML template
│   ├── src/
│   │   ├── index.tsx                 # React DOM entry point
│   │   ├── index.css                 # Global styles
│   │   ├── App.tsx                   # Main App component
│   │   ├── App.css                   # App styling
│   │   ├── config/
│   │   │   └── awsConfig.ts          # AWS Amplify configuration
│   │   ├── services/
│   │   │   └── apiService.ts         # API client for Lambda
│   │   └── components/
│   │       ├── RAGQueryInterface.tsx  # Chat interface component
│   │       └── RAGQueryInterface.css  # Chat styling
│   ├── package.json                  # npm dependencies
│   ├── tsconfig.json                 # TypeScript config
│   ├── .env                          # Frontend env vars
│   ├── .env.example                  # Frontend env template
│   ├── .gitignore                    # Frontend git ignore
│   └── README.md                     # Frontend documentation
│
├── src/                              # Lambda source code
│   ├── lambdas/
│   │   ├── data_ingestion/
│   │   │   └── index.py             # Zoom API → S3
│   │   ├── data_processing/
│   │   │   └── index.py             # S3 → Bedrock vectorization
│   │   └── query_handler/
│   │       └── index.py             # User queries → Bedrock → Response
│   └── layers/                      # Lambda layers for dependencies
│       └── python/
│           ├── boto3/
│           ├── requests/
│           └── PyJWT/
│
└── Architecture2.gif                # Architecture diagram
```

---

## Configuration

### Environment Variables

#### Root Level (`.env`)

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012

# Zoom API Credentials
ZOOM_CLIENT_ID=your_zoom_client_id
ZOOM_CLIENT_SECRET=your_zoom_client_secret
ZOOM_ACCOUNT_ID=your_zoom_account_id

# AWS Services
TRANSCRIPT_BUCKET=zoom-rag-transcripts-{account-id}
FRONTEND_BUCKET=zoom-rag-frontend-{account-id}
OPENSEARCH_ENDPOINT=https://your-collection.us-east-1.aoss.amazonaws.com
BEDROCK_KB_ID=your-bedrock-kb-id
BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0

# Cognito Configuration
COGNITO_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
COGNITO_CLIENT_ID=your_cognito_client_id
COGNITO_IDENTITY_POOL_ID=us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# API Gateway
API_GATEWAY_ENDPOINT=https://api-id.execute-api.us-east-1.amazonaws.com/prod
CLOUDFRONT_DISTRIBUTION_ID=E1234567890ABC

# Optional: Development & Debugging
DEBUG=false
ENVIRONMENT=production
```

#### Frontend Level (`frontend/.env`)

```env
REACT_APP_API_GATEWAY_ENDPOINT=https://api-id.execute-api.us-east-1.amazonaws.com/prod
REACT_APP_COGNITO_REGION=us-east-1
REACT_APP_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
REACT_APP_COGNITO_CLIENT_ID=your_cognito_client_id
REACT_APP_COGNITO_IDENTITY_POOL_ID=us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
REACT_APP_COGNITO_REDIRECT_URI=https://d1234567890abc.cloudfront.net
REACT_APP_COGNITO_LOGOUT_URI=https://d1234567890abc.cloudfront.net
REACT_APP_ENVIRONMENT=production
```

### AWS Secrets Manager

Store Zoom credentials securely:

```bash
aws secretsmanager create-secret \
  --name zoom/api-credentials \
  --secret-string '{
    "client_id": "your_client_id",
    "client_secret": "your_client_secret",
    "account_id": "your_account_id"
  }' \
  --region us-east-1
```

---

## Deployment

### Full Deployment Guide

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive step-by-step instructions covering:

1. **Zoom API Setup** - Register app and obtain credentials
2. **AWS Service Configuration** - Create OpenSearch collection and Bedrock KB
3. **Infrastructure Deployment** - SAM build and deploy
4. **Frontend Deployment** - Build and upload to S3
5. **Cognito Setup** - Configure user pools and hosted UI
6. **Testing & Validation** - Verify all components
7. **Monitoring & Logging** - Set up CloudWatch
8. **Troubleshooting** - Common issues and solutions

### Quick Deploy Script

```bash
#!/bin/bash
# Deploy all components

# 1. Infrastructure
echo "Building and deploying infrastructure..."
sam build
sam deploy --guided

# 2. Frontend
echo "Building and deploying frontend..."
cd frontend
npm install
npm run build
aws s3 sync ./build s3://$(grep FRONTEND_BUCKET ../.env | cut -d= -f2) --delete

echo "Deployment complete! Access the app at your CloudFront URL."
```

---

## API Reference

### Authentication

All API requests require a Cognito JWT token in the `Authorization` header:

```http
Authorization: Bearer <cognito_jwt_token>
```

### Endpoints

#### Query RAG System

**POST** `/query`

Submit a question to the RAG system and receive an AI-generated answer with source citations.

**Request:**
```json
{
  "user_query": "What were the key action items discussed?",
  "conversation_id": "conv_1692345678_abc123def"
}
```

**Response:**
```json
{
  "success": true,
  "query": "What were the key action items discussed?",
  "answer": "Based on the meeting transcript, the key action items were...",
  "sources": [
    {
      "document": "Meeting_2026-08-15.vtt",
      "location": "00:15:32 - 00:16:45 [Speaker: John Smith]"
    }
  ],
  "confidence": 0.92,
  "timestamp": "2026-08-17T14:30:45Z"
}
```

**Status Codes:**
- `200 OK` - Query processed successfully
- `400 Bad Request` - Invalid query parameters
- `401 Unauthorized` - Missing or invalid JWT token
- `500 Internal Server Error` - Backend processing error

#### Get Meetings

**GET** `/meetings`

Retrieve a list of available meetings with transcript metadata.

**Response:**
```json
{
  "meetings": [
    {
      "meeting_id": "12345678901",
      "title": "Q3 Planning Session",
      "date": "2026-08-15",
      "duration": 3600,
      "participants": 8,
      "transcript_url": "s3://bucket/transcripts/raw/12345678901_2026-08-15T10:00:00Z.vtt"
    }
  ]
}
```

#### Health Check

**GET** `/health`

Verify API Gateway and Lambda connectivity.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-08-17T14:30:45Z",
  "version": "1.0.0"
}
```

---

## Frontend

### React Components

#### RAGQueryInterface Component

Main chat interface for user queries.

**Features:**
- Real-time message streaming
- Typing indicators during processing
- Source citation display
- Conversation history tracking
- Message auto-scroll

**Props:** None (uses context for state)

**State:**
```typescript
interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: Array<{ document: string; location: string }>;
}
```

#### App Component

Authentication wrapper and main application layout.

**Features:**
- Cognito authentication check
- Protected route access
- User menu with logout
- Loading spinner during auth

---

## Lambda Functions

### Data Ingestion Lambda

**Trigger:** API Gateway POST `/ingest`

**Purpose:** 
- Fetch Zoom meeting transcripts via Zoom API
- Validate VTT format
- Store raw transcripts in S3
- Extract and store metadata

**Environment Variables:**
- `TRANSCRIPT_BUCKET` - S3 bucket for storing transcripts
- `ZOOM_SECRETS_ARN` - AWS Secrets Manager ARN for Zoom credentials

**Performance:**
- Timeout: 60 seconds
- Memory: 512 MB
- Concurrent Execution: 100+

### Data Processing Lambda

**Trigger:** S3 ObjectCreated event on transcript upload

**Purpose:**
- Parse VTT format transcripts
- Split text into semantic chunks
- Extract speaker and timestamp metadata
- Invoke Bedrock Knowledge Base for vectorization

**Performance:**
- Timeout: 120 seconds
- Memory: 1024 MB

### Query Handler Lambda

**Trigger:** API Gateway POST `/query`

**Purpose:**
- Receive user queries
- Retrieve relevant context from OpenSearch via Bedrock KB
- Generate answers using Claude 3 Haiku
- Return answer with source citations

**Performance:**
- Timeout: 30 seconds
- Memory: 512 MB
- Concurrent Execution: 1000+

---

## Monitoring & Logging

### CloudWatch Dashboards

Access CloudWatch dashboards to monitor:

- **Lambda Metrics**: Invocations, errors, duration, throttles
- **API Gateway**: Request count, latency, errors (4xx, 5xx)
- **S3**: Upload frequency, total size, storage costs
- **OpenSearch**: Query latency, indexing rate, cluster health

### Custom Metrics

- `RAGQueryLatency` - Time from user query to response
- `VTTIngestionRate` - Transcripts processed per hour
- `VectorIndexSize` - Total embeddings in OpenSearch
- `BedrockTokenUsage` - Input/output tokens consumed

### Log Groups

CloudWatch Logs are automatically created for:
- `/aws/lambda/DataIngestionLambda`
- `/aws/lambda/DataProcessingLambda`
- `/aws/lambda/QueryHandlerLambda`
- `/aws/apigateway/ZoomRAGApi`

### Alarms

Set up CloudWatch alarms for:
- Lambda error rate > 5%
- API Gateway 5xx errors > 10
- OpenSearch query latency > 2 seconds
- Bedrock quota exceeded

---

## Troubleshooting

### Common Issues & Solutions

#### Issue: "Unauthorized" Error on API Calls

**Cause:** JWT token expired or missing

**Solution:**
```typescript
// Ensure Amplify is configured correctly
import { Amplify } from 'aws-amplify';
import awsConfig from './config/awsConfig';

Amplify.configure(awsConfig);
```

#### Issue: "Transcript not found" Error

**Cause:** Zoom API credentials invalid or meeting not recorded

**Solution:**
1. Verify Zoom credentials in Secrets Manager
2. Check meeting recording settings
3. Confirm meeting ID format

#### Issue: Slow Query Responses

**Cause:** Large OpenSearch dataset or network latency

**Solution:**
1. Optimize chunking strategy in Data Processing Lambda
2. Increase Lambda memory allocation
3. Use CloudFront for frontend caching

#### Issue: Frontend Build Failures

**Cause:** Missing dependencies or TypeScript errors

**Solution:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build --verbose
```

---

## Performance Optimization

### Backend Optimization

- **Lambda Memory**: Allocate 1024 MB for data processing
- **Connection Pooling**: Reuse boto3 clients across invocations
- **Batch Processing**: Process multiple transcripts in parallel
- **Caching**: Cache API responses where applicable

### Frontend Optimization

- **Code Splitting**: Lazy load components
- **Minification**: Enable production builds
- **Compression**: CloudFront automatic compression
- **Caching**: S3 versioned assets with long TTL

### Database Optimization

- **Index Tuning**: Optimize OpenSearch field mappings
- **Shard Allocation**: Configure appropriate shard count
- **Refresh Rate**: Adjust index refresh interval based on query patterns

---

## Contributing

### Development Setup

```bash
# Clone and install dependencies
git clone https://github.com/ragerumal/meeting_archieve_AI_Assistant.git
cd meeting_archieve_AI_Assistant

# Frontend development
cd frontend
npm install
npm run start  # Start dev server on port 3000

# Backend testing (requires SAM CLI)
sam local start-api
```

### Code Style

- **Frontend**: ESLint + Prettier for TypeScript/React
- **Backend**: Black for Python formatting
- **IaC**: YAML validation for CloudFormation

### Pull Request Process

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit with clear messages
3. Push to GitHub and create pull request
4. Ensure CI/CD checks pass
5. Request review from maintainers
6. Merge after approval

---

## Costs & Budget Estimation

### Estimated Monthly Costs (1000 meetings/month, 100 concurrent users)

| Service | Usage | Monthly Cost |
|---------|-------|--------------|
| Lambda | 10M invocations, 1TB GB-seconds | $200 |
| S3 | 500GB storage, 100GB/month transfer | $50 |
| OpenSearch Serverless | 4 OCU (On-Demand Capacity Units) | $400 |
| API Gateway | 10M requests | $35 |
| Cognito | 10K MAU (Monthly Active Users) | $25 |
| CloudFront | 100GB bandwidth | $85 |
| **Total** | | ~$795 |

### Cost Optimization Tips

- Use S3 Lifecycle policies to archive old transcripts
- Enable S3 Intelligent-Tiering
- Configure Lambda reserved concurrency
- Use CloudFront caching aggressively
- Optimize Bedrock token usage with better prompts

---

## Support & Resources

### Documentation

- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [AWS Lambda Developer Guide](https://docs.aws.amazon.com/lambda/)
- [Amazon Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [React Documentation](https://react.dev/)
- [AWS Amplify Documentation](https://docs.amplify.aws/)

### Getting Help

- **GitHub Issues**: Report bugs or request features
- **AWS Support**: Enterprise support for AWS services
- **Community**: Check existing issues and discussions

---

## License

This project is licensed under the MIT License. See LICENSE file for details.

---

## Acknowledgments

Built with modern AWS serverless technologies:
- **Amazon Bedrock** for Claude 3 Haiku AI model
- **AWS Lambda** for serverless compute
- **Amazon OpenSearch Serverless** for vector search
- **Amazon Cognito** for authentication
- **React** for frontend framework

---

## Authors & Contributors

### Core Team

**Raj Ragel**
- GitHub: [@ragerumal](https://github.com/ragerumal)
- LinkedIn: [Raj Ragel](https://www.linkedin.com/in/rajragel/)

For questions or contributions, please reach out through GitHub or LinkedIn.

---

**Last Updated:** August 2026  
**Status:** Production Ready  
**Version:** 1.0.0
