import { Blueprint, BusinessIntent } from '../types';
import { apiMethods } from '../lib/api';
import { supabase } from '../lib/supabase';

// Master Blueprint: Intent Analysis System with Clarification Engine
interface IntentAnalysisResult {
  extracted_goals: string[];
  identified_processes: Array<{
    name: string;
    description: string;
    inputs: string[];
    outputs: string[];
    frequency: string;
    complexity: 'simple' | 'moderate' | 'complex';
  }>;
  suggested_agents: Array<{
    name: string;
    role: string;
    description: string;
    tools_needed: string[];
  }>;
  clarification_questions: string[];
  complexity_score: number;
  estimated_cost: number;
  confidence_score: number;
}

/**
 * Enhanced Blueprint Service implementing Master Blueprint Phase 1.2
 * Intent Capture & Natural Language Processing
 */
export const blueprintService = {
  /**
   * Master Blueprint: Intent Understanding System with Einstein-Level Analysis
   * Conversation Flow: User Input → Einstein Engine → Clarification Engine → Revolutionary Canvas
   */
  generateBlueprint: async (userInput: string): Promise<Blueprint> => {
    try {
      console.log('🧠 Master Blueprint: Generating blueprint with Einstein-level analysis...');
      
      // Use Backend Integration Service for Phase 1 engines
      const { backendIntegrationService } = await import('./backendIntegrationService');
      const enhancedResult = await backendIntegrationService.generateEnhancedBlueprint(userInput);
      
      if (enhancedResult.success && enhancedResult.data) {
        return enhancedResult.data;
      }
      
      // Fallback to direct Einstein engine
      const { einsteinIntentEngine } = await import('./ai/einsteinIntentEngine');
      const analysis = await einsteinIntentEngine.analyzeUserIntent(userInput);
      
      // Convert Einstein analysis to Blueprint format
      const blueprint: Blueprint = {
        id: `blueprint-${Date.now()}`,
        user_input: userInput,
        interpretation: analysis.user_intent_summary,
        suggested_structure: {
          guild_name: analysis.identified_processes[0]?.name || 'AI-Powered Guild',
          guild_purpose: analysis.extracted_goals.join(', '),
          agents: analysis.suggested_agents.map(agent => ({
            name: agent.name,
            role: agent.primary_role,
            description: agent.specialization,
            tools_needed: agent.required_tools
          })),
          workflows: analysis.identified_processes.map(process => ({
            name: process.name,
            description: process.description,
            trigger_type: process.frequency === 'real-time' ? 'webhook' : 'schedule'
          }))
        },
        status: 'draft',
        created_at: new Date().toISOString(),
        refinement_count: 0,
        // analysis // Store Einstein analysis for later use - disabled for type compatibility
      };
      
      console.log(`✅ Einstein blueprint generated with ${analysis.confidence_score * 100}% confidence`);
      return blueprint;
    } catch (error) {
      console.error('Einstein blueprint generation failed, using fallback:', error);
      return await apiMethods.generateBlueprint(userInput.trim());
    }
  },

  /**
   * Master Blueprint: Einstein-Level Intent Analysis with Multi-Model Reasoning
   */
  analyzeIntent: async (userInput: string): Promise<IntentAnalysisResult> => {
    try {
      console.log('🧠 Master Blueprint: Analyzing intent with Einstein-level intelligence...');
      
      // Use Einstein Intent Engine for deep analysis
      const { einsteinIntentEngine } = await import('./ai/einsteinIntentEngine');
      const einsteinAnalysis = await einsteinIntentEngine.analyzeUserIntent(userInput);
      
      // Convert to legacy format for compatibility
      return {
        extracted_goals: einsteinAnalysis.extracted_goals,
        identified_processes: einsteinAnalysis.identified_processes.map(process => ({
          name: process.name,
          description: process.description,
          inputs: process.data_sources,
          outputs: process.outputs,
          frequency: process.frequency,
          complexity: process.complexity_score > 6 ? 'complex' : process.complexity_score > 3 ? 'moderate' : 'simple'
        })),
        suggested_agents: einsteinAnalysis.suggested_agents.map(agent => ({
          name: agent.name,
          role: agent.primary_role,
          description: agent.specialization,
          tools_needed: agent.required_tools
        })),
        clarification_questions: einsteinAnalysis.clarification_questions.map(q => q.question),
        complexity_score: einsteinAnalysis.complexity_assessment.overall_score,
        estimated_cost: einsteinAnalysis.cost_prediction.estimated_monthly_cost,
        confidence_score: einsteinAnalysis.confidence_score
      };
    } catch (error) {
      console.error('Einstein intent analysis failed, using fallback:', error);
      return blueprintService.createFallbackIntentAnalysis(userInput);
    }
  },

  /**
   * Master Blueprint: Einstein-Powered Clarification System
   */
  askClarificationQuestions: async (intent: IntentAnalysisResult, userResponses: Record<string, string>): Promise<string[]> => {
    try {
      console.log('🤔 Master Blueprint: Generating Einstein-level clarification questions...');
      
      // Use Einstein Engine for intelligent questions
      const { einsteinIntentEngine } = await import('./ai/einsteinIntentEngine');
      
      // Convert legacy intent to Einstein analysis format for processing
      const mockAnalysis = {
        extracted_goals: intent.extracted_goals,
        clarification_questions: intent.clarification_questions.map(q => ({
          question: q,
          purpose: 'Clarify requirements',
          impact_if_unclear: 'medium' as const
        })),
        confidence_score: intent.confidence_score || 0.7
      } as any;
      
      const questions = await einsteinIntentEngine.generateClarificationQuestions(mockAnalysis, userResponses);
      return questions.map(q => q.question);
    } catch (error) {
      console.error('Einstein clarification generation failed, using fallback:', error);
      
      const remainingQuestions = intent.clarification_questions.filter(
        question => !Object.keys(userResponses).some(response => question.toLowerCase().includes(response.toLowerCase()))
      );

      if (Object.keys(userResponses).length > 0) {
        const followUpQuestions = blueprintService.generateIntelligentFollowUps(intent, userResponses);
        return followUpQuestions.slice(0, 2);
      }

      return remainingQuestions.slice(0, 3);
    }
  },

  /**
   * Master Blueprint: Refined Blueprint Generation
   */
  refineBlueprint: async (originalIntent: IntentAnalysisResult, userResponses: Record<string, string>): Promise<Blueprint> => {
    try {
      console.log('🔄 Master Blueprint: Refining blueprint with Gemini and user clarifications...');
      
      // Use Gemini to generate refined blueprint based on conversation
      const refinedBlueprint = await apiMethods.refineBlueprint(originalIntent, userResponses);
      return refinedBlueprint;
    } catch (error) {
      console.error('Blueprint refinement failed, using enhanced fallback:', error);
      // Generate enhanced blueprint with available data
      return blueprintService.createEnhancedBlueprint(originalIntent, userResponses);
    }
  },

  /**
   * Master Blueprint: Store Business Intent with Supabase
   */
  storeBusinessIntent: async (intent: BusinessIntent): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('business_intents')
        .insert({
          user_id: intent.user_id,
          raw_description: intent.raw_description,
          extracted_goals: intent.extracted_goals,
          identified_processes: intent.identified_processes,
          suggested_agents: intent.suggested_agents,
          complexity_score: intent.complexity_score,
          estimated_cost: intent.estimated_cost,
          status: intent.status || 'draft'
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Failed to store business intent:', error);
      return `local-${Date.now()}`; // Fallback ID
    }
  },

  /**
   * Master Blueprint: Update Blueprint Status
   */
  updateBlueprintStatus: async (blueprintId: string, status: 'draft' | 'refined' | 'approved'): Promise<void> => {
    try {
      const { error } = await supabase
        .from('blueprints')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', blueprintId);

      if (error) throw error;
      console.log(`✅ Blueprint ${blueprintId} status updated to ${status}`);
    } catch (error) {
      console.error('Failed to update blueprint status:', error);
    }
  },

  /**
   * Master Blueprint: Fallback Intent Analysis
   */
  createFallbackIntentAnalysis: (userInput: string): IntentAnalysisResult => {
    const keywords = userInput.toLowerCase();
    
    // Analyze business domain
    let businessDomain = 'general';
    if (keywords.includes('finance') || keywords.includes('bank') || keywords.includes('islamic')) {
      businessDomain = 'islamic_finance';
    } else if (keywords.includes('ecommerce') || keywords.includes('shop') || keywords.includes('retail')) {
      businessDomain = 'ecommerce';
    } else if (keywords.includes('marketing') || keywords.includes('content') || keywords.includes('social')) {
      businessDomain = 'marketing';
    } else if (keywords.includes('customer') || keywords.includes('support') || keywords.includes('service')) {
      businessDomain = 'customer_service';
    }

    // Generate domain-specific processes and agents
    const processes = blueprintService.generateProcesses(businessDomain);
    const agents = blueprintService.generateAgents(businessDomain);
    const questions = blueprintService.generateClarificationQuestions(businessDomain);

    return {
      extracted_goals: blueprintService.extractGoals(userInput),
      identified_processes: processes,
      suggested_agents: agents,
      clarification_questions: questions,
      complexity_score: Math.min(processes.length * 0.3 + agents.length * 0.2, 10),
      estimated_cost: agents.length * 50 + processes.length * 25,
      confidence_score: 0.75 // Medium confidence for fallback
    };
  },

  /**
   * Master Blueprint: Enhanced Blueprint Generation
   */
  createEnhancedBlueprint: (intent: IntentAnalysisResult, userResponses: Record<string, string>): Blueprint => {
    const guildName = blueprintService.generateGuildName(intent, userResponses);
    
    return {
      id: `blueprint-${Date.now()}`,
      user_input: Object.values(userResponses).join(' ') || 'Enhanced blueprint based on clarifications',
      interpretation: blueprintService.generateEnhancedInterpretation(intent, userResponses),
      suggested_structure: {
        guild_name: guildName,
        guild_purpose: blueprintService.generateGuildPurpose(intent, userResponses),
        agents: intent.suggested_agents,
        workflows: intent.identified_processes.map(process => ({
          name: process.name,
          description: process.description,
          trigger_type: process.frequency === 'real-time' ? 'webhook' : 'schedule'
        }))
      },
      status: 'refined',
      created_at: new Date().toISOString(),
      refinement_count: 1
    };
  },

  /**
   * Helper Methods for Enhanced Blueprint Generation
   */
  extractGoals: (userInput: string): string[] => {
    const keywords = userInput.toLowerCase();
    const goals = [];
    
    if (keywords.includes('automate')) goals.push('Automate repetitive processes');
    if (keywords.includes('customer') || keywords.includes('client')) goals.push('Improve customer experience');
    if (keywords.includes('revenue') || keywords.includes('sales')) goals.push('Increase revenue generation');
    if (keywords.includes('efficiency')) goals.push('Enhance operational efficiency');
    if (keywords.includes('scale') || keywords.includes('grow')) goals.push('Scale business operations');
    
    return goals.length > 0 ? goals : ['Optimize business processes', 'Improve productivity'];
  },

  generateProcesses: (domain: string): IntentAnalysisResult['identified_processes'] => {
    const baseProcesses = {
      islamic_finance: [
        { name: 'Sharia Compliance Check', description: 'Verify transactions comply with Islamic principles', inputs: ['transaction_data'], outputs: ['compliance_report'], frequency: 'real-time' as const, complexity: 'moderate' as const },
        { name: 'Client Onboarding', description: 'Process new Islamic finance clients', inputs: ['client_information'], outputs: ['account_setup'], frequency: 'daily' as const, complexity: 'simple' as const }
      ],
      ecommerce: [
        { name: 'Order Processing', description: 'Handle customer orders and fulfillment', inputs: ['order_data'], outputs: ['shipping_info'], frequency: 'real-time' as const, complexity: 'simple' as const },
        { name: 'Inventory Management', description: 'Track and update product inventory', inputs: ['stock_data'], outputs: ['inventory_report'], frequency: 'hourly' as const, complexity: 'moderate' as const }
      ],
      marketing: [
        { name: 'Content Generation', description: 'Create marketing content and campaigns', inputs: ['brand_guidelines'], outputs: ['marketing_content'], frequency: 'daily' as const, complexity: 'moderate' as const },
        { name: 'Performance Analysis', description: 'Analyze marketing campaign performance', inputs: ['campaign_data'], outputs: ['performance_report'], frequency: 'weekly' as const, complexity: 'complex' as const }
      ],
      general: [
        { name: 'Data Processing', description: 'Process and analyze business data', inputs: ['raw_data'], outputs: ['processed_insights'], frequency: 'daily' as const, complexity: 'moderate' as const },
        { name: 'Customer Communication', description: 'Handle customer inquiries and communications', inputs: ['customer_messages'], outputs: ['responses'], frequency: 'real-time' as const, complexity: 'simple' as const }
      ]
    };

    return baseProcesses[domain as keyof typeof baseProcesses] || baseProcesses.general;
  },

  generateAgents: (domain: string): IntentAnalysisResult['suggested_agents'] => {
    const baseAgents = {
      islamic_finance: [
        { name: 'Sharia Compliance Officer', role: 'Compliance Specialist', description: 'Ensures all operations comply with Islamic principles', tools_needed: ['Islamic Database', 'Compliance API', 'Document Scanner'] },
        { name: 'Client Relations Manager', role: 'Customer Success', description: 'Manages client relationships and satisfaction', tools_needed: ['CRM System', 'Email API', 'Calendar Integration'] }
      ],
      ecommerce: [
        { name: 'Sales Assistant', role: 'Sales Specialist', description: 'Handles customer inquiries and sales processes', tools_needed: ['Shopping Cart API', 'Payment Gateway', 'Inventory System'] },
        { name: 'Fulfillment Coordinator', role: 'Operations Manager', description: 'Manages order fulfillment and shipping', tools_needed: ['Shipping API', 'Warehouse System', 'Tracking Integration'] }
      ],
      marketing: [
        { name: 'Content Creator', role: 'Creative Specialist', description: 'Generates engaging marketing content', tools_needed: ['Content Management', 'Design Tools', 'Social Media API'] },
        { name: 'Analytics Specialist', role: 'Data Analyst', description: 'Analyzes marketing performance and ROI', tools_needed: ['Analytics API', 'Reporting Tools', 'Dashboard Integration'] }
      ],
      general: [
        { name: 'Business Analyst', role: 'Data Specialist', description: 'Analyzes business data and provides insights', tools_needed: ['Database API', 'Analytics Tools', 'Reporting System'] },
        { name: 'Operations Manager', role: 'Process Coordinator', description: 'Coordinates business operations and workflows', tools_needed: ['Workflow System', 'Communication API', 'Task Management'] }
      ]
    };

    return baseAgents[domain as keyof typeof baseAgents] || baseAgents.general;
  },

  generateClarificationQuestions: (domain: string): string[] => {
    const baseQuestions = {
      islamic_finance: [
        'What specific Islamic finance products do you offer (Murabaha, Ijara, Sukuk)?',
        'Do you need multilingual support (Arabic/English)?',
        'What regulatory frameworks do you need to comply with?',
        'How many clients do you typically serve per day?'
      ],
      ecommerce: [
        'What type of products do you sell?',
        'What is your average order volume per day?',
        'Which payment methods do you want to support?',
        'Do you need international shipping capabilities?'
      ],
      marketing: [
        'What channels do you want to focus on (social media, email, content)?',
        'Who is your target audience?',
        'What is your monthly marketing budget?',
        'Do you need multilingual content creation?'
      ],
      general: [
        'What is the size of your business (team members, customers)?',
        'What are your main pain points in daily operations?',
        'What tools and systems do you currently use?',
        'What is your budget range for this solution?'
      ]
    };

    return baseQuestions[domain as keyof typeof baseQuestions] || baseQuestions.general;
  },

  generateIntelligentFollowUps: (_intent: IntentAnalysisResult, responses: Record<string, string>): string[] => {
    const followUps = [];
    
    // Generate contextual follow-ups based on responses
    if (responses.budget && parseInt(responses.budget.replace(/\D/g, '')) > 1000) {
      followUps.push('Would you like to include premium AI features for enhanced performance?');
    }
    
    if (responses.team_size && parseInt(responses.team_size) > 10) {
      followUps.push('Do you need multi-tenant workspace management for different teams?');
    }
    
    if (responses.industry && responses.industry.toLowerCase().includes('finance')) {
      followUps.push('What compliance standards do you need to maintain (SOX, PCI DSS, etc.)?');
    }
    
    followUps.push('Are there any specific integrations with existing tools you require?');
    
    return followUps.slice(0, 3);
  },

  generateGuildName: (intent: IntentAnalysisResult, responses: Record<string, string>): string => {
    const industry = responses.industry || '';
    const focus = responses.focus || intent.extracted_goals[0] || '';
    
    if (industry.toLowerCase().includes('finance') || focus.toLowerCase().includes('finance')) {
      return 'Islamic Finance Operations Guild';
    } else if (industry.toLowerCase().includes('ecommerce') || focus.toLowerCase().includes('sales')) {
      return 'E-Commerce Growth Guild';
    } else if (industry.toLowerCase().includes('marketing') || focus.toLowerCase().includes('content')) {
      return 'Marketing Intelligence Guild';
    }
    
    return 'Business Automation Guild';
  },

  generateGuildPurpose: (intent: IntentAnalysisResult, responses: Record<string, string>): string => {
    const goals = intent.extracted_goals.join(', ');
    const industry = responses.industry || 'business';
    
    return `A sophisticated AI guild designed to ${goals.toLowerCase()} for ${industry} operations through intelligent automation and data-driven insights.`;
  },

  generateEnhancedInterpretation: (intent: IntentAnalysisResult, responses: Record<string, string>): string => {
    const responseText = Object.entries(responses)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    
    return `Based on your clarifications (${responseText}), I understand you need a comprehensive AI system with ${intent.suggested_agents.length} specialized agents to ${intent.extracted_goals.join(' and ')}. The system will handle ${intent.identified_processes.length} key processes with an estimated complexity score of ${intent.complexity_score}/10.`;
  },
  
  /**
   * Create a sample blueprint for testing
   */
  createSampleBlueprint: (userInput: string): Blueprint => {
    const guildName = getGuildNameFromInput(userInput);
    
    return {
      id: `blueprint-${Date.now()}`,
      user_input: userInput,
      interpretation: `I understand that you want to: ${userInput}. I'll create a comprehensive AI-powered system to accomplish this goal.`,
      suggested_structure: {
        guild_name: guildName,
        guild_purpose: `A powerful AI guild designed to ${userInput}`,
        agents: [
          {
            name: "Data Analyst",
            role: "Analytics Specialist",
            description: "Analyzes data and provides actionable insights",
            tools_needed: ["Google Analytics API", "Database", "Reporting Tools"]
          },
          {
            name: "Content Creator",
            role: "Creative Writer",
            description: "Generates high-quality content based on analytics",
            tools_needed: ["Google Docs", "Grammarly", "Content Management"]
          },
          {
            name: "Outreach Manager",
            role: "Communications Specialist",
            description: "Handles external communications and promotions",
            tools_needed: ["Email API", "Social Media API", "CRM System"]
          }
        ],
        workflows: [
          {
            name: "Weekly Performance Review",
            description: "Analyzes weekly performance metrics and generates reports",
            trigger_type: "schedule"
          },
          {
            name: "Content Production Pipeline",
            description: "Creates and publishes content based on performance data",
            trigger_type: "manual"
          },
          {
            name: "Customer Response System",
            description: "Responds to customer inquiries and feedback",
            trigger_type: "webhook"
          }
        ]
      },
      status: 'pending',
      created_at: new Date().toISOString()
    };
  }
};

/**
 * Generate a guild name from user input
 */
function getGuildNameFromInput(userInput: string): string {
  const keywords = userInput.toLowerCase();
  
  if (keywords.includes('customer') || keywords.includes('support')) {
    return "Customer Success Guild";
  } else if (keywords.includes('sales') || keywords.includes('revenue')) {
    return "Revenue Growth Guild";
  } else if (keywords.includes('marketing') || keywords.includes('content')) {
    return "Marketing Intelligence Guild";
  } else if (keywords.includes('analytics') || keywords.includes('data')) {
    return "Data Intelligence Guild";
  } else if (keywords.includes('finance') || keywords.includes('payment')) {
    return "Financial Operations Guild";
  } else {
    return "Business Automation Guild";
  }
}