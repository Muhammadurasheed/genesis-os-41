import { supabase } from '../lib/supabase';

interface CollaborationEvent {
  type: 'cursor' | 'selection' | 'canvas_update' | 'voice_command' | 'user_join' | 'user_leave';
  userId: string;
  userName: string;
  data: any;
  timestamp: string;
  canvasId: string;
}

interface CanvasState {
  nodes: any[];
  edges: any[];
  version: number;
  lastModified: string;
  activeUsers: string[];
}

interface CollaborationUser {
  id: string;
  name: string;
  color: string;
  cursorPosition: { x: number; y: number };
  lastSeen: string;
  status: 'active' | 'inactive' | 'away';
}

class RealTimeCollaborationService {
  private supabaseClient = supabase;
  private currentCanvasId: string | null = null;
  private currentUserId: string | null = null;
  private eventListeners: Map<string, Function[]> = new Map();
  private presenceUpdateInterval: NodeJS.Timeout | null = null;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    console.log('🔄 Real-time Collaboration Service initialized');
    this.setupAuthListener();
  }

  private setupAuthListener() {
    this.supabaseClient.auth.onAuthStateChange((_event: any, session: any) => {
      if (session?.user) {
        this.currentUserId = session.user.id;
      } else {
        this.currentUserId = null;
        this.disconnect();
      }
    });
  }

  /**
   * Join a canvas for collaboration
   */
  async joinCanvas(canvasId: string): Promise<{ success: boolean; canvasState?: any; error?: string }> {
    try {
      if (!this.currentUserId) {
        throw new Error('User not authenticated');
      }

      console.log(`🎨 Joining canvas: ${canvasId}`);
      
      const { data, error } = await this.supabaseClient.functions.invoke('realtime-collaboration', {
        body: {
          action: 'join_canvas',
          canvasId
        }
      });

      if (error) {
        throw error;
      }

      this.currentCanvasId = canvasId;
      this.startPresenceUpdates();
      this.startEventPolling();

      return { success: true, canvasState: data?.canvasState };
    } catch (error: any) {
      console.error('❌ Failed to join canvas:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Leave the current canvas
   */
  async leaveCanvas(): Promise<void> {
    if (!this.currentCanvasId || !this.currentUserId) return;

    try {
      await this.supabaseClient.functions.invoke('realtime-collaboration', {
        body: {
          action: 'leave_canvas',
          canvasId: this.currentCanvasId
        }
      });

      this.disconnect();
    } catch (error) {
      console.error('❌ Failed to leave canvas:', error);
    }
  }

  /**
   * Broadcast a collaboration event
   */
  async broadcastEvent(event: Omit<CollaborationEvent, 'userId' | 'userName' | 'timestamp' | 'canvasId'>): Promise<void> {
    if (!this.currentCanvasId || !this.currentUserId) return;

    try {
      await this.supabaseClient.functions.invoke('realtime-collaboration', {
        body: {
          action: 'broadcast_event',
          canvasId: this.currentCanvasId,
          event: {
            ...event,
            canvasId: this.currentCanvasId
          }
        }
      });
    } catch (error) {
      console.error('❌ Failed to broadcast event:', error);
    }
  }

  /**
   * Sync canvas state
   */
  async syncCanvas(canvasState: CanvasState): Promise<{ success: boolean; version?: number; error?: string }> {
    if (!this.currentCanvasId || !this.currentUserId) {
      return { success: false, error: 'Not connected to canvas' };
    }

    try {
      const { data, error } = await this.supabaseClient.functions.invoke('realtime-collaboration', {
        body: {
          action: 'sync_canvas',
          canvasId: this.currentCanvasId,
          canvasState
        }
      });

      if (error) {
        throw error;
      }

      return { success: true, version: data?.version };
    } catch (error: any) {
      console.error('❌ Failed to sync canvas:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current canvas state
   */
  async getCanvasState(): Promise<{ success: boolean; canvasState?: any; error?: string }> {
    if (!this.currentCanvasId) {
      return { success: false, error: 'No canvas selected' };
    }

    try {
      const { data, error } = await this.supabaseClient.functions.invoke('realtime-collaboration', {
        body: {
          action: 'get_canvas_state',
          canvasId: this.currentCanvasId
        }
      });

      if (error) {
        throw error;
      }

      return { success: true, canvasState: data?.canvasState };
    } catch (error: any) {
      console.error('❌ Failed to get canvas state:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get active users
   */
  async getActiveUsers(): Promise<CollaborationUser[]> {
    if (!this.currentCanvasId) return [];

    try {
      const { data, error } = await this.supabaseClient.functions.invoke('realtime-collaboration', {
        body: {
          action: 'get_active_users',
          canvasId: this.currentCanvasId
        }
      });

      if (error) {
        throw error;
      }

      return data?.activeUsers?.map((user: any) => ({
        id: user.user_id,
        name: user.user_name,
        color: user.color,
        cursorPosition: user.cursor_position,
        lastSeen: user.last_seen,
        status: user.status
      })) || [];
    } catch (error) {
      console.error('❌ Failed to get active users:', error);
      return [];
    }
  }

  /**
   * Update cursor position
   */
  async updateCursor(position: { x: number; y: number }): Promise<void> {
    await this.broadcastEvent({
      type: 'cursor',
      data: { position }
    });
  }

  /**
   * Send voice command
   */
  async sendVoiceCommand(command: string): Promise<void> {
    await this.broadcastEvent({
      type: 'voice_command',
      data: { command }
    });
  }

  /**
   * Add event listener
   */
  addEventListener(eventType: string, listener: Function): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(eventType: string, listener: Function): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(eventType: string, data: any): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error('❌ Error in event listener:', error);
        }
      });
    }
  }

  /**
   * Start presence updates
   */
  private startPresenceUpdates(): void {
    this.stopPresenceUpdates();
    
    this.presenceUpdateInterval = setInterval(async () => {
      if (this.currentCanvasId && this.currentUserId) {
        try {
          // Update presence via direct database call for efficiency
          await this.supabaseClient
            .from('canvas_presence')
            .upsert({
              canvas_id: this.currentCanvasId,
              user_id: this.currentUserId,
              last_seen: new Date().toISOString(),
              status: 'active'
            }, {
              onConflict: 'canvas_id,user_id'
            });
        } catch (error) {
          console.error('❌ Failed to update presence:', error);
        }
      }
    }, 10000); // Update every 10 seconds
  }

  /**
   * Stop presence updates
   */
  private stopPresenceUpdates(): void {
    if (this.presenceUpdateInterval) {
      clearInterval(this.presenceUpdateInterval);
      this.presenceUpdateInterval = null;
    }
  }

  /**
   * Start polling for events
   */
  private startEventPolling(): void {
    this.stopEventPolling();

    this.syncInterval = setInterval(async () => {
      if (this.currentCanvasId) {
        try {
          // Poll for new collaboration events
          const { data: events } = await this.supabaseClient
            .from('collaboration_events')
            .select('*')
            .eq('canvas_id', this.currentCanvasId)
            .eq('processed', false)
            .order('timestamp', { ascending: true });

          if (events && events.length > 0) {
            // Process events
            for (const event of events) {
              if (event.user_id !== this.currentUserId) {
                this.emitEvent(event.event_type, {
                  type: event.event_type,
                  userId: event.user_id,
                  userName: event.user_name,
                  data: event.event_data,
                  timestamp: event.timestamp,
                  canvasId: event.canvas_id
                });
              }
            }

            // Mark events as processed
            await this.supabaseClient
              .from('collaboration_events')
              .update({ processed: true })
              .in('id', events.map((e: any) => e.id));
          }

          // Get updated active users
          const activeUsers = await this.getActiveUsers();
          this.emitEvent('users_updated', activeUsers);

        } catch (error) {
          console.error('❌ Failed to poll events:', error);
        }
      }
    }, 2000); // Poll every 2 seconds
  }

  /**
   * Stop event polling
   */
  private stopEventPolling(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Disconnect from collaboration
   */
  private disconnect(): void {
    this.stopPresenceUpdates();
    this.stopEventPolling();
    this.currentCanvasId = null;
    this.eventListeners.clear();
  }

  /**
   * Get service status
   */
  getStatus(): { connected: boolean; canvasId: string | null; userId: string | null } {
    return {
      connected: !!this.currentCanvasId && !!this.currentUserId,
      canvasId: this.currentCanvasId,
      userId: this.currentUserId
    };
  }
}

export const realTimeCollaborationService = new RealTimeCollaborationService();