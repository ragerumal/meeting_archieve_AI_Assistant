import React, { useEffect, useState } from 'react';
import { Auth } from 'aws-amplify';
import awsConfig from './config/awsConfig';
import RAGQueryInterface from './components/RAGQueryInterface';
import './App.css';

interface User {
  username: string;
  email?: string;
  name?: string;
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await Auth.currentAuthenticatedUser();
      setUser({
        username: currentUser.username,
        email: currentUser.attributes?.email,
        name: currentUser.attributes?.name
      });
      setError(null);
    } catch (err) {
      console.log('User not authenticated, redirecting to login...');
      handleLogin();
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      await Auth.signIn({
        username: '',
        password: ''
      });
    } catch (err) {
      console.error('Login error:', err);
      // Cognito will handle redirect to login page
    }
  };

  const handleLogout = async () => {
    try {
      await Auth.signOut();
      setUser(null);
      window.location.href = '/';
    } catch (err) {
      console.error('Logout error:', err);
      setError('Failed to logout. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1>🎥 Zoom RAG Insight Engine</h1>
          <p>Query your meeting transcripts with AI</p>
          <button className="login-button" onClick={handleLogin}>
            Sign In with Cognito
          </button>
          {error && <p className="error-message">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <RAGQueryInterface />
      <div className="user-menu">
        <span className="user-info">👤 {user.name || user.email || user.username}</span>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default App;
