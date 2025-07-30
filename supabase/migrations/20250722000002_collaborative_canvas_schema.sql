-- =====================================================
-- Collaborative Canvas Database Schema
-- =====================================================

-- Canvas States Table
CREATE TABLE IF NOT EXISTS canvas_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
    edges JSONB NOT NULL DEFAULT '[]'::jsonb,
    version INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_modified TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_modified_by UUID REFERENCES auth.users(id),
    active_users TEXT[] DEFAULT '{}'::text[],
    metadata JSONB DEFAULT '{}'::jsonb,
    canvas_name TEXT,
    canvas_description TEXT,
    is_template BOOLEAN DEFAULT false,
    template_category TEXT,
    owner_id UUID REFERENCES auth.users(id) NOT NULL
);

-- Canvas Presence Table (for real-time collaboration)
CREATE TABLE IF NOT EXISTS canvas_presence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canvas_id UUID REFERENCES canvas_states(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'away'
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    cursor_position JSONB DEFAULT '{"x": 0, "y": 0}'::jsonb,
    color TEXT NOT NULL DEFAULT '#8b5cf6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(canvas_id, user_id)
);

-- Collaboration Events Table (for event history and sync)
CREATE TABLE IF NOT EXISTS collaboration_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canvas_id UUID REFERENCES canvas_states(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'cursor', 'selection', 'canvas_update', 'voice_command', etc.
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    processed BOOLEAN DEFAULT false
);

-- Workflow Templates Table (enhanced)
CREATE TABLE IF NOT EXISTS workflow_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- 'automation', 'analysis', 'communication', 'integration'
    complexity TEXT NOT NULL DEFAULT 'medium', -- 'simple', 'medium', 'complex'
    nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
    edges JSONB NOT NULL DEFAULT '[]'::jsonb,
    estimated_time INTEGER DEFAULT 0, -- in seconds
    success_rate DECIMAL(3,2) DEFAULT 0.95,
    usage_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_public BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}'::text[],
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Workflow Executions Table (enhanced)
CREATE TABLE IF NOT EXISTS workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID, -- Can reference canvas_states or workflow_templates
    canvas_id UUID REFERENCES canvas_states(id) ON DELETE CASCADE,
    template_id UUID REFERENCES workflow_templates(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'paused', 'completed', 'failed', 'cancelled'
    start_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    current_node TEXT,
    progress INTEGER DEFAULT 0, -- 0-100
    metrics JSONB DEFAULT '{}'::jsonb,
    error_details TEXT,
    execution_log JSONB DEFAULT '[]'::jsonb,
    variables JSONB DEFAULT '{}'::jsonb,
    results JSONB DEFAULT '{}'::jsonb,
    owner_id UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Agent Analytics Table (enhanced)
CREATE TABLE IF NOT EXISTS agent_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,
    agent_name TEXT,
    agent_type TEXT,
    execution_id UUID REFERENCES workflow_executions(id) ON DELETE CASCADE,
    canvas_id UUID REFERENCES canvas_states(id) ON DELETE CASCADE,
    status TEXT NOT NULL, -- 'active', 'idle', 'error', 'completed'
    response_time INTEGER, -- in milliseconds
    total_requests INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 100.00,
    error_count INTEGER DEFAULT 0,
    last_execution TIMESTAMP WITH TIME ZONE,
    performance_metrics JSONB DEFAULT '{}'::jsonb,
    memory_usage_mb DECIMAL(10,2),
    cpu_usage_percent DECIMAL(5,2),
    owner_id UUID REFERENCES auth.users(id) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Voice Commands Table
CREATE TABLE IF NOT EXISTS voice_commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canvas_id UUID REFERENCES canvas_states(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    command_text TEXT NOT NULL,
    command_type TEXT, -- 'add_agent', 'connect_nodes', 'layout', 'save', etc.
    status TEXT NOT NULL DEFAULT 'processing', -- 'processing', 'completed', 'failed'
    executed_action JSONB DEFAULT '{}'::jsonb,
    execution_time INTEGER, -- in milliseconds
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE
);

-- AI Optimization Logs Table
CREATE TABLE IF NOT EXISTS ai_optimization_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canvas_id UUID REFERENCES canvas_states(id) ON DELETE CASCADE,
    optimization_type TEXT NOT NULL, -- 'layout', 'connections', 'validation', 'template_generation'
    input_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    output_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    algorithm_used TEXT,
    execution_time INTEGER, -- in milliseconds
    improvements JSONB DEFAULT '{}'::jsonb,
    user_accepted BOOLEAN,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Canvas States indexes
CREATE INDEX IF NOT EXISTS idx_canvas_states_owner ON canvas_states(owner_id);
CREATE INDEX IF NOT EXISTS idx_canvas_states_modified ON canvas_states(last_modified);
CREATE INDEX IF NOT EXISTS idx_canvas_states_template ON canvas_states(is_template);

-- Canvas Presence indexes
CREATE INDEX IF NOT EXISTS idx_canvas_presence_canvas ON canvas_presence(canvas_id);
CREATE INDEX IF NOT EXISTS idx_canvas_presence_user ON canvas_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_canvas_presence_status ON canvas_presence(status);
CREATE INDEX IF NOT EXISTS idx_canvas_presence_active ON canvas_presence(canvas_id, status, last_seen);

-- Collaboration Events indexes
CREATE INDEX IF NOT EXISTS idx_collaboration_events_canvas ON collaboration_events(canvas_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_events_timestamp ON collaboration_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_collaboration_events_processed ON collaboration_events(processed);

-- Workflow Templates indexes
CREATE INDEX IF NOT EXISTS idx_workflow_templates_category ON workflow_templates(category);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_public ON workflow_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_usage ON workflow_templates(usage_count);

-- Workflow Executions indexes
CREATE INDEX IF NOT EXISTS idx_workflow_executions_owner ON workflow_executions(owner_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_canvas ON workflow_executions(canvas_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_start ON workflow_executions(start_time);

-- Agent Analytics indexes
CREATE INDEX IF NOT EXISTS idx_agent_analytics_agent ON agent_analytics(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_analytics_execution ON agent_analytics(execution_id);
CREATE INDEX IF NOT EXISTS idx_agent_analytics_timestamp ON agent_analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_agent_analytics_owner ON agent_analytics(owner_id);

-- Voice Commands indexes
CREATE INDEX IF NOT EXISTS idx_voice_commands_canvas ON voice_commands(canvas_id);
CREATE INDEX IF NOT EXISTS idx_voice_commands_user ON voice_commands(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_commands_status ON voice_commands(status);

-- AI Optimization Logs indexes
CREATE INDEX IF NOT EXISTS idx_ai_optimization_canvas ON ai_optimization_logs(canvas_id);
CREATE INDEX IF NOT EXISTS idx_ai_optimization_type ON ai_optimization_logs(optimization_type);
CREATE INDEX IF NOT EXISTS idx_ai_optimization_created ON ai_optimization_logs(created_at);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE canvas_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_optimization_logs ENABLE ROW LEVEL SECURITY;

-- Canvas States policies
CREATE POLICY "Users can view own canvas states" ON canvas_states
    FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can insert own canvas states" ON canvas_states
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own canvas states" ON canvas_states
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can delete own canvas states" ON canvas_states
    FOR DELETE USING (owner_id = auth.uid());

-- Canvas Presence policies
CREATE POLICY "Users can view canvas presence for canvases they own or collaborate on" ON canvas_presence
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM canvas_states 
            WHERE canvas_states.id = canvas_presence.canvas_id 
            AND canvas_states.owner_id = auth.uid()
        ) OR user_id = auth.uid()
    );

CREATE POLICY "Users can manage their own presence" ON canvas_presence
    FOR ALL USING (user_id = auth.uid());

-- Collaboration Events policies
CREATE POLICY "Users can view events for canvases they own or collaborate on" ON collaboration_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM canvas_states 
            WHERE canvas_states.id = collaboration_events.canvas_id 
            AND canvas_states.owner_id = auth.uid()
        ) OR user_id = auth.uid()
    );

CREATE POLICY "Users can insert events for canvases they collaborate on" ON collaboration_events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM canvas_presence 
            WHERE canvas_presence.canvas_id = collaboration_events.canvas_id 
            AND canvas_presence.user_id = auth.uid()
        )
    );

-- Workflow Templates policies
CREATE POLICY "Users can view public templates and own templates" ON workflow_templates
    FOR SELECT USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create templates" ON workflow_templates
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own templates" ON workflow_templates
    FOR UPDATE USING (created_by = auth.uid());

-- Workflow Executions policies
CREATE POLICY "Users can view own executions" ON workflow_executions
    FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can create executions" ON workflow_executions
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own executions" ON workflow_executions
    FOR UPDATE USING (owner_id = auth.uid());

-- Agent Analytics policies
CREATE POLICY "Users can view own agent analytics" ON agent_analytics
    FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can insert agent analytics" ON agent_analytics
    FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Voice Commands policies
CREATE POLICY "Users can view own voice commands" ON voice_commands
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create voice commands" ON voice_commands
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- AI Optimization Logs policies
CREATE POLICY "Users can view optimization logs for own canvases" ON ai_optimization_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM canvas_states 
            WHERE canvas_states.id = ai_optimization_logs.canvas_id 
            AND canvas_states.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can create optimization logs" ON ai_optimization_logs
    FOR INSERT WITH CHECK (created_by = auth.uid());

-- =====================================================
-- Triggers for Updated At
-- =====================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_canvas_states_updated_at BEFORE UPDATE ON canvas_states
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_canvas_presence_updated_at BEFORE UPDATE ON canvas_presence
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_templates_updated_at BEFORE UPDATE ON workflow_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_executions_updated_at BEFORE UPDATE ON workflow_executions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Initial Data - Workflow Templates
-- =====================================================

INSERT INTO workflow_templates (name, description, category, complexity, nodes, edges, estimated_time, success_rate, is_public, tags) VALUES

('Customer Support AI', 'Intelligent customer support with sentiment analysis and escalation', 'automation', 'medium',
'[
  {"id": "trigger-1", "type": "trigger", "position": {"x": 100, "y": 200}, "data": {"label": "Customer Inquiry", "triggerType": "webhook"}},
  {"id": "agent-1", "type": "agent", "position": {"x": 300, "y": 200}, "data": {"label": "Support Classifier", "role": "classifier"}},
  {"id": "condition-1", "type": "condition", "position": {"x": 500, "y": 200}, "data": {"label": "Urgency Check", "condition": "priority === \"high\""}},
  {"id": "agent-2", "type": "agent", "position": {"x": 700, "y": 100}, "data": {"label": "Senior Support", "role": "support-specialist"}},
  {"id": "agent-3", "type": "agent", "position": {"x": 700, "y": 300}, "data": {"label": "Standard Support", "role": "support-general"}}
]'::jsonb,
'[
  {"id": "e1", "source": "trigger-1", "target": "agent-1"},
  {"id": "e2", "source": "agent-1", "target": "condition-1"},
  {"id": "e3", "source": "condition-1", "target": "agent-2", "sourceHandle": "true"},
  {"id": "e4", "source": "condition-1", "target": "agent-3", "sourceHandle": "false"}
]'::jsonb,
180, 0.92, true, '{"customer-service", "automation", "ai"}'),

('Data Analysis Pipeline', 'Automated data processing and insight generation', 'analysis', 'simple',
'[
  {"id": "trigger-1", "type": "trigger", "position": {"x": 100, "y": 200}, "data": {"label": "Data Input", "triggerType": "schedule"}},
  {"id": "agent-1", "type": "agent", "position": {"x": 300, "y": 200}, "data": {"label": "Data Validator", "role": "validator"}},
  {"id": "agent-2", "type": "agent", "position": {"x": 500, "y": 200}, "data": {"label": "Data Analyzer", "role": "analyst"}},
  {"id": "action-1", "type": "action", "position": {"x": 700, "y": 200}, "data": {"label": "Generate Report", "actionType": "report"}}
]'::jsonb,
'[
  {"id": "e1", "source": "trigger-1", "target": "agent-1"},
  {"id": "e2", "source": "agent-1", "target": "agent-2"},
  {"id": "e3", "source": "agent-2", "target": "action-1"}
]'::jsonb,
120, 0.95, true, '{"data", "analysis", "automation"}'),

('Content Creation Workflow', 'Multi-agent content creation and review process', 'communication', 'complex',
'[
  {"id": "trigger-1", "type": "trigger", "position": {"x": 100, "y": 200}, "data": {"label": "Content Request", "triggerType": "manual"}},
  {"id": "agent-1", "type": "agent", "position": {"x": 300, "y": 200}, "data": {"label": "Content Researcher", "role": "researcher"}},
  {"id": "agent-2", "type": "agent", "position": {"x": 500, "y": 200}, "data": {"label": "Content Writer", "role": "writer"}},
  {"id": "agent-3", "type": "agent", "position": {"x": 700, "y": 200}, "data": {"label": "Content Editor", "role": "editor"}},
  {"id": "action-1", "type": "action", "position": {"x": 900, "y": 200}, "data": {"label": "Publish Content", "actionType": "publish"}}
]'::jsonb,
'[
  {"id": "e1", "source": "trigger-1", "target": "agent-1"},
  {"id": "e2", "source": "agent-1", "target": "agent-2"},
  {"id": "e3", "source": "agent-2", "target": "agent-3"},
  {"id": "e4", "source": "agent-3", "target": "action-1"}
]'::jsonb,
300, 0.88, true, '{"content", "writing", "collaboration"}');

-- =====================================================
-- Functions for Real-time Features
-- =====================================================

-- Function to clean up inactive presence records
CREATE OR REPLACE FUNCTION cleanup_inactive_presence()
RETURNS void AS $$
BEGIN
    UPDATE canvas_presence 
    SET status = 'inactive'
    WHERE status = 'active' 
    AND last_seen < timezone('utc'::text, now()) - INTERVAL '2 minutes';
END;
$$ LANGUAGE plpgsql;

-- Function to get canvas statistics
CREATE OR REPLACE FUNCTION get_canvas_statistics(canvas_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_nodes', (SELECT jsonb_array_length(nodes) FROM canvas_states WHERE id = canvas_uuid),
        'total_edges', (SELECT jsonb_array_length(edges) FROM canvas_states WHERE id = canvas_uuid),
        'active_users', (SELECT COUNT(*) FROM canvas_presence WHERE canvas_id = canvas_uuid AND status = 'active'),
        'total_executions', (SELECT COUNT(*) FROM workflow_executions WHERE canvas_id = canvas_uuid),
        'last_modified', (SELECT last_modified FROM canvas_states WHERE id = canvas_uuid),
        'version', (SELECT version FROM canvas_states WHERE id = canvas_uuid)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;