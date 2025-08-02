import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message, sessions } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Create context about the sessions for Claude
    const sessionsContext = sessions ? `
Current session data context:
- Total sessions: ${sessions.length}
- Session details: ${JSON.stringify(sessions.slice(0, 3))} ${sessions.length > 3 ? '(showing first 3 sessions)' : ''}
` : '';

    const systemPrompt = `Analyze customer service data concisely. Your response to the user should be 3-5 sentences max. Format your response in sentences. Sound more human. Make it sounds like you're having an actual cnversation with someone.   ${sessionsContext}`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return NextResponse.json({
        content: content.text,
        suggestions: [
          "Analyze sentiment trends across all sessions",
          "What are the most common customer issues?",
          "How can we improve resolution times?",
          "Show me escalation patterns",
        ],
      });
    }

    return NextResponse.json({ error: 'Unexpected response format' }, { status: 500 });
  } catch (error) {
    console.error('Claude API error:', error);
    return NextResponse.json(
      { error: 'Failed to get response from Claude' },
      { status: 500 }
    );
  }
}