import React, { useState, useRef, useEffect } from 'react';
import apiService from '../services/apiService';
import './RAGQueryInterface.css';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: Array<{ document: string; location: string }>;
}

const RAGQueryInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generate conversation ID on mount
    setConversationId(`conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmitQuery = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputQuery.trim()) return;

    // Add user message to chat
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      type: 'user',
      content: inputQuery,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setLoading(true);

    try {
      // Call backend Lambda through API Gateway
      const response = await apiService.queryRAG(inputQuery, conversationId);

      // Add assistant response
      const assistantMessage: Message = {
        id: `msg_${Date.now()}_response`,
        type: 'assistant',
        content: response.answer,
        timestamp: response.timestamp,
        sources: response.sources
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error in query:', error);
      const errorMessage: Message = {
        id: `msg_${Date.now()}_error`,
        type: 'assistant',
        content: 'Sorry, there was an error processing your query. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rag-query-container">
      <div className="chat-header">
        <h2>🤖 Zoom Meeting RAG Assistant</h2>
        <p>Ask questions about your Zoom meeting transcripts</p>
      </div>

      <div className="messages-container">
        {messages.length === 0 && (
          <div className="welcome-message">
            <h3>Welcome to Zoom RAG Insight Engine</h3>
            <p>Ask me anything about your meeting transcripts!</p>
            <ul className="example-queries">
              <li>What were the key action items discussed?</li>
              <li>Who was responsible for the budget review?</li>
              <li>What decisions were made about the project timeline?</li>
              <li>Summarize the main discussion points</li>
            </ul>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`message message-${message.type}`}>
            <div className="message-content">
              <p>{message.content}</p>
              {message.sources && message.sources.length > 0 && (
                <div className="sources">
                  <h4>📚 Sources:</h4>
                  <ul>
                    {message.sources.map((source, idx) => (
                      <li key={idx}>
                        <strong>{source.document}</strong>
                        <br />
                        <small>{source.location}</small>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <span className="timestamp">
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}

        {loading && (
          <div className="message message-assistant loading">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmitQuery} className="query-form">
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask a question about your meetings..."
          disabled={loading}
          className="query-input"
        />
        <button type="submit" disabled={loading} className="submit-button">
          {loading ? '⏳ Processing...' : '📤 Send'}
        </button>
      </form>
    </div>
  );
};

export default RAGQueryInterface;
