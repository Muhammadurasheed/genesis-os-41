-- Genesis Phase 4: Production Workflow Engine Database Schema
-- Complete database architecture for enterprise workflow orchestration

-- Workflow Executions Table
CREATE TABLE workflow_executions (
    id TEXT PRIMARY KEY,
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'completed', 'failed', 'paused')),
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    current_node TEXT,
    variables JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    metrics JSONB DEFAULT '{}',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Execution Queue Table
CREATE TABLE execution_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id TEXT REFERENCES workflow_executions(id) ON DELETE CASCADE,
    queue_name TEXT NOT NULL,
    priority INTEGER NOT NULL DEFAULT 50,
    payload JSONB DEFAULT '{}',
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    scheduled_for TIMESTAMPTZ NOT NULL,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Execution Logs Table
CREATE TABLE execution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id TEXT REFERENCES workflow_executions(id) ON DELETE CASCADE,
    node_id TEXT,
    event_type TEXT NOT NULL,
    message TEXT NOT NULL,
    execution_time INTEGER, -- milliseconds
    metadata JSONB DEFAULT '{}',
    level TEXT DEFAULT 'info' CHECK (level IN ('debug', 'info', 'warning', 'error')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Health Monitoring
CREATE TABLE system_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy')),
    metrics JSONB DEFAULT '{}',
    alert_conditions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Performance Metrics
CREATE TABLE agent_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    execution_id TEXT REFERENCES workflow_executions(id) ON DELETE CASCADE,
    response_time INTEGER NOT NULL, -- milliseconds
    quality_score DECIMAL(3,2) CHECK (quality_score >= 0 AND quality_score <= 1),
    tokens_used INTEGER DEFAULT 0,
    credits_consumed DECIMAL(10,2) DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    success_rate DECIMAL(3,2) CHECK (success_rate >= 0 AND success_rate <= 1),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guild Analytics
CREATE TABLE guild_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guild_id UUID REFERENCES guilds(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_executions INTEGER DEFAULT 0,
    successful_executions INTEGER DEFAULT 0,
    failed_executions INTEGER DEFAULT 0,
    avg_execution_time INTEGER DEFAULT 0, -- milliseconds
    total_credits_used DECIMAL(10,2) DEFAULT 0,
    total_api_calls INTEGER DEFAULT 0,
    unique_workflows INTEGER DEFAULT 0,
    active_agents INTEGER DEFAULT 0,
    user_engagement_score DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(guild_id, date)
);

-- Marketplace Templates
CREATE TABLE marketplace_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    workflow_definition JSONB NOT NULL,
    pricing_type TEXT NOT NULL CHECK (pricing_type IN ('free', 'premium', 'enterprise')),
    price DECIMAL(10,2),
    downloads INTEGER DEFAULT 0,
    rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
    review_count INTEGER DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
    version TEXT NOT NULL DEFAULT '1.0.0',
    preview_images TEXT[] DEFAULT '{}',
    requirements JSONB DEFAULT '{}',
    integrations TEXT[] DEFAULT '{}',
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Template Reviews
CREATE TABLE template_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES marketplace_templates(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    helpful_votes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(template_id, user_id)
);

-- Template Downloads
CREATE TABLE template_downloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES marketplace_templates(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    guild_id UUID REFERENCES guilds(id) ON DELETE CASCADE,
    download_type TEXT NOT NULL CHECK (download_type IN ('install', 'fork', 'preview')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Security Audit Logs
CREATE TABLE security_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    ip_address INET,
    user_agent TEXT,
    request_data JSONB DEFAULT '{}',
    response_status INTEGER,
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'low',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate Limiting
CREATE TABLE rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    requests_count INTEGER DEFAULT 0,
    window_start TIMESTAMPTZ NOT NULL,
    window_end TIMESTAMPTZ NOT NULL,
    limit_exceeded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, endpoint, window_start)
);

-- Billing and Credits
CREATE TABLE user_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    credit_type TEXT NOT NULL CHECK (credit_type IN ('workflow_execution', 'ai_generation', 'storage', 'api_calls')),
    balance DECIMAL(10,2) NOT NULL DEFAULT 0,
    monthly_limit DECIMAL(10,2),
    usage_this_period DECIMAL(10,2) DEFAULT 0,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, credit_type, period_start)
);

-- Credit Transactions
CREATE TABLE credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    credit_type TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'refund', 'bonus')),
    description TEXT,
    metadata JSONB DEFAULT '{}',
    execution_id TEXT, -- Optional reference to workflow execution
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Optimization Views
CREATE VIEW workflow_performance_summary AS
SELECT 
    w.id as workflow_id,
    w.name as workflow_name,
    COUNT(we.id) as total_executions,
    AVG(EXTRACT(EPOCH FROM (we.completed_at - we.started_at))) as avg_duration_seconds,
    COUNT(CASE WHEN we.status = 'completed' THEN 1 END)::FLOAT / COUNT(we.id) as success_rate,
    SUM((we.metrics->>'api_calls_made')::INTEGER) as total_api_calls,
    SUM((we.metrics->>'credits_consumed')::DECIMAL) as total_credits_consumed
FROM workflows w
LEFT JOIN workflow_executions we ON w.id = we.workflow_id
WHERE we.created_at >= NOW() - INTERVAL '30 days'
GROUP BY w.id, w.name;

CREATE VIEW guild_performance_dashboard AS
SELECT 
    g.id as guild_id,
    g.name as guild_name,
    COUNT(DISTINCT w.id) as total_workflows,
    COUNT(DISTINCT a.id) as total_agents,
    COUNT(we.id) as total_executions,
    COUNT(CASE WHEN we.status = 'completed' THEN 1 END) as successful_executions,
    COUNT(CASE WHEN we.status = 'failed' THEN 1 END) as failed_executions,
    AVG(EXTRACT(EPOCH FROM (we.completed_at - we.started_at))) as avg_execution_time,
    SUM((we.metrics->>'credits_consumed')::DECIMAL) as total_credits_used
FROM guilds g
LEFT JOIN workflows w ON g.id = w.guild_id
LEFT JOIN agents a ON g.id = a.guild_id
LEFT JOIN workflow_executions we ON w.id = we.workflow_id
WHERE we.created_at >= NOW() - INTERVAL '7 days'
GROUP BY g.id, g.name;

-- Indexes for Performance
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX idx_workflow_executions_priority ON workflow_executions(priority);
CREATE INDEX idx_workflow_executions_scheduled ON workflow_executions(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_created_at ON workflow_executions(created_at);

CREATE INDEX idx_execution_queue_scheduled ON execution_queue(scheduled_for) WHERE processed_at IS NULL;
CREATE INDEX idx_execution_queue_priority ON execution_queue(priority) WHERE processed_at IS NULL;
CREATE INDEX idx_execution_queue_queue_name ON execution_queue(queue_name) WHERE processed_at IS NULL;

CREATE INDEX idx_execution_logs_execution_id ON execution_logs(execution_id);
CREATE INDEX idx_execution_logs_event_type ON execution_logs(event_type);
CREATE INDEX idx_execution_logs_created_at ON execution_logs(created_at);

CREATE INDEX idx_agent_performance_agent_id ON agent_performance(agent_id);
CREATE INDEX idx_agent_performance_created_at ON agent_performance(created_at);

CREATE INDEX idx_guild_analytics_guild_id ON guild_analytics(guild_id);
CREATE INDEX idx_guild_analytics_date ON guild_analytics(date);

CREATE INDEX idx_marketplace_templates_category ON marketplace_templates(category);
CREATE INDEX idx_marketplace_templates_status ON marketplace_templates(status);
CREATE INDEX idx_marketplace_templates_downloads ON marketplace_templates(downloads);
CREATE INDEX idx_marketplace_templates_rating ON marketplace_templates(rating);
CREATE INDEX idx_marketplace_templates_author ON marketplace_templates(author_id);

CREATE INDEX idx_security_audit_logs_user_id ON security_audit_logs(user_id);
CREATE INDEX idx_security_audit_logs_action ON security_audit_logs(action);
CREATE INDEX idx_security_audit_logs_created_at ON security_audit_logs(created_at);
CREATE INDEX idx_security_audit_logs_risk_level ON security_audit_logs(risk_level);

CREATE INDEX idx_rate_limits_user_endpoint ON rate_limits(user_id, endpoint);
CREATE INDEX idx_rate_limits_window ON rate_limits(window_start, window_end);

CREATE INDEX idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX idx_user_credits_period ON user_credits(period_start, period_end);

CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at);

-- Row Level Security (RLS) Policies
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workflow_executions
CREATE POLICY "Users can view their guild's workflow executions" ON workflow_executions
    FOR SELECT USING (
        workflow_id IN (
            SELECT w.id FROM workflows w
            JOIN guild_members gm ON w.guild_id = gm.guild_id
            WHERE gm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create workflow executions for their guilds" ON workflow_executions
    FOR INSERT WITH CHECK (
        workflow_id IN (
            SELECT w.id FROM workflows w
            JOIN guild_members gm ON w.guild_id = gm.guild_id
            WHERE gm.user_id = auth.uid()
        )
    );

-- RLS Policies for marketplace_templates
CREATE POLICY "Anyone can view published templates" ON marketplace_templates
    FOR SELECT USING (status = 'published');

CREATE POLICY "Authors can manage their templates" ON marketplace_templates
    FOR ALL USING (author_id = auth.uid());

-- RLS Policies for user_credits
CREATE POLICY "Users can view their own credits" ON user_credits
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view their own credit transactions" ON credit_transactions
    FOR SELECT USING (user_id = auth.uid());

-- Functions for automated tasks
CREATE OR REPLACE FUNCTION update_template_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update download count
    IF TG_OP = 'INSERT' AND NEW.download_type = 'install' THEN
        UPDATE marketplace_templates 
        SET downloads = downloads + 1 
        WHERE id = NEW.template_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_template_stats
    AFTER INSERT ON template_downloads
    FOR EACH ROW
    EXECUTE FUNCTION update_template_stats();

CREATE OR REPLACE FUNCTION update_template_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate average rating and review count
    UPDATE marketplace_templates 
    SET 
        rating = (
            SELECT AVG(rating)::DECIMAL(2,1) 
            FROM template_reviews 
            WHERE template_id = COALESCE(NEW.template_id, OLD.template_id)
        ),
        review_count = (
            SELECT COUNT(*) 
            FROM template_reviews 
            WHERE template_id = COALESCE(NEW.template_id, OLD.template_id)
        )
    WHERE id = COALESCE(NEW.template_id, OLD.template_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_template_rating
    AFTER INSERT OR UPDATE OR DELETE ON template_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_template_rating();

-- Analytics aggregation function
CREATE OR REPLACE FUNCTION aggregate_daily_analytics()
RETURNS void AS $$
BEGIN
    INSERT INTO guild_analytics (
        guild_id,
        date,
        total_executions,
        successful_executions,
        failed_executions,
        avg_execution_time,
        total_credits_used,
        total_api_calls,
        unique_workflows,
        active_agents
    )
    SELECT 
        w.guild_id,
        CURRENT_DATE - INTERVAL '1 day',
        COUNT(we.id),
        COUNT(CASE WHEN we.status = 'completed' THEN 1 END),
        COUNT(CASE WHEN we.status = 'failed' THEN 1 END),
        AVG(EXTRACT(EPOCH FROM (we.completed_at - we.started_at)) * 1000)::INTEGER,
        SUM((we.metrics->>'credits_consumed')::DECIMAL),
        SUM((we.metrics->>'api_calls_made')::INTEGER),
        COUNT(DISTINCT w.id),
        COUNT(DISTINCT a.id)
    FROM workflows w
    LEFT JOIN workflow_executions we ON w.id = we.workflow_id
    LEFT JOIN agents a ON w.guild_id = a.guild_id
    WHERE DATE(we.created_at) = CURRENT_DATE - INTERVAL '1 day'
    GROUP BY w.guild_id
    ON CONFLICT (guild_id, date) DO UPDATE SET
        total_executions = EXCLUDED.total_executions,
        successful_executions = EXCLUDED.successful_executions,
        failed_executions = EXCLUDED.failed_executions,
        avg_execution_time = EXCLUDED.avg_execution_time,
        total_credits_used = EXCLUDED.total_credits_used,
        total_api_calls = EXCLUDED.total_api_calls,
        unique_workflows = EXCLUDED.unique_workflows,
        active_agents = EXCLUDED.active_agents;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE workflow_executions IS 'Stores all workflow execution instances with metrics and status tracking';
COMMENT ON TABLE execution_queue IS 'Priority queue for scheduled and delayed workflow executions';
COMMENT ON TABLE execution_logs IS 'Detailed logs for debugging and monitoring workflow executions';
COMMENT ON TABLE system_health IS 'System health monitoring and alerting data';
COMMENT ON TABLE agent_performance IS 'Performance metrics for individual agents across executions';
COMMENT ON TABLE guild_analytics IS 'Daily aggregated analytics for guild performance and usage';
COMMENT ON TABLE marketplace_templates IS 'Published workflow templates available in the marketplace';
COMMENT ON TABLE template_reviews IS 'User reviews and ratings for marketplace templates';
COMMENT ON TABLE security_audit_logs IS 'Security audit trail for compliance and monitoring';
COMMENT ON TABLE rate_limits IS 'Rate limiting data for API endpoint protection';
COMMENT ON TABLE user_credits IS 'User credit balances and usage tracking';
COMMENT ON TABLE credit_transactions IS 'Transaction history for credit purchases and usage';