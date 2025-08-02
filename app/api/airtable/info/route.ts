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

    // Get a sample of records to understand the structure
    const records = await base(tableName)
      .select({
        maxRecords: 10,
      })
      .firstPage();

    // Extract field information
    const fields = records.length > 0 ? Object.keys(records[0].fields) : [];

    // Get total count (limited for performance)
    const allRecords = await base(tableName)
      .select({
        maxRecords: 200,
        fields: ['id']
      })
      .firstPage();

    const tableInfo = {
      name: tableName,
      recordCount: allRecords.length,
      fields: fields,
    };

    return NextResponse.json({
      success: true,
      tableInfo,
    });

  } catch (error: any) {
    console.error('Failed to fetch table info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch table information' },
      { status: 500 }
    );
  }
}