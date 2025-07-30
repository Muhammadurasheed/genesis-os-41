-- Phase 5: Advanced AI & Autonomous Learning - Database Schema
-- Multi-modal AI, Real-time Communication, MCP Integration, Predictive Analytics

-- =====================================================
-- Multi-Modal AI Processing Tables
-- =====================================================

-- Multi-modal requests
CREATE TABLE IF NOT EXISTS multimodal_requests (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    input_type TEXT NOT NULL CHECK (input_type IN ('text', 'image', 'audio', 'video', 'mixed')),
    input_data JSONB NOT NULL,
    processing_options JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Multi-modal responses
CREATE TABLE IF NOT EXISTS multimodal_responses (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL REFERENCES multimodal_requests(id),
    agent_id TEXT NOT NULL,
    processing_time_ms INTEGER NOT NULL,
    results JSONB NOT NULL DEFAULT '{}',
    confidence_scores JSONB NOT NULL DEFAULT '{}',
    processing_cost DECIMAL(10,4) DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('completed', 'failed', 'partial')),
    error_details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Real-time Agent Communication Tables
-- =====================================================

-- Agent messages for real-time communication
CREATE TABLE IF NOT EXISTS agent_messages (
    id TEXT PRIMARY KEY,
    sender_agent_id TEXT NOT NULL,
    recipient_agent_id TEXT, -- NULL for broadcast messages
    message_type TEXT NOT NULL CHECK (message_type IN ('direct', 'broadcast', 'collaboration', 'knowledge_share', 'task_request')),
    content JSONB NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    requires_response BOOLEAN DEFAULT FALSE,
    conversation_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Agent collaborations
CREATE TABLE IF NOT EXISTS agent_collaborations (
    id TEXT PRIMARY KEY,
    initiator_agent_id TEXT NOT NULL,
    participant_agent_ids TEXT[] NOT NULL,
    collaboration_type TEXT NOT NULL CHECK (collaboration_type IN ('knowledge_synthesis', 'task_division', 'problem_solving', 'learning_session')),
    objective TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'paused', 'cancelled')) DEFAULT 'active',
    shared_context JSONB NOT NULL DEFAULT '{}',
    progress_metrics JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge exchanges between agents
CREATE TABLE IF NOT EXISTS knowledge_exchanges (
    id TEXT PRIMARY KEY,
    sender_agent_id TEXT NOT NULL,
    receiver_agent_id TEXT NOT NULL,
    knowledge_type TEXT NOT NULL CHECK (knowledge_type IN ('experience', 'pattern', 'solution', 'capability', 'insight')),
    knowledge_data JSONB NOT NULL,
    validation_score DECIMAL(3,2) DEFAULT 0.8 CHECK (validation_score >= 0 AND validation_score <= 1),
    application_count INTEGER DEFAULT 0,
    success_rate DECIMAL(3,2) DEFAULT 0 CHECK (success_rate >= 0 AND success_rate <= 1),
    shared_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MCP (Model Context Protocol) Integration Tables
-- =====================================================

-- MCP servers registry
CREATE TABLE IF NOT EXISTS mcp_servers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    capabilities TEXT[] NOT NULL DEFAULT '{}',
    endpoint TEXT NOT NULL,
    auth_type TEXT NOT NULL CHECK (auth_type IN ('none', 'api_key', 'oauth', 'jwt')) DEFAULT 'none',
    auth_config JSONB,
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'error')) DEFAULT 'active',
    last_ping TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MCP resources
CREATE TABLE IF NOT EXISTS mcp_resources (
    id TEXT PRIMARY KEY,
    server_id TEXT NOT NULL REFERENCES mcp_servers(id) ON DELETE CASCADE,
    uri TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
    metadata JSONB NOT NULL DEFAULT '{}',
    access_level TEXT NOT NULL CHECK (access_level IN ('read', 'write', 'execute')) DEFAULT 'read',
    last_accessed TIMESTAMPTZ DEFAULT NOW(),
    access_count INTEGER DEFAULT 0,
    UNIQUE(server_id, uri)
);

-- MCP tools
CREATE TABLE IF NOT EXISTS mcp_tools (
    id TEXT PRIMARY KEY,
    server_id TEXT NOT NULL REFERENCES mcp_servers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    input_schema JSONB NOT NULL DEFAULT '{}',
    output_schema JSONB NOT NULL DEFAULT '{}',
    capabilities TEXT[] NOT NULL DEFAULT '{}',
    execution_cost DECIMAL(10,4) DEFAULT 0,
    success_rate DECIMAL(3,2) DEFAULT 1.0 CHECK (success_rate >= 0 AND success_rate <= 1),
    avg_execution_time INTEGER DEFAULT 0,
    UNIQUE(server_id, name)
);

-- MCP prompts
CREATE TABLE IF NOT EXISTS mcp_prompts (
    id TEXT PRIMARY KEY,
    server_id TEXT NOT NULL REFERENCES mcp_servers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    arguments JSONB NOT NULL DEFAULT '{}',
    template TEXT DEFAULT '',
    category TEXT NOT NULL DEFAULT 'general',
    usage_count INTEGER DEFAULT 0,
    effectiveness_score DECIMAL(3,2) DEFAULT 0.8 CHECK (effectiveness_score >= 0 AND effectiveness_score <= 1),
    UNIQUE(server_id, name)
);

-- =====================================================
-- Predictive Analytics Tables
-- =====================================================

-- Prediction models registry
CREATE TABLE IF NOT EXISTS prediction_models (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('time_series', 'classification', 'regression', 'anomaly_detection')),
    category TEXT NOT NULL CHECK (category IN ('agent_performance', 'workflow_optimization', 'resource_usage', 'user_behavior')),
    algorithm TEXT NOT NULL,
    features TEXT[] NOT NULL,
    target_variable TEXT NOT NULL,
    accuracy DECIMAL(3,2) DEFAULT 0 CHECK (accuracy >= 0 AND accuracy <= 1),
    last_trained TIMESTAMPTZ DEFAULT NOW(),
    training_data_size INTEGER DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('active', 'training', 'deprecated')) DEFAULT 'training',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prediction requests
CREATE TABLE IF NOT EXISTS prediction_requests (
    id TEXT PRIMARY KEY,
    model_id TEXT NOT NULL REFERENCES prediction_models(id),
    agent_id TEXT,
    input_data JSONB NOT NULL,
    prediction_horizon INTEGER NOT NULL, -- hours
    confidence_threshold DECIMAL(3,2) NOT NULL CHECK (confidence_threshold >= 0 AND confidence_threshold <= 1),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prediction results
CREATE TABLE IF NOT EXISTS prediction_results (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL REFERENCES prediction_requests(id),
    model_id TEXT NOT NULL REFERENCES prediction_models(id),
    predictions JSONB NOT NULL,
    insights TEXT[] NOT NULL DEFAULT '{}',
    recommendations TEXT[] NOT NULL DEFAULT '{}',
    risk_assessment JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics patterns detected
CREATE TABLE IF NOT EXISTS analytics_patterns (
    id TEXT PRIMARY KEY,
    pattern_type TEXT NOT NULL CHECK (pattern_type IN ('trend', 'cycle', 'anomaly', 'correlation')),
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    strength DECIMAL(3,2) NOT NULL CHECK (strength >= 0 AND strength <= 1),
    frequency TEXT NOT NULL CHECK (frequency IN ('hourly', 'daily', 'weekly', 'monthly')),
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    data_points JSONB NOT NULL DEFAULT '[]',
    statistical_significance DECIMAL(3,2) NOT NULL CHECK (statistical_significance >= 0 AND statistical_significance <= 1)
);

-- =====================================================
-- Enhanced Agent Learning Tables (extend existing)
-- =====================================================

-- Agent learning insights (extend autonomous learning)
CREATE TABLE IF NOT EXISTS agent_learning_insights (
    id TEXT PRIMARY KEY DEFAULT generate_random_uuid(),
    agent_id TEXT NOT NULL,
    experience_id TEXT,
    analysis TEXT NOT NULL,
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent capabilities tracking
CREATE TABLE IF NOT EXISTS agent_capabilities (
    id TEXT PRIMARY KEY DEFAULT generate_random_uuid(),
    agent_id TEXT NOT NULL,
    capability TEXT NOT NULL,
    proficiency_level DECIMAL(3,2) NOT NULL CHECK (proficiency_level >= 0 AND proficiency_level <= 1),
    confidence_interval DECIMAL(3,2) NOT NULL CHECK (confidence_interval >= 0 AND confidence_interval <= 1),
    learning_velocity DECIMAL(3,2) NOT NULL CHECK (learning_velocity >= 0 AND learning_velocity <= 1),
    last_improvement TIMESTAMPTZ DEFAULT NOW(),
    training_examples INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(agent_id, capability)
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Multi-modal processing indexes
CREATE INDEX IF NOT EXISTS idx_multimodal_requests_agent_id ON multimodal_requests(agent_id);
CREATE INDEX IF NOT EXISTS idx_multimodal_requests_created_at ON multimodal_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_multimodal_responses_status ON multimodal_responses(status);
CREATE INDEX IF NOT EXISTS idx_multimodal_responses_agent_processing ON multimodal_responses(agent_id, processing_time_ms);

-- Real-time communication indexes
CREATE INDEX IF NOT EXISTS idx_agent_messages_recipient ON agent_messages(recipient_agent_id) WHERE recipient_agent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agent_messages_broadcast ON agent_messages(created_at) WHERE recipient_agent_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_agent_messages_conversation ON agent_messages(conversation_id) WHERE conversation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agent_collaborations_participants ON agent_collaborations USING GIN(participant_agent_ids);
CREATE INDEX IF NOT EXISTS idx_knowledge_exchanges_receiver ON knowledge_exchanges(receiver_agent_id);

-- MCP integration indexes
CREATE INDEX IF NOT EXISTS idx_mcp_resources_server_uri ON mcp_resources(server_id, uri);
CREATE INDEX IF NOT EXISTS idx_mcp_tools_server_name ON mcp_tools(server_id, name);
CREATE INDEX IF NOT EXISTS idx_mcp_prompts_category ON mcp_prompts(category);

-- Predictive analytics indexes
CREATE INDEX IF NOT EXISTS idx_prediction_requests_model ON prediction_requests(model_id);
CREATE INDEX IF NOT EXISTS idx_prediction_results_model_created ON prediction_results(model_id, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_patterns_category ON analytics_patterns(category, detected_at);

-- Agent learning indexes
CREATE INDEX IF NOT EXISTS idx_agent_capabilities_agent ON agent_capabilities(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_capabilities_proficiency ON agent_capabilities(capability, proficiency_level);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE multimodal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE multimodal_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_learning_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_capabilities ENABLE ROW LEVEL SECURITY;

-- Basic authenticated access policies (can be customized based on requirements)
CREATE POLICY "Authenticated users can access multimodal processing" ON multimodal_requests FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can access multimodal responses" ON multimodal_responses FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can access agent messages" ON agent_messages FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can access collaborations" ON agent_collaborations FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can access knowledge exchanges" ON knowledge_exchanges FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can access MCP servers" ON mcp_servers FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can access MCP resources" ON mcp_resources FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can access MCP tools" ON mcp_tools FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can access MCP prompts" ON mcp_prompts FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can access prediction models" ON prediction_models FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can access prediction requests" ON prediction_requests FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can access prediction results" ON prediction_results FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can access analytics patterns" ON analytics_patterns FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can access learning insights" ON agent_learning_insights FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can access agent capabilities" ON agent_capabilities FOR ALL TO authenticated USING (true);

-- =====================================================
-- Views for Analytics and Reporting
-- =====================================================

-- Agent communication summary view
CREATE OR REPLACE VIEW agent_communication_summary AS
SELECT 
    am.sender_agent_id as agent_id,
    COUNT(*) as messages_sent,
    COUNT(CASE WHEN am.recipient_agent_id IS NULL THEN 1 END) as broadcasts_sent,
    COUNT(CASE WHEN am.message_type = 'collaboration' THEN 1 END) as collaboration_messages,
    COUNT(CASE WHEN am.message_type = 'knowledge_share' THEN 1 END) as knowledge_shares,
    AVG(CASE WHEN am.requires_response THEN 1 ELSE 0 END) as response_request_rate,
    DATE_TRUNC('day', am.created_at) as date
FROM agent_messages am
GROUP BY am.sender_agent_id, DATE_TRUNC('day', am.created_at);

-- Multi-modal processing performance view
CREATE OR REPLACE VIEW multimodal_processing_performance AS
SELECT 
    mr.agent_id,
    mr.input_type,
    COUNT(*) as total_requests,
    COUNT(CASE WHEN mr2.status = 'completed' THEN 1 END) as successful_requests,
    AVG(mr2.processing_time_ms) as avg_processing_time,
    AVG(mr2.processing_cost) as avg_cost,
    DATE_TRUNC('hour', mr.created_at) as hour
FROM multimodal_requests mr
JOIN multimodal_responses mr2 ON mr.id = mr2.request_id
GROUP BY mr.agent_id, mr.input_type, DATE_TRUNC('hour', mr.created_at);

-- Prediction accuracy tracking view
CREATE OR REPLACE VIEW prediction_accuracy_tracking AS
SELECT 
    pm.id as model_id,
    pm.name as model_name,
    pm.type as model_type,
    pm.category,
    COUNT(pr.id) as total_predictions,
    AVG(pm.accuracy) as model_accuracy,
    DATE_TRUNC('day', pr.created_at) as date
FROM prediction_models pm
JOIN prediction_requests pr ON pm.id = pr.model_id
GROUP BY pm.id, pm.name, pm.type, pm.category, DATE_TRUNC('day', pr.created_at);

-- =====================================================
-- Functions for Common Operations
-- =====================================================

-- Function to get agent learning progress
CREATE OR REPLACE FUNCTION get_agent_learning_progress(p_agent_id TEXT)
RETURNS TABLE (
    capability TEXT,
    proficiency_level DECIMAL,
    learning_velocity DECIMAL,
    improvement_trend TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ac.capability,
        ac.proficiency_level,
        ac.learning_velocity,
        CASE 
            WHEN ac.learning_velocity > 0.7 THEN 'rapid'
            WHEN ac.learning_velocity > 0.4 THEN 'steady'
            WHEN ac.learning_velocity > 0.1 THEN 'slow'
            ELSE 'stagnant'
        END as improvement_trend
    FROM agent_capabilities ac
    WHERE ac.agent_id = p_agent_id
    ORDER BY ac.proficiency_level DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate communication network metrics
CREATE OR REPLACE FUNCTION get_communication_network_metrics()
RETURNS TABLE (
    total_agents INTEGER,
    total_messages BIGINT,
    avg_messages_per_agent DECIMAL,
    collaboration_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(DISTINCT sender_agent_id) FROM agent_messages)::INTEGER as total_agents,
        (SELECT COUNT(*) FROM agent_messages) as total_messages,
        (SELECT COUNT(*)::DECIMAL / COUNT(DISTINCT sender_agent_id) FROM agent_messages) as avg_messages_per_agent,
        (SELECT COUNT(CASE WHEN message_type = 'collaboration' THEN 1 END)::DECIMAL / COUNT(*) FROM agent_messages) as collaboration_rate;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE multimodal_requests IS 'Stores multi-modal AI processing requests from agents';
COMMENT ON TABLE agent_messages IS 'Real-time communication messages between agents';
COMMENT ON TABLE mcp_servers IS 'Registry of MCP (Model Context Protocol) servers';
COMMENT ON TABLE prediction_models IS 'Machine learning models for predictive analytics';
COMMENT ON TABLE analytics_patterns IS 'Detected patterns in agent behavior and system performance';