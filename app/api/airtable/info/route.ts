import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { viewableLink } = await request.json();

    if (!viewableLink) {
      return NextResponse.json(
        { error: 'Missing required field: viewableLink' },
        { status: 400 }
      );
    }

    // Call the sessions endpoint to get the actual data and parse table info from it
    try {
      const sessionsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/airtable/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ viewableLink }),
      });

      if (!sessionsResponse.ok) {
        const errorData = await sessionsResponse.json();
        return NextResponse.json(
          { error: errorData.error || 'Failed to fetch table information' },
          { status: sessionsResponse.status }
        );
      }

      const sessionsData = await sessionsResponse.json();
      
      // Derive table info from the sessions data
      let fields = ['Session ID', 'Customer ID', 'Status', 'Sentiment', 'Created'];
      
      // If we have actual session data, get the field names from the first session
      if (sessionsData.sessions && sessionsData.sessions.length > 0) {
        const firstSession = sessionsData.sessions[0];
        fields = Object.keys(firstSession).filter(key => 
          !['turns', 'tools'].includes(key) // Exclude complex nested fields
        );
      }

      const tableInfo = {
        name: 'Customer Service Sessions',
        recordCount: sessionsData.count || 0,
        fields: fields,
      };

      return NextResponse.json({
        success: true,
        tableInfo,
      });
      
    } catch (fetchError) {
      console.error('Failed to fetch table info:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch table information' },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Failed to fetch table info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch table information' },
      { status: 500 }
    );
  }
}