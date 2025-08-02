-- Create sessions table for storing Claude agent interactions
CREATE TABLE IF NOT EXISTS sessions (
    session_id VARCHAR(255) PRIMARY KEY,
    customer_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) CHECK (status IN ('open', 'resolved', 'escalated')) DEFAULT 'open',
    escalation_recommended BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}',
    sentiment VARCHAR(50) CHECK (sentiment IN ('positive', 'neutral', 'frustrated')) DEFAULT 'neutral',
    turns JSONB DEFAULT '[]',
    tools JSONB DEFAULT '[]',
    claude_summary TEXT,
    recommended_actions TEXT[]
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sessions_customer_id ON sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_sentiment ON sessions(sentiment);
CREATE INDEX IF NOT EXISTS idx_sessions_tags ON sessions USING GIN(tags);

-- Create follow_ups table for tracking scheduled follow-ups
CREATE TABLE IF NOT EXISTS follow_ups (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) REFERENCES sessions(session_id),
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create webhook_logs table for debugging n8n integrations
CREATE TABLE IF NOT EXISTS webhook_logs (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255),
    webhook_type VARCHAR(100),
    payload JSONB,
    response_status INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
