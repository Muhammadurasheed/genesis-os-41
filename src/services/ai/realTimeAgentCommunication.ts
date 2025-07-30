/**
 * Real-Time Agent Communication Service - Phase 5: Advanced AI & Autonomous Learning
 * Enables agents to communicate, collaborate, and share knowledge in real-time
 */

import { createClient } from '@supabase/supabase-js';
import { autonomousLearningSystem } from './autonomousLearningSystem';

interface AgentMessage {
  id: string;
  sender_agent_id: string;
  recipient_agent_id?: string; // null for broadcast
  message_type: 'direct' | 'broadcast' | 'collaboration' | 'knowledge_share' | 'task_request';
  content: {
    text?: string;
    data?: Record<string, any>;
    task_id?: string;
    knowledge_category?: string;
  };
  priority: 'low' | 'medium' | 'high' | 'urgent';
  requires_response: boolean;
  conversation_id?: string;
  created_at: string;
  expires_at?: string;
}

interface AgentCollaboration {
  id: string;
  initiator_agent_id: string;
  participant_agent_ids: string[];
  collaboration_type: 'knowledge_synthesis' | 'task_division' | 'problem_solving' | 'learning_session';
  objective: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  shared_context: Record<string, any>;
  progress_metrics: {
    tasks_completed: number;
    knowledge_shared: number;
    decisions_made: number;
    conflicts_resolved: number;
  };
  created_at: string;
  updated_at: string;
}

interface KnowledgeExchange {
  id: string;
  sender_agent_id: string;
  receiver_agent_id: string;
  knowledge_type: 'experience' | 'pattern' | 'solution' | 'capability' | 'insight';
  knowledge_data: Record<string, any>;
  validation_score: number; // 0-1 based on peer review
  application_count: number;
  success_rate: number;
  shared_at: string;
}

export class RealTimeAgentCommunication {
  private supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL || '',
    import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  );
  
  private messageSubscriptions: Map<string, any> = new Map();
  // private collaborationRooms: Map<string, any> = new Map(); // For future use

  /**
   * Initialize real-time communication for an agent
   */
  public async initializeAgent(agentId: string): Promise<void> {
    console.log(`🔗 Initializing real-time communication for agent: ${agentId}`);

    // Subscribe to messages for this agent
    const messageChannel = this.supabase
      .channel(`agent_messages_${agentId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'agent_messages',
          filter: `recipient_agent_id=eq.${agentId}`
        },
        (payload) => this.handleIncomingMessage(agentId, payload.new as AgentMessage)
      )
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_messages',
          filter: `recipient_agent_id=is.null` // Broadcast messages
        },
        (payload) => this.handleBroadcastMessage(agentId, payload.new as AgentMessage)
      )
      .subscribe();

    this.messageSubscriptions.set(agentId, messageChannel);

    // Subscribe to collaboration invitations
    // Subscribe to collaboration updates (implemented in future iteration)
    // this.supabase.channel(`agent_collaborations_${agentId}`)...
  }

  /**
   * Send a message from one agent to another
   */
  public async sendMessage(message: Omit<AgentMessage, 'id' | 'created_at'>): Promise<string> {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const fullMessage: AgentMessage = {
      id: messageId,
      ...message,
      created_at: new Date().toISOString()
    };

    const { error } = await this.supabase
      .from('agent_messages')
      .insert([fullMessage]);

    if (error) {
      console.error('Failed to send message:', error);
      throw error;
    }

    // Record this as a communication experience for learning
    await autonomousLearningSystem.recordExperience({
      agent_id: message.sender_agent_id,
      execution_id: messageId,
      scenario_type: 'agent_communication',
      input_context: {
        message_type: message.message_type,
        recipient: message.recipient_agent_id,
        priority: message.priority
      },
      agent_response: JSON.stringify(message.content),
      outcome_quality: 0.8, // Initial quality score
      performance_metrics: {
        response_time: 100,
        accuracy: 0.9,
        creativity: 0.7,
        efficiency: 0.85
      },
      lessons_learned: ['Successful message delivery'],
      improvement_suggestions: []
    });

    console.log(`✅ Message sent: ${messageId}`);
    return messageId;
  }

  /**
   * Start a collaboration between agents
   */
  public async initiateCollaboration(collaboration: Omit<AgentCollaboration, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const collaborationId = `collab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const fullCollaboration: AgentCollaboration = {
      id: collaborationId,
      ...collaboration,
      progress_metrics: {
        tasks_completed: 0,
        knowledge_shared: 0,
        decisions_made: 0,
        conflicts_resolved: 0
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error } = await this.supabase
      .from('agent_collaborations')
      .insert([fullCollaboration]);

    if (error) {
      console.error('Failed to start collaboration:', error);
      throw error;
    }

    // Notify all participants
    for (const participantId of collaboration.participant_agent_ids) {
      await this.sendMessage({
        sender_agent_id: collaboration.initiator_agent_id,
        recipient_agent_id: participantId,
        message_type: 'collaboration',
        content: {
          text: `You've been invited to collaborate on: ${collaboration.objective}`,
          data: { collaboration_id: collaborationId, type: collaboration.collaboration_type }
        },
        priority: 'high',
        requires_response: true,
        conversation_id: collaborationId
      });
    }

    console.log(`🤝 Collaboration initiated: ${collaborationId}`);
    return collaborationId;
  }

  /**
   * Share knowledge between agents
   */
  public async shareKnowledge(exchange: Omit<KnowledgeExchange, 'id' | 'shared_at' | 'validation_score' | 'application_count' | 'success_rate'>): Promise<string> {
    const exchangeId = `know_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const fullExchange: KnowledgeExchange = {
      id: exchangeId,
      ...exchange,
      validation_score: 0.8, // Initial score, will be updated based on peer validation
      application_count: 0,
      success_rate: 0,
      shared_at: new Date().toISOString()
    };

    const { error } = await this.supabase
      .from('knowledge_exchanges')
      .insert([fullExchange]);

    if (error) {
      console.error('Failed to share knowledge:', error);
      throw error;
    }

    // Send notification to recipient
    await this.sendMessage({
      sender_agent_id: exchange.sender_agent_id,
      recipient_agent_id: exchange.receiver_agent_id,
      message_type: 'knowledge_share',
      content: {
        text: `New ${exchange.knowledge_type} knowledge available`,
        data: { exchange_id: exchangeId, knowledge_type: exchange.knowledge_type }
      },
      priority: 'medium',
      requires_response: false
    });

    console.log(`🧠 Knowledge shared: ${exchangeId}`);
    return exchangeId;
  }

  /**
   * Handle incoming messages
   */
  private async handleIncomingMessage(agentId: string, message: AgentMessage): Promise<void> {
    console.log(`📨 Agent ${agentId} received message:`, message);

    // Process different message types
    switch (message.message_type) {
      case 'direct':
        await this.processDirectMessage(agentId, message);
        break;
      case 'collaboration':
        await this.processCollaborationMessage(agentId, message);
        break;
      case 'knowledge_share':
        await this.processKnowledgeShare(agentId, message);
        break;
      case 'task_request':
        await this.processTaskRequest(agentId, message);
        break;
    }

    // Auto-respond if required
    if (message.requires_response) {
      await this.generateAutoResponse(agentId, message);
    }
  }

  private async handleBroadcastMessage(agentId: string, message: AgentMessage): Promise<void> {
    if (message.sender_agent_id !== agentId) { // Don't process own broadcasts
      console.log(`📢 Agent ${agentId} received broadcast:`, message);
      await this.processBroadcastMessage(agentId, message);
    }
  }


  private async processDirectMessage(agentId: string, _message: AgentMessage): Promise<void> {
    // Store message in agent's memory for context
    // Process and potentially act on the message content
    console.log(`Processing direct message for ${agentId}`);
  }

  private async processCollaborationMessage(agentId: string, _message: AgentMessage): Promise<void> {
    // Handle collaboration invitations and updates
    console.log(`Processing collaboration message for ${agentId}`);
  }

  private async processKnowledgeShare(agentId: string, _message: AgentMessage): Promise<void> {
    // Process shared knowledge and integrate into agent's knowledge base
    console.log(`Processing knowledge share for ${agentId}`);
  }

  private async processTaskRequest(agentId: string, _message: AgentMessage): Promise<void> {
    // Handle task requests from other agents
    console.log(`Processing task request for ${agentId}`);
  }

  private async processBroadcastMessage(agentId: string, _message: AgentMessage): Promise<void> {
    // Handle broadcast messages (announcements, updates, etc.)
    console.log(`Processing broadcast message for ${agentId}`);
  }

  private async generateAutoResponse(agentId: string, originalMessage: AgentMessage): Promise<void> {
    // Generate intelligent auto-response based on message content
    const response = `Acknowledged: ${originalMessage.content.text}`;
    
    await this.sendMessage({
      sender_agent_id: agentId,
      recipient_agent_id: originalMessage.sender_agent_id,
      message_type: 'direct',
      content: { text: response },
      priority: 'medium',
      requires_response: false,
      conversation_id: originalMessage.conversation_id
    });
  }

  /**
   * Get conversation history between agents
   */
  public async getConversationHistory(agentId1: string, agentId2: string, limit = 50) {
    const { data, error } = await this.supabase
      .from('agent_messages')
      .select('*')
      .or(`and(sender_agent_id.eq.${agentId1},recipient_agent_id.eq.${agentId2}),and(sender_agent_id.eq.${agentId2},recipient_agent_id.eq.${agentId1})`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data?.reverse() || [];
  }

  /**
   * Get active collaborations for an agent
   */
  public async getActiveCollaborations(agentId: string) {
    const { data, error } = await this.supabase
      .from('agent_collaborations')
      .select('*')
      .contains('participant_agent_ids', [agentId])
      .eq('status', 'active');

    if (error) throw error;
    return data || [];
  }

  /**
   * Get communication analytics
   */
  public async getCommunicationAnalytics(agentId: string) {
    const { data: messages, error } = await this.supabase
      .from('agent_messages')
      .select('*')
      .or(`sender_agent_id.eq.${agentId},recipient_agent_id.eq.${agentId}`);

    if (error) throw error;

    const sent = messages?.filter(m => m.sender_agent_id === agentId).length || 0;
    const received = messages?.filter(m => m.recipient_agent_id === agentId).length || 0;
    
    return {
      messages_sent: sent,
      messages_received: received,
      total_interactions: sent + received,
      message_types: this.analyzeMessageTypes(messages || []),
      communication_partners: this.analyzeCommunicationPartners(messages || [], agentId)
    };
  }

  private analyzeMessageTypes(messages: AgentMessage[]) {
    const types = { direct: 0, broadcast: 0, collaboration: 0, knowledge_share: 0, task_request: 0 };
    messages.forEach(msg => types[msg.message_type]++);
    return types;
  }

  private analyzeCommunicationPartners(messages: AgentMessage[], agentId: string) {
    const partners = new Set();
    messages.forEach(msg => {
      if (msg.sender_agent_id === agentId && msg.recipient_agent_id) {
        partners.add(msg.recipient_agent_id);
      } else if (msg.recipient_agent_id === agentId) {
        partners.add(msg.sender_agent_id);
      }
    });
    return Array.from(partners);
  }

  /**
   * Cleanup agent communication
   */
  public async cleanup(agentId: string): Promise<void> {
    // Unsubscribe from channels
    const messageChannel = this.messageSubscriptions.get(agentId);
    if (messageChannel) {
      await messageChannel.unsubscribe();
      this.messageSubscriptions.delete(agentId);
    }

    console.log(`🧹 Cleaned up communication for agent: ${agentId}`);
  }
}

export const realTimeAgentCommunication = new RealTimeAgentCommunication();