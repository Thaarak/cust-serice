import { NextRequest, NextResponse } from 'next/server';
import Airtable from 'airtable';

export async function POST(request: NextRequest) {
  try {
    const { baseId, apiKey, tableName } = await request.json();

    if (!baseId || !apiKey || !tableName) {
      return NextResponse.json(
        { error: 'Missing required fields: baseId, apiKey, or tableName' },
        { status: 400 }
      );
    }

    // Configure Airtable
    const base = new Airtable({ apiKey }).base(baseId);

    // Test connection by fetching table info
    const records = await base(tableName)
      .select({
        maxRecords: 1,
        view: 'Grid view' // Default view
      })
      .firstPage();

    // Get table schema by examining the first record
    const firstRecord = records[0];
    const fields = firstRecord ? Object.keys(firstRecord.fields) : [];

    // Get total record count (limit to 100 for performance)
    const allRecords = await base(tableName)
      .select({
        maxRecords: 100,
        fields: ['id'] // Only fetch IDs for counting
      })
      .firstPage();

    const tableInfo = {
      name: tableName,
      recordCount: allRecords.length,
      fields: fields,
    };

    return NextResponse.json({
      success: true,
      message: 'Connection successful',
      tableInfo,
    });

  } catch (error: any) {
    console.error('Airtable connection test failed:', error);
    
    let errorMessage = 'Connection failed';
    if (error.statusCode === 401) {
      errorMessage = 'Invalid API key';
    } else if (error.statusCode === 404) {
      errorMessage = 'Base or table not found';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}