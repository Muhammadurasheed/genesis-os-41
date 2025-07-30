
import axios, { AxiosInstance } from 'axios';

class BlueprintGenerationService {
  private apiClient: AxiosInstance;

  constructor(baseURL: string) {
    this.apiClient = axios.create({
      baseURL,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Generate a blueprint based on user input with Einstein-level understanding
   */
  public async generateBlueprint(userInput: string): Promise<any> {
    try {
      console.log(`🧠 Generating blueprint for: ${userInput.substring(0, 50)}...`);
      
      const response = await this.apiClient.post(
        `/generate-blueprint`,
        { user_input: userInput }
      );
      
      console.log(`✅ Blueprint generated successfully`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Error generating blueprint:`, error.message);
      throw new Error(`Failed to generate blueprint: ${error.message}`);
    }
  }

  /**
   * Synthesize speech from text for voice interactions
   */
  public async synthesizeSpeech(
    text: string,
    voice_id?: string
  ): Promise<string | null> {
    try {
      console.log(`🔊 Synthesizing speech: ${text.substring(0, 50)}...`);
      
      const response = await this.apiClient.post(
        `/synthesize-speech`,
        { text, voice_id }
      );
      
      if (response.data.success && response.data.audio) {
        console.log(`✅ Speech synthesized successfully`);
        return response.data.audio;
      } else {
        console.warn(`⚠️ Speech synthesis returned no audio data`);
        return null;
      }
    } catch (error: any) {
      console.error(`❌ Error synthesizing speech:`, error.message);
      return null;
    }
  }

  /**
   * Check if the agent service is healthy
   */
  public async checkHealth(): Promise<{ status: string; integrations: Record<string, string> }> {
    try {
      console.log(`🏥 Checking agent service health`);
      
      const response = await this.apiClient.get('/');
      
      console.log(`✅ Agent service is healthy`);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Error checking agent service health:`, error.message);
      throw new Error(`Agent service health check failed: ${error.message}`);
    }
  }
}

export default BlueprintGenerationService;
