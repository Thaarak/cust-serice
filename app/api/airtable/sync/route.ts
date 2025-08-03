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

    // Call the sessions endpoint to actually fetch fresh data
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
          { error: errorData.error || 'Failed to sync data' },
          { status: sessionsResponse.status }
        );
      }

      const sessionsData = await sessionsResponse.json();
      
      return NextResponse.json({
        success: true,
        message: 'Data sync completed successfully',
        timestamp: new Date().toISOString(),
        sessionCount: sessionsData.count || 0,
      });
      
    } catch (syncError) {
      console.error('Sync operation failed:', syncError);
      return NextResponse.json(
        { error: 'Failed to sync data from Airtable' },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Sync failed:', error);
    return NextResponse.json(
      { error: 'Sync operation failed' },
      { status: 500 }
    );
  }
}