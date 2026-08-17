import { Amplify } from 'aws-amplify';

const awsConfig = {
  Auth: {
    region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
    userPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID,
    userPoolWebClientId: process.env.REACT_APP_COGNITO_CLIENT_ID,
    identityPoolId: process.env.REACT_APP_COGNITO_IDENTITY_POOL_ID,
    redirectSignIn: process.env.REACT_APP_COGNITO_REDIRECT_URI || 'http://localhost:3000',
    redirectSignOut: process.env.REACT_APP_COGNITO_LOGOUT_URI || 'http://localhost:3000/logout',
    responseType: 'code'
  },
  API: {
    endpoints: [
      {
        name: 'ZoomRAGAPI',
        endpoint: process.env.REACT_APP_API_GATEWAY_ENDPOINT || 'http://localhost:3001',
        region: process.env.REACT_APP_AWS_REGION || 'us-east-1'
      }
    ]
  }
};

Amplify.configure(awsConfig);

export default awsConfig;
