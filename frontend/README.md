# Zoom RAG Frontend

React-based frontend for the Zoom RAG Insight Engine. This application provides a user-friendly interface for querying Zoom meeting transcripts using RAG (Retrieval-Augmented Generation).

## Features

- 🔐 **Cognito Authentication** - Secure user authentication via AWS Cognito
- 💬 **Real-time Chat Interface** - Interactive chat UI for querying meeting transcripts
- 📚 **Source Citations** - View source references for AI-generated answers
- ⚡ **Fast Responses** - Backend Lambda integration for sub-second responses
- 📱 **Responsive Design** - Mobile-friendly UI that works on all devices
- 🎨 **Modern UI** - Beautiful gradient design with smooth animations

## Prerequisites

- Node.js >= 14.x
- npm or yarn
- AWS credentials configured locally
- Cognito user pool and client setup

## Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the `frontend/` directory with your AWS configuration:
   ```env
   REACT_APP_API_GATEWAY_ENDPOINT=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod
   REACT_APP_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
   REACT_APP_COGNITO_CLIENT_ID=your_client_id_here
   REACT_APP_COGNITO_IDENTITY_POOL_ID=us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   REACT_APP_COGNITO_REDIRECT_URI=http://localhost:3000
   REACT_APP_AWS_REGION=us-east-1
   ```

## Development

Start the development server:

```bash
npm start
```

The application will open at `http://localhost:3000`.

### File Structure

```
frontend/
├── public/
│   └── index.html          # HTML template
├── src/
│   ├── components/
│   │   ├── RAGQueryInterface.tsx    # Main chat component
│   │   └── RAGQueryInterface.css    # Component styling
│   ├── config/
│   │   └── awsConfig.ts            # AWS Amplify configuration
│   ├── services/
│   │   └── apiService.ts           # API client for backend Lambda
│   ├── App.tsx                      # Main app component
│   ├── App.css                      # App styling
│   ├── index.tsx                    # React entry point
│   └── index.css                    # Global styles
├── .env                             # Environment variables
├── .gitignore                       # Git ignore rules
├── package.json                     # Dependencies
└── tsconfig.json                    # TypeScript config
```

## Building for Production

Build the optimized production bundle:

```bash
npm run build
```

The build output will be in the `build/` directory.

### Deploy to S3

Deploy to your S3 bucket:

```bash
aws s3 sync ./build s3://your-s3-bucket-name --delete
```

### CloudFront Distribution

Set up a CloudFront distribution pointing to your S3 bucket for optimized delivery:

1. Create a CloudFront distribution
2. Set the S3 bucket as the origin
3. Configure the distribution settings
4. Wait for deployment (5-15 minutes)
5. Access your application via the CloudFront domain

## API Integration

The frontend communicates with the backend Lambda function through API Gateway. Key endpoints:

### POST /query

Query the RAG system with a user question.

**Request:**
```json
{
  "user_query": "What were the action items from the meeting?",
  "conversation_id": "conv_xxx"
}
```

**Response:**
```json
{
  "answer": "The action items discussed were...",
  "sources": [
    {
      "document": "meeting_transcript",
      "location": "timestamp_location"
    }
  ],
  "confidence": 0.95
}
```

### GET /meetings

Fetch list of available meetings.

### GET /meetings/:meetingId

Get details for a specific meeting.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `REACT_APP_API_GATEWAY_ENDPOINT` | API Gateway URL for backend Lambda |
| `REACT_APP_COGNITO_USER_POOL_ID` | Cognito user pool ID |
| `REACT_APP_COGNITO_CLIENT_ID` | Cognito client application ID |
| `REACT_APP_COGNITO_IDENTITY_POOL_ID` | Cognito identity pool ID |
| `REACT_APP_COGNITO_REDIRECT_URI` | Redirect URI after Cognito login |
| `REACT_APP_AWS_REGION` | AWS region (default: us-east-1) |

## Troubleshooting

### Authentication Issues

- Ensure Cognito user pool and client are properly configured
- Check that the redirect URI matches your application URL
- Verify IAM permissions for the user

### API Connection Issues

- Confirm API Gateway endpoint is correct
- Check CORS configuration on API Gateway
- Verify Lambda function is deployed and accessible
- Check CloudWatch logs for Lambda errors

### Build Issues

- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear npm cache: `npm cache clean --force`
- Update npm: `npm install -g npm@latest`

## Technologies Used

- **React 18** - UI library
- **TypeScript** - Type safety
- **AWS Amplify** - AWS integration and authentication
- **Axios** - HTTP client
- **CSS3** - Styling and animations

## License

This project is part of the Zoom RAG Insight Engine hackathon project.

## Support

For issues and questions, please refer to the main README.md in the project root.
