import axios, { AxiosInstance } from 'axios';
import { Auth } from 'aws-amplify';

interface RAGResponse {
  success: boolean;
  query: string;
  answer: string;
  sources: Array<{ document: string; location: string }>;
  confidence: number;
  timestamp: string;
}

interface Meeting {
  meeting_id: string;
  title: string;
  date: string;
  duration: number;
  participants: string[];
  transcript_url: string;
}

function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

class APIService {
  private apiClient: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.REACT_APP_API_GATEWAY_ENDPOINT || '';
    this.apiClient = axios.create({
      baseURL: this.baseURL,
      timeout: 30000
    });

    // Add interceptor to include auth token
    this.apiClient.interceptors.request.use(async (config) => {
      try {
        const session = await Auth.currentSession();
        const token = session.getIdToken().getJwtToken();
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.error('Error getting auth token:', error);
      }
      return config;
    });
  }

  /**
   * Query the RAG system with a user question
   * Calls the Backend Lambda through API Gateway
   */
  async queryRAG(userQuery: string, conversationId?: string): Promise<RAGResponse> {
    try {
      const response = await this.apiClient.post('/query', {
        user_query: userQuery,
        conversation_id: conversationId || generateConversationId()
      });

      return {
        success: true,
        query: userQuery,
        answer: response.data.answer,
        sources: response.data.sources || [],
        confidence: response.data.confidence || 0,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      console.error('Error querying RAG:', error);
      return {
        success: false,
        query: userQuery,
        answer: `Error: ${error.response?.data?.error || error.message}`,
        sources: [],
        confidence: 0,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Fetch meeting transcripts metadata
   */
  async getMeetings(): Promise<Meeting[]> {
    try {
      const response = await this.apiClient.get('/meetings');
      return response.data.meetings || [];
    } catch (error) {
      console.error('Error fetching meetings:', error);
      return [];
    }
  }

  /**
   * Get specific meeting details and transcript
   */
  async getMeetingDetails(meetingId: string): Promise<Meeting | null> {
    try {
      const response = await this.apiClient.get(`/meetings/${meetingId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching meeting ${meetingId}:`, error);
      return null;
    }
  }

  /**
   * Health check for API availability
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.apiClient.get('/health');
      return response.status === 200;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

export default new APIService();
