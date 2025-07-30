-- Comprehensive backend schema for GenesisOS AI Orchestration Platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types
CREATE TYPE agent_status AS ENUM ('active', 'inactive', 'error', 'deploying');
CREATE TYPE workflow_status AS ENUM ('draft', 'active', 'archived', 'running', 'paused');
CREATE TYPE deployment_type AS ENUM ('discord', 'slack', 'telegram', 'webhook', 'api');
CREATE TYPE deployment_status AS ENUM ('pending', 'active', 'failed', 'stopped', 'deploying');
CREATE TYPE execution_status AS ENUM ('running', 'completed', 'failed', 'paused', 'cancelled');

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    role VARCHAR(100) NOT NULL,
    tools TEXT[] DEFAULT '{}',
    personality TEXT,
    status agent_status DEFAULT 'inactive',
    configuration JSONB DEFAULT '{}',
    performance_metrics JSONB DEFAULT '{}',
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Workflows table
CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    nodes JSONB DEFAULT '[]',
    edges JSONB DEFAULT '[]',
    status workflow_status DEFAULT 'draft',
    execution_count INTEGER DEFAULT 0,
    last_execution TIMESTAMP WITH TIME ZONE,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Guilds table (collections of agents)
CREATE TABLE IF NOT EXISTS guilds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    agents UUID[] DEFAULT '{}',
    workflows UUID[] DEFAULT '{}',
    status agent_status DEFAULT 'inactive',
    deployment_config JSONB DEFAULT '{}',
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Deployments table
CREATE TABLE IF NOT EXISTS deployments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type deployment_type NOT NULL,
    status deployment_status DEFAULT 'pending',
    config JSONB NOT NULL DEFAULT '{}',
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    guild_id UUID REFERENCES guilds(id) ON DELETE CASCADE,
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    webhook_url TEXT,
    last_ping TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Workflow executions table
CREATE TABLE IF NOT EXISTS workflow_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    status execution_status DEFAULT 'running',
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    progress INTEGER DEFAULT 0,
    current_node VARCHAR(100),
    metrics JSONB DEFAULT '{}',
    logs JSONB DEFAULT '[]',
    error_details TEXT,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Agent analytics table
CREATE TABLE IF NOT EXISTS agent_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    cpu_usage DECIMAL(5,2),
    memory_usage DECIMAL(5,2),
    response_time DECIMAL(10,3),
    total_requests INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Agent communications table
CREATE TABLE IF NOT EXISTS agent_communications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_agent UUID REFERENCES agents(id) ON DELETE CASCADE,
    to_agent UUID REFERENCES agents(id) ON DELETE CASCADE,
    message_type VARCHAR(50) NOT NULL,
    content JSONB NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Credentials table (encrypted storage)
CREATE TABLE IF NOT EXISTS credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    encrypted_data TEXT NOT NULL, -- Will store encrypted JSON
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Simulations table
CREATE TABLE IF NOT EXISTS simulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    scenario_data JSONB NOT NULL DEFAULT '{}',
    results JSONB DEFAULT '{}',
    status execution_status DEFAULT 'running',
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Video generations table
CREATE TABLE IF NOT EXISTS video_generations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    script TEXT NOT NULL,
    persona JSONB NOT NULL DEFAULT '{}',
    settings JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending',
    tavus_video_id VARCHAR(255),
    video_url TEXT,
    preview_url TEXT,
    error_message TEXT,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Voice generations table
CREATE TABLE IF NOT EXISTS voice_generations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    text TEXT NOT NULL,
    voice_id VARCHAR(255) NOT NULL,
    settings JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending',
    audio_url TEXT,
    error_message TEXT,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- System metrics table
CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_type VARCHAR(50) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    value DECIMAL(15,5) NOT NULL,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Blueprints table
CREATE TABLE IF NOT EXISTS blueprints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    prompt TEXT NOT NULL,
    generated_workflow JSONB NOT NULL DEFAULT '{}',
    validation_results JSONB DEFAULT '{}',
    is_validated BOOLEAN DEFAULT FALSE,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agents_owner_id ON agents(owner_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_workflows_owner_id ON workflows(owner_id);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);
CREATE INDEX IF NOT EXISTS idx_guilds_owner_id ON guilds(owner_id);
CREATE INDEX IF NOT EXISTS idx_deployments_owner_id ON deployments(owner_id);
CREATE INDEX IF NOT EXISTS idx_deployments_status ON deployments(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_agent_analytics_agent_id ON agent_analytics(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_analytics_timestamp ON agent_analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_agent_communications_timestamp ON agent_communications(timestamp);
CREATE INDEX IF NOT EXISTS idx_credentials_owner_id ON credentials(owner_id);
CREATE INDEX IF NOT EXISTS idx_credentials_type ON credentials(type);
CREATE INDEX IF NOT EXISTS idx_simulations_owner_id ON simulations(owner_id);
CREATE INDEX IF NOT EXISTS idx_video_generations_owner_id ON video_generations(owner_id);
CREATE INDEX IF NOT EXISTS idx_voice_generations_owner_id ON voice_generations(owner_id);
CREATE INDEX IF NOT EXISTS idx_system_metrics_type_timestamp ON system_metrics(metric_type, timestamp);
CREATE INDEX IF NOT EXISTS idx_blueprints_owner_id ON blueprints(owner_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_agents_updated_at ON agents;
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workflows_updated_at ON workflows;
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_guilds_updated_at ON guilds;
CREATE TRIGGER update_guilds_updated_at BEFORE UPDATE ON guilds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_deployments_updated_at ON deployments;
CREATE TRIGGER update_deployments_updated_at BEFORE UPDATE ON deployments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_workflow_executions_updated_at ON workflow_executions;
CREATE TRIGGER update_workflow_executions_updated_at BEFORE UPDATE ON workflow_executions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_credentials_updated_at ON credentials;
CREATE TRIGGER update_credentials_updated_at BEFORE UPDATE ON credentials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_video_generations_updated_at ON video_generations;
CREATE TRIGGER update_video_generations_updated_at BEFORE UPDATE ON video_generations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_voice_generations_updated_at ON voice_generations;
CREATE TRIGGER update_voice_generations_updated_at BEFORE UPDATE ON voice_generations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_blueprints_updated_at ON blueprints;
CREATE TRIGGER update_blueprints_updated_at BEFORE UPDATE ON blueprints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE guilds ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE blueprints ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agents
DROP POLICY IF EXISTS "Users can view their own agents" ON agents;
CREATE POLICY "Users can view their own agents" ON agents FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can create agents" ON agents;
CREATE POLICY "Users can create agents" ON agents FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update their own agents" ON agents;
CREATE POLICY "Users can update their own agents" ON agents FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete their own agents" ON agents;
CREATE POLICY "Users can delete their own agents" ON agents FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for workflows
DROP POLICY IF EXISTS "Users can view their own workflows" ON workflows;
CREATE POLICY "Users can view their own workflows" ON workflows FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can create workflows" ON workflows;
CREATE POLICY "Users can create workflows" ON workflows FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update their own workflows" ON workflows;
CREATE POLICY "Users can update their own workflows" ON workflows FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete their own workflows" ON workflows;
CREATE POLICY "Users can delete their own workflows" ON workflows FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for guilds
DROP POLICY IF EXISTS "Users can view their own guilds" ON guilds;
CREATE POLICY "Users can view their own guilds" ON guilds FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can create guilds" ON guilds;
CREATE POLICY "Users can create guilds" ON guilds FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update their own guilds" ON guilds;
CREATE POLICY "Users can update their own guilds" ON guilds FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete their own guilds" ON guilds;
CREATE POLICY "Users can delete their own guilds" ON guilds FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for deployments
DROP POLICY IF EXISTS "Users can view their own deployments" ON deployments;
CREATE POLICY "Users can view their own deployments" ON deployments FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can create deployments" ON deployments;
CREATE POLICY "Users can create deployments" ON deployments FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update their own deployments" ON deployments;
CREATE POLICY "Users can update their own deployments" ON deployments FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete their own deployments" ON deployments;
CREATE POLICY "Users can delete their own deployments" ON deployments FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for workflow_executions
DROP POLICY IF EXISTS "Users can view their own workflow executions" ON workflow_executions;
CREATE POLICY "Users can view their own workflow executions" ON workflow_executions FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can create workflow executions" ON workflow_executions;
CREATE POLICY "Users can create workflow executions" ON workflow_executions FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update their own workflow executions" ON workflow_executions;
CREATE POLICY "Users can update their own workflow executions" ON workflow_executions FOR UPDATE USING (auth.uid() = owner_id);

-- RLS Policies for other tables (similar pattern)
-- Agent analytics - users can view analytics for their agents
DROP POLICY IF EXISTS "Users can view analytics for their agents" ON agent_analytics;
CREATE POLICY "Users can view analytics for their agents" ON agent_analytics FOR SELECT USING (
    auth.uid() IN (SELECT owner_id FROM agents WHERE id = agent_analytics.agent_id)
);

DROP POLICY IF EXISTS "System can insert analytics" ON agent_analytics;
CREATE POLICY "System can insert analytics" ON agent_analytics FOR INSERT WITH CHECK (true);

-- Credentials - secure access
DROP POLICY IF EXISTS "Users can view their own credentials" ON credentials;
CREATE POLICY "Users can view their own credentials" ON credentials FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can create credentials" ON credentials;
CREATE POLICY "Users can create credentials" ON credentials FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update their own credentials" ON credentials;
CREATE POLICY "Users can update their own credentials" ON credentials FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete their own credentials" ON credentials;
CREATE POLICY "Users can delete their own credentials" ON credentials FOR DELETE USING (auth.uid() = owner_id);

-- Video and voice generations
DROP POLICY IF EXISTS "Users can view their own video generations" ON video_generations;
CREATE POLICY "Users can view their own video generations" ON video_generations FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can create video generations" ON video_generations;
CREATE POLICY "Users can create video generations" ON video_generations FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update their own video generations" ON video_generations;
CREATE POLICY "Users can update their own video generations" ON video_generations FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can view their own voice generations" ON voice_generations;
CREATE POLICY "Users can view their own voice generations" ON voice_generations FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can create voice generations" ON voice_generations;
CREATE POLICY "Users can create voice generations" ON voice_generations FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update their own voice generations" ON voice_generations;
CREATE POLICY "Users can update their own voice generations" ON voice_generations FOR UPDATE USING (auth.uid() = owner_id);

-- Blueprints
DROP POLICY IF EXISTS "Users can view their own blueprints" ON blueprints;
CREATE POLICY "Users can view their own blueprints" ON blueprints FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can create blueprints" ON blueprints;
CREATE POLICY "Users can create blueprints" ON blueprints FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update their own blueprints" ON blueprints;
CREATE POLICY "Users can update their own blueprints" ON blueprints FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete their own blueprints" ON blueprints;
CREATE POLICY "Users can delete their own blueprints" ON blueprints FOR DELETE USING (auth.uid() = owner_id);

-- System metrics - read-only for authenticated users
DROP POLICY IF EXISTS "Authenticated users can view system metrics" ON system_metrics;
CREATE POLICY "Authenticated users can view system metrics" ON system_metrics FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "System can insert metrics" ON system_metrics;
CREATE POLICY "System can insert metrics" ON system_metrics FOR INSERT WITH CHECK (true);