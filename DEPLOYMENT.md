# Backend Infrastructure Deployment Guide

This guide provides step-by-step instructions for deploying the Zoom RAG Insight Engine backend infrastructure on AWS.

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured locally
- AWS SAM CLI installed (`sam --version`)
- Node.js >= 14.x or Python 3.11
- Git installed
- Zoom API credentials (JWT or OAuth)

## Step 1: Configure AWS Credentials

Set up your AWS credentials locally:

```bash
aws configure
```

Enter your AWS Access Key ID, Secret Access Key, default region (us-east-1), and output format (json).

## Step 2: Prepare Zoom API Credentials

1. Go to [Zoom App Marketplace](https://marketplace.zoom.us)
2. Create a new Server-to-Server OAuth app
3. Copy your `Client ID` and `Client Secret`
4. Store these in AWS Secrets Manager:

```bash
aws secretsmanager create-secret \
  --name zoom/api-credentials \
  --description "Zoom API Client Credentials" \
  --secret-string '{"client_id":"YOUR_CLIENT_ID","client_secret":"YOUR_CLIENT_SECRET"}'
```

Get the ARN of the secret:

```bash
aws secretsmanager describe-secret --secret-id zoom/api-credentials
```

## Step 3: Create OpenSearch Serverless Collection

1. Go to AWS Console → OpenSearch Service → Serverless collections
2. Create a new collection:
   - Name: `zoom-rag-collection`
   - Type: Vector search
   - Encryption: AWS managed keys
3. Create an access policy allowing your Lambda execution role
4. Note the collection endpoint URL

## Step 4: Create Bedrock Knowledge Base

1. Go to AWS Console → Bedrock → Knowledge bases
2. Create a new knowledge base:
   - Name: `zoom-transcripts-kb`
   - Model: Anthropic Claude 3 Haiku
   - Vector database: Connect to OpenSearch Serverless
   - Data source: S3 (the transcript bucket)
3. Note the Knowledge Base ID

## Step 5: Build and Deploy the Stack

1. Clone the repository:
```bash
git clone https://github.com/ragerumal/meeting_archieve_AI_Assistant.git
cd meeting_archieve_AI_Assistant
```

2. Build the SAM application:
```bash
sam build
```

3. Deploy the stack:
```bash
sam deploy --guided
```

When prompted, enter:
- **Stack name**: `zoom-rag-stack` (or your preferred name)
- **AWS Region**: `us-east-1`
- **BedrockKBId**: Your Bedrock Knowledge Base ID
- **OpenSearchEndpoint**: Your OpenSearch collection endpoint
- **ZoomSecretsArn**: ARN from Step 2
- **Confirm changes before deploy**: `y`
- **Allow SAM CLI to create IAM roles**: `y`

## Step 6: Verify Deployment

Check that the stack was created successfully:

```bash
aws cloudformation describe-stacks --stack-name zoom-rag-stack
```

Get the API endpoint:

```bash
aws cloudformation describe-stacks \
  --stack-name zoom-rag-stack \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text
```

## Step 7: Deploy Frontend

1. Navigate to frontend directory:
```bash
cd frontend
npm install
```

2. Update `.env` with your deployment details:
```env
REACT_APP_API_GATEWAY_ENDPOINT=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod
REACT_APP_COGNITO_USER_POOL_ID=your_user_pool_id
REACT_APP_COGNITO_CLIENT_ID=your_client_id
REACT_APP_COGNITO_IDENTITY_POOL_ID=your_identity_pool_id
```

3. Build the frontend:
```bash
npm run build
```

4. Deploy to S3:
```bash
aws s3 sync ./build s3://zoom-rag-frontend-$(aws sts get-caller-identity --query Account --output text)/ --delete
```

## Step 8: Configure Cognito

1. Go to AWS Console → Cognito → User pools
2. Create a new user pool:
   - Pool name: `zoom-rag-users`
   - Authentication providers: Email
3. Create an app client:
   - Enable implicit OAuth flow
   - Set allowed callback URLs to your frontend URL
   - Set allowed sign-out URLs

## Step 9: Set Up CloudFront

1. Get the CloudFront URL from stack outputs:
```bash
aws cloudformation describe-stacks \
  --stack-name zoom-rag-stack \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontUrl`].OutputValue' \
  --output text
```

2. Update Cognito callback URLs with CloudFront domain
3. Access your application via CloudFront URL

## Testing the Deployment

### Test Lambda Functions

Test the data ingestion function:
```bash
aws lambda invoke \
  --function-name zoom-data-ingestion \
  --payload '{"meeting_id":"test123"}' \
  response.json
```

### Test API Gateway

Query the API:
```bash
curl -X POST https://your-api-endpoint/prod/query \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_query":"What were the key points?","conversation_id":"test"}'
```

## Environment Variables

Create a `.env` file in the root directory with:

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=your_account_id

# Zoom Configuration
ZOOM_CLIENT_ID=your_zoom_client_id
ZOOM_CLIENT_SECRET=your_zoom_client_secret

# OpenSearch Configuration
OPENSEARCH_ENDPOINT=your_opensearch_endpoint
OPENSEARCH_INDEX_NAME=zoom-transcripts

# Bedrock Configuration
BEDROCK_KB_ID=your_bedrock_kb_id
BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0

# S3 Configuration
TRANSCRIPT_BUCKET=zoom-transcripts-bucket-name
PROCESSED_TRANSCRIPTS_BUCKET=processed-transcripts-bucket-name

# Cognito Configuration
COGNITO_USER_POOL_ID=your_cognito_user_pool_id
COGNITO_CLIENT_ID=your_cognito_client_id
COGNITO_IDENTITY_POOL_ID=your_identity_pool_id

# API Configuration
API_GATEWAY_ENDPOINT=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod
API_STAGE=prod
```

## Monitoring and Debugging

### View Lambda Logs

```bash
sam logs -n zoom-data-ingestion --stack-name zoom-rag-stack -t
```

### Monitor API Gateway

Go to AWS Console → API Gateway → zoom-rag-api → Logs to view request/response logs

### Check CloudWatch Metrics

```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=zoom-query-handler \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Average
```

## Cleanup

To delete the stack and remove all resources:

```bash
aws cloudformation delete-stack --stack-name zoom-rag-stack
```

⚠️ **Warning**: This will delete all created resources. Ensure you have backups if needed.

## Troubleshooting

### Lambda Execution Role Permissions Error

Ensure the Lambda role has proper permissions for S3, Bedrock, and Secrets Manager.

### OpenSearch Connection Error

- Check security group settings
- Verify OpenSearch collection endpoint is correct
- Ensure Lambda role has `bedrock:*` permissions

### Cognito Authentication Error

- Verify user pool ID and client ID
- Check callback URL is correctly configured
- Ensure identity pool has appropriate role

### API Gateway 403 Forbidden

- Check IAM role permissions
- Verify API key is valid if using API keys
- Check CORS configuration

## Additional Resources

- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [Amazon Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [OpenSearch Serverless Documentation](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/serverless.html)
- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)

## Support

For issues and questions, please create an issue in the repository or refer to the main README.md.
