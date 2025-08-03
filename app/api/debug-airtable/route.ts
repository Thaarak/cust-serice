import { NextRequest, NextResponse } from 'next/server';
import { writeFileSync } from 'fs';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const { viewableLink } = await request.json();

    if (!viewableLink) {
      return NextResponse.json(
        { error: 'Missing viewableLink' },
        { status: 400 }
      );
    }

    console.log('Fetching HTML content from:', viewableLink);

    const htmlResponse = await fetch(viewableLink, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      }
    });

    if (!htmlResponse.ok) {
      return NextResponse.json(
        { error: `Failed to fetch HTML: ${htmlResponse.status}` },
        { status: 400 }
      );
    }

    const htmlContent = await htmlResponse.text();
    
    // Save HTML content to a file for analysis
    const debugPath = join(process.cwd(), 'debug-airtable.html');
    writeFileSync(debugPath, htmlContent);
    
    // Extract some key information
    const scriptTags = htmlContent.match(/<script[^>]*>(.*?)<\/script>/g) || [];
    const title = htmlContent.match(/<title>(.*?)<\/title>/)?.[1] || 'No title';
    
    // Look for potential data patterns more broadly
    const dataPatterns = [
      /window\.__[A-Z_]+__/g,
      /"records":/g,
      /"rows":/g,
      /"data":/g,
      /"tableData":/g,
      /"applicationData":/g,
      /"initialData":/g,
    ];

    const foundPatterns = {};
    for (const pattern of dataPatterns) {
      const matches = htmlContent.match(pattern);
      foundPatterns[pattern.source] = matches ? matches.length : 0;
    }

    // Look for table structure
    const tableTags = htmlContent.match(/<table[^>]*>/g) || [];
    const trTags = htmlContent.match(/<tr[^>]*>/g) || [];
    const tdTags = htmlContent.match(/<td[^>]*>/g) || [];

    // Look for any JSON-like structures
    const jsonLike = htmlContent.match(/\{[^{}]*"[^"]*":[^{}]*\}/g) || [];
    
    return NextResponse.json({
      success: true,
      analysis: {
        htmlLength: htmlContent.length,
        title,
        scriptTagCount: scriptTags.length,
        scriptTagLengths: scriptTags.map(s => s.length),
        foundPatterns,
        tableStructure: {
          tables: tableTags.length,
          rows: trTags.length,
          cells: tdTags.length
        },
        jsonLikeStructures: jsonLike.length,
        sampleJsonLike: jsonLike.slice(0, 3),
        savedToFile: debugPath
      }
    });

  } catch (error: any) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      { error: 'Debug failed', details: error.message },
      { status: 500 }
    );
  }
}