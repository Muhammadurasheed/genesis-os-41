/**
 * Backend Integration Service - Phase 1 Critical Infrastructure
 * Bridges Phase 1 Einstein engines with backend services
 */

import { backendAPIService } from './backendAPIService';
import { einsteinIntentEngine, EinsteinIntentAnalysis } from './ai/einsteinIntentEngine';
import { costPredictionEngine } from './ai/costPredictionEngine';
import { realMCPIntegrationService } from './ai/realMCPIntegrationService';

interface BackendIntegrationResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  source: 'backend' | 'frontend_fallback';
}

export class BackendIntegrationService {
  /**
   * Einstein Intent Analysis with Backend Integration
   */
  async analyzeIntentWithBackend(userInput: string): Promise<BackendIntegrationResponse<EinsteinIntentAnalysis>> {
    try {
      console.log('🧠 Attempting Einstein analysis via backend...');
      
      // Try backend first
      const backendResponse = await backendAPIService.analyzeIntent(userInput);
      
      if (backendResponse.success) {
        console.log('✅ Einstein analysis completed via backend');
        return {
          success: true,
          data: backendResponse.data,
          source: 'backend'
        };
      }
    } catch (error) {
      console.warn('⚠️ Backend Einstein analysis failed, using frontend fallback:', error);
    }
    
    // Fallback to frontend Einstein engine
    try {
      const analysis = await einsteinIntentEngine.analyzeUserIntent(userInput);
      console.log('✅ Einstein analysis completed via frontend fallback');
      
      return {
        success: true,
        data: analysis,
        source: 'frontend_fallback'
      };
    } catch (error) {
      console.error('❌ Both backend and frontend Einstein analysis failed:', error);
      return {
        success: false,
        error: 'Intent analysis failed',
        source: 'frontend_fallback'
      };
    }
  }

  /**
   * Cost Prediction with Backend Integration
   */
  async predictCostsWithBackend(blueprint: any): Promise<BackendIntegrationResponse> {
    try {
      console.log('💰 Attempting cost prediction via backend...');
      
      // Try backend first
      const backendResponse = await backendAPIService.predictCosts(blueprint);
      
      if (backendResponse.success) {
        console.log('✅ Cost prediction completed via backend');
        return {
          success: true,
          data: backendResponse.data,
          source: 'backend'
        };
      }
    } catch (error) {
      console.warn('⚠️ Backend cost prediction failed, using frontend fallback:', error);
    }
    
    // Fallback to frontend cost engine
    try {
      const prediction = await costPredictionEngine.generateCostPrediction(
        blueprint.id || 'temp-id',
        blueprint.analysis || {},
        {}
      );
      console.log('✅ Cost prediction completed via frontend fallback');
      
      return {
        success: true,
        data: prediction,
        source: 'frontend_fallback'
      };
    } catch (error) {
      console.error('❌ Both backend and frontend cost prediction failed:', error);
      return {
        success: false,
        error: 'Cost prediction failed',
        source: 'frontend_fallback'
      };
    }
  }

  /**
   * MCP Tool Discovery with Backend Integration
   */
  async discoverMCPToolsWithBackend(goals: string[]): Promise<BackendIntegrationResponse> {
    try {
      console.log('🔗 Attempting MCP tool discovery via backend...');
      
      // Try backend first
      const backendResponse = await backendAPIService.discoverMCPTools(goals);
      
      if (backendResponse.success) {
        console.log('✅ MCP tool discovery completed via backend');
        return {
          success: true,
          data: backendResponse.data,
          source: 'backend'
        };
      }
    } catch (error) {
      console.warn('⚠️ Backend MCP discovery failed, using frontend fallback:', error);
    }
    
    // Fallback to frontend MCP service
    try {
      const tools = await realMCPIntegrationService.discoverToolsForAgent(goals);
      console.log('✅ MCP tool discovery completed via frontend fallback');
      
      return {
        success: true,
        data: tools,
        source: 'frontend_fallback'
      };
    } catch (error) {
      console.error('❌ Both backend and frontend MCP discovery failed:', error);
      return {
        success: false,
        error: 'MCP tool discovery failed',
        source: 'frontend_fallback'
      };
    }
  }

  /**
   * Enhanced Blueprint Generation combining all Phase 1 engines
   */
  async generateEnhancedBlueprint(userInput: string): Promise<BackendIntegrationResponse> {
    try {
      console.log('🎯 Generating enhanced blueprint with Phase 1 engines...');
      
      // Step 1: Einstein Intent Analysis
      const intentResult = await this.analyzeIntentWithBackend(userInput);
      
      if (!intentResult.success || !intentResult.data) {
        throw new Error('Intent analysis failed');
      }
      
      const analysis = intentResult.data;
      
      // Step 2: Generate base blueprint from analysis
      const blueprint: any = {
        id: `enhanced-blueprint-${Date.now()}`,
        user_input: userInput,
        analysis: analysis,
        agents: analysis.suggested_agents,
        processes: analysis.identified_processes,
        integrations: analysis.required_integrations,
        created_at: new Date().toISOString()
      };
      
      // Step 3: Cost Prediction
      const costResult = await this.predictCostsWithBackend(blueprint);
      if (costResult.success && costResult.data) {
        blueprint.cost_prediction = costResult.data;
      }
      
      // Step 4: MCP Tool Discovery
      const mcpResult = await this.discoverMCPToolsWithBackend(analysis.extracted_goals);
      if (mcpResult.success && mcpResult.data) {
        blueprint.mcp_tools = mcpResult.data;
      }
      
      console.log('✅ Enhanced blueprint generated with Phase 1 intelligence');
      
      return {
        success: true,
        data: blueprint,
        source: intentResult.source
      };
      
    } catch (error) {
      console.error('❌ Enhanced blueprint generation failed:', error);
      return {
        success: false,
        error: 'Enhanced blueprint generation failed',
        source: 'frontend_fallback'
      };
    }
  }

  /**
   * Health check for Phase 1 backend integration
   */
  async checkPhase1Integration(): Promise<{
    einsteinBackend: boolean;
    costPredictionBackend: boolean;
    mcpBackend: boolean;
    overall: boolean;
  }> {
    const results = {
      einsteinBackend: false,
      costPredictionBackend: false,
      mcpBackend: false,
      overall: false
    };
    
    try {
      // Check Einstein backend endpoint
      const einsteinCheck = await backendAPIService.checkEinsteinService();
      results.einsteinBackend = einsteinCheck;
    } catch (error) {
      console.warn('Einstein backend service not available');
    }
    
    try {
      // Check Cost Prediction backend endpoint
      const costCheck = await backendAPIService.checkCostPredictionService();
      results.costPredictionBackend = costCheck;
    } catch (error) {
      console.warn('Cost Prediction backend service not available');
    }
    
    try {
      // Check MCP backend endpoint
      const mcpCheck = await backendAPIService.checkMCPService();
      results.mcpBackend = mcpCheck;
    } catch (error) {
      console.warn('MCP backend service not available');
    }
    
    results.overall = results.einsteinBackend && results.costPredictionBackend && results.mcpBackend;
    
    return results;
  }
}

// Singleton instance
export const backendIntegrationService = new BackendIntegrationService();