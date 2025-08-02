import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';

export async function POST(request: NextRequest) {
  try {
    const { baseId, apiKey, tableName } = await request.json();

    if (!baseId || !apiKey || !tableName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const base = new Airtable({ apiKey }).base(baseId);

    // Fetch all records
    const records = await base(tableName)
      .select({
        maxRecords: 100, // Limit for performance
        sort: [{ field: 'Created', direction: 'desc' }] // Assuming there's a Created field
      })
      .firstPage();

    // Transform Airtable records to our session format
    const sessions = records.map(record => {
      const fields = record.fields as any;
      
      // Map common field names to our schema
      // This will need to be customized based on the user's Airtable structure
      return {
        sessionId: record.id,
        customerId: fields['Customer ID'] || fields['Customer'] || fields['Name'] || 'Unknown',
        createdAt: new Date(fields['Created'] || fields['Date'] || fields['Timestamp'] || Date.now()),
        status: mapStatus(fields['Status'] || fields['State'] || 'open'),
        escalationRecommended: fields['Escalation Recommended'] || fields['Escalate'] || false,
        tags: parseTags(fields['Tags'] || fields['Categories'] || ''),
        sentiment: mapSentiment(fields['Sentiment'] || fields['Mood'] || 'neutral'),
        turns: parseTurns(fields['Conversation'] || fields['Messages'] || fields['Chat'] || ''),
        tools: parseTools(fields['Tools Used'] || fields['Actions'] || ''),
      };
    });

    return NextResponse.json({
      success: true,
      sessions,
      count: sessions.length,
    });

  } catch (error: any) {
    console.error('Failed to fetch sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session data' },
      { status: 500 }
    );
  }
}

// Helper functions to map Airtable data to our format
function mapStatus(status: string): 'open' | 'resolved' | 'escalated' {
  const normalized = status.toLowerCase();
  if (normalized.includes('resolved') || normalized.includes('closed')) return 'resolved';
  if (normalized.includes('escalated') || normalized.includes('escalate')) return 'escalated';
  return 'open';
}

function mapSentiment(sentiment: string): 'positive' | 'neutral' | 'frustrated' {
  const normalized = sentiment.toLowerCase();
  if (normalized.includes('positive') || normalized.includes('happy') || normalized.includes('satisfied')) return 'positive';
  if (normalized.includes('negative') || normalized.includes('frustrated') || normalized.includes('angry')) return 'frustrated';
  return 'neutral';
}

function parseTags(tagsStr: string): string[] {
  if (!tagsStr) return [];
  // Handle comma-separated tags or JSON array
  try {
    if (tagsStr.startsWith('[')) {
      return JSON.parse(tagsStr);
    }
    return tagsStr.split(',').map(tag => tag.trim()).filter(Boolean);
  } catch {
    return tagsStr.split(',').map(tag => tag.trim()).filter(Boolean);
  }
}

function parseTurns(conversationStr: string): Array<{ speaker: 'user' | 'agent'; text: string; timestamp: Date }> {
  if (!conversationStr) return [];
  
  try {
    // Try to parse as JSON first
    if (conversationStr.startsWith('[')) {
      return JSON.parse(conversationStr);
    }
    
    // Otherwise, parse as simple text format
    const lines = conversationStr.split('\n').filter(Boolean);
    return lines.map((line, index) => {
      const isAgent = line.toLowerCase().includes('agent:') || line.toLowerCase().includes('support:');
      const text = line.replace(/^(user:|agent:|support:|customer:)/i, '').trim();
      
      return {
        speaker: isAgent ? 'agent' : 'user' as const,
        text,
        timestamp: new Date(Date.now() - (lines.length - index) * 60000), // Simulate timestamps
      };
    });
  } catch {
    // Fallback: treat entire text as single user message
    return [{
      speaker: 'user' as const,
      text: conversationStr,
      timestamp: new Date(),
    }];
  }
}

function parseTools(toolsStr: string): Array<{ name: string; payload: object; timestamp: Date; success?: boolean }> {
  if (!toolsStr) return [];
  
  try {
    // Try to parse as JSON
    if (toolsStr.startsWith('[')) {
      return JSON.parse(toolsStr);
    }
    
    // Parse comma-separated tool names
    const tools = toolsStr.split(',').map(tool => tool.trim()).filter(Boolean);
    return tools.map((tool, index) => ({
      name: tool.toLowerCase().replace(/\s+/g, '_'),
      payload: {},
      timestamp: new Date(Date.now() - (tools.length - index) * 30000),
      success: true, // Default to success unless specified otherwise
    }));
  } catch {
    return [];
  }
}