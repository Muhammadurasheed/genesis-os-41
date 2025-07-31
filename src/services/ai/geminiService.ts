/**
 * Gemini Service - Robust API Integration
 * Handles all Gemini API interactions with proper error handling
 */

interface GeminiRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemInstruction?: string;
}

interface GeminiResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

class GeminiService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  private defaultModel = 'gemini-2.0-flash-exp'; // Optimal free tier model: 15 RPM, 1M TPM, 200 RPD
  private rateLimitDelay = 4000; // 4 seconds between requests for free tier (15 RPM = ~4s)
  private lastRequestTime = 0;

  constructor() {
    this.apiKey = this.initializeApiKey();
    console.log('🔗 Gemini Service initialized');
  }

  /**
   * Generate text with robust error handling
   */
  async generateText(request: GeminiRequest): Promise<GeminiResponse> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    // Rate limiting
    await this.enforceRateLimit();

    const model = request.model || this.defaultModel;
    const url = `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`;

    const payload = this.buildRequestPayload(request);

    try {
      console.log(`🤖 Calling Gemini ${model}...`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        await this.handleApiError(response);
      }

      const data = await response.json();
      return this.parseResponse(data);

    } catch (error: any) {
      console.error('Gemini API error:', error);
      throw this.enhanceError(error);
    }
  }

  /**
   * Generate embeddings
   */
  async generateEmbeddings(text: string): Promise<number[]> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    await this.enforceRateLimit();

    const url = `${this.baseUrl}/models/text-embedding-004:embedContent?key=${this.apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'models/text-embedding-004',
          content: {
            parts: [{ text }]
          }
        })
      });

      if (!response.ok) {
        await this.handleApiError(response);
      }

      const data = await response.json();
      return data.embedding?.values || [];

    } catch (error: any) {
      console.error('Gemini embeddings error:', error);
      throw this.enhanceError(error);
    }
  }

  /**
   * Check if service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.generateText({
        prompt: 'Hello',
        model: 'gemini-2.0-flash-exp', // Use optimal free tier model
        maxTokens: 10
      });
      return true;
    } catch (error: any) {
      console.warn('Gemini health check failed:', error?.message || error);
      return false;
    }
  }

  /**
   * Get available models
   */
  async getModels(): Promise<string[]> {
    if (!this.apiKey) {
      return [];
    }

    try {
      const url = `${this.baseUrl}/models?key=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.models?.map((model: any) => model.name) || [];
    } catch (error) {
      console.error('Failed to get models:', error);
      return [];
    }
  }

  // Private methods

  private initializeApiKey(): string {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'your_gemini_api_key') {
      console.warn('⚠️ Gemini API key not configured');
      return '';
    }

    // Basic validation
    if (!apiKey.startsWith('AIza')) {
      console.warn('⚠️ Invalid Gemini API key format');
      return '';
    }

    return apiKey;
  }

  private buildRequestPayload(request: GeminiRequest): any {
    const payload: any = {
      contents: [{
        parts: [{ text: request.prompt }]
      }],
      generationConfig: {
        temperature: request.temperature || 0.7,
        maxOutputTokens: request.maxTokens || 2048,
        topP: 0.8,
        topK: 40
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
      ]
    };

    if (request.systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: request.systemInstruction }]
      };
    }

    return payload;
  }

  private parseResponse(data: any): GeminiResponse {
    const candidate = data.candidates?.[0];
    
    if (!candidate) {
      throw new Error('No response generated');
    }

    if (candidate.finishReason === 'SAFETY') {
      throw new Error('Response blocked by safety filters');
    }

    const text = candidate.content?.parts?.[0]?.text || '';
    
    if (!text) {
      throw new Error('Empty response from Gemini');
    }

    return {
      text,
      usage: data.usageMetadata ? {
        promptTokens: data.usageMetadata.promptTokenCount || 0,
        completionTokens: data.usageMetadata.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata.totalTokenCount || 0
      } : undefined
    };
  }

  private async handleApiError(response: Response): Promise<never> {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || `HTTP ${response.status}`;

    if (response.status === 429) {
      throw new Error('Gemini API quota exceeded. Please check your billing and usage limits.');
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error('Gemini API authentication failed. Please check your API key.');
    }

    if (response.status === 400) {
      throw new Error(`Gemini API request invalid: ${errorMessage}`);
    }

    if (response.status >= 500) {
      throw new Error(`Gemini API server error: ${errorMessage}`);
    }

    throw new Error(`Gemini API error: ${errorMessage}`);
  }

  private enhanceError(error: any): Error {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return new Error('Network error connecting to Gemini API. Please check your internet connection.');
    }

    if (error.message.includes('quota')) {
      return new Error('Gemini API quota exceeded. Please upgrade your plan or wait for quota reset.');
    }

    return error;
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      const delay = this.rateLimitDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
  }
}

export const geminiService = new GeminiService();