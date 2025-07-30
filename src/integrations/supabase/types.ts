export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      agents: {
        Row: {
          created_at: string | null
          description: string
          guild_id: string
          id: string
          instructions: string
          memory_config: Json | null
          metadata: Json | null
          name: string
          personality: string
          role: string
          status: string | null
          tools: Json | null
          updated_at: string | null
          user_id: string
          voice_config: Json | null
        }
        Insert: {
          created_at?: string | null
          description: string
          guild_id: string
          id?: string
          instructions: string
          memory_config?: Json | null
          metadata?: Json | null
          name: string
          personality: string
          role: string
          status?: string | null
          tools?: Json | null
          updated_at?: string | null
          user_id: string
          voice_config?: Json | null
        }
        Update: {
          created_at?: string | null
          description?: string
          guild_id?: string
          id?: string
          instructions?: string
          memory_config?: Json | null
          metadata?: Json | null
          name?: string
          personality?: string
          role?: string
          status?: string | null
          tools?: Json | null
          updated_at?: string | null
          user_id?: string
          voice_config?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      blueprints: {
        Row: {
          created_at: string | null
          id: string
          interpretation: string
          metadata: Json | null
          status: string | null
          suggested_structure: Json
          updated_at: string | null
          user_id: string
          user_input: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          interpretation: string
          metadata?: Json | null
          status?: string | null
          suggested_structure: Json
          updated_at?: string | null
          user_id: string
          user_input: string
        }
        Update: {
          created_at?: string | null
          id?: string
          interpretation?: string
          metadata?: Json | null
          status?: string | null
          suggested_structure?: Json
          updated_at?: string | null
          user_id?: string
          user_input?: string
        }
        Relationships: [
          {
            foreignKeyName: "blueprints_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      credentials: {
        Row: {
          agent_id: string | null
          created_at: string | null
          credential_type: string
          encrypted_value: string
          guild_id: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          service_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string | null
          credential_type: string
          encrypted_value: string
          guild_id?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          service_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string | null
          credential_type?: string
          encrypted_value?: string
          guild_id?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          service_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credentials_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credentials_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credentials_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      guilds: {
        Row: {
          created_at: string | null
          description: string
          id: string
          metadata: Json | null
          name: string
          purpose: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          metadata?: Json | null
          name: string
          purpose: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          metadata?: Json | null
          name?: string
          purpose?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guilds_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      memories: {
        Row: {
          agent_id: string
          content: string
          created_at: string | null
          embedding_data: Json | null
          expires_at: string | null
          id: string
          importance_score: number | null
          memory_type: string | null
          metadata: Json | null
          user_id: string
        }
        Insert: {
          agent_id: string
          content: string
          created_at?: string | null
          embedding_data?: Json | null
          expires_at?: string | null
          id?: string
          importance_score?: number | null
          memory_type?: string | null
          metadata?: Json | null
          user_id: string
        }
        Update: {
          agent_id?: string
          content?: string
          created_at?: string | null
          embedding_data?: Json | null
          expires_at?: string | null
          id?: string
          importance_score?: number | null
          memory_type?: string | null
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memories_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      simulations: {
        Row: {
          agent_responses: Json | null
          created_at: string | null
          errors: string[] | null
          execution_time: number | null
          guild_id: string
          id: string
          overall_success: boolean | null
          results: Json
          test_data: Json
          user_id: string
        }
        Insert: {
          agent_responses?: Json | null
          created_at?: string | null
          errors?: string[] | null
          execution_time?: number | null
          guild_id: string
          id?: string
          overall_success?: boolean | null
          results?: Json
          test_data?: Json
          user_id: string
        }
        Update: {
          agent_responses?: Json | null
          created_at?: string | null
          errors?: string[] | null
          execution_time?: number | null
          guild_id?: string
          id?: string
          overall_success?: boolean | null
          results?: Json
          test_data?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulations_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          email_confirmed: boolean | null
          id: string
          metadata: Json | null
          name: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          email_confirmed?: boolean | null
          id: string
          metadata?: Json | null
          name: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          email_confirmed?: boolean | null
          id?: string
          metadata?: Json | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      workflows: {
        Row: {
          created_at: string | null
          description: string
          edges: Json | null
          guild_id: string
          id: string
          metadata: Json | null
          name: string
          nodes: Json | null
          status: string | null
          trigger: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          edges?: Json | null
          guild_id: string
          id?: string
          metadata?: Json | null
          name: string
          nodes?: Json | null
          status?: string | null
          trigger?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          edges?: Json | null
          guild_id?: string
          id?: string
          metadata?: Json | null
          name?: string
          nodes?: Json | null
          status?: string | null
          trigger?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflows_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflows_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      find_similar_memories: {
        Args: {
          agent_uuid: string
          reference_content: string
          match_count?: number
        }
        Returns: {
          id: string
          content: string
          memory_type: string
          similarity_score: number
          created_at: string
        }[]
      }
      is_email_confirmed: {
        Args: { user_id: string }
        Returns: boolean
      }
      search_memories: {
        Args: { agent_uuid: string; search_query: string; match_count?: number }
        Returns: {
          id: string
          content: string
          memory_type: string
          metadata: Json
          importance_score: number
          created_at: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
