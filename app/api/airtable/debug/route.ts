import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { viewableLink } = await request.json();
    const diagnostics: any = {
      originalLink: viewableLink,
      attempts: [],
      timestamp: new Date().toISOString(),
    };

    if (!viewableLink) {
      return NextResponse.json({ error: 'Missing viewableLink' }, { status: 400 });
    }

    // Extract share ID
    const shareIdMatch = viewableLink.match(/shr[a-zA-Z0-9]+/);
    if (!shareIdMatch) {
      return NextResponse.json({ error: 'Could not extract share ID' }, { status: 400 });
    }
    
    const shareId = shareIdMatch[0];
    diagnostics.shareId = shareId;

    // Test all possible CSV URLs
    const csvUrls = [
      `https://airtable.com/${shareId}.csv`,
      `https://airtable.com/v0/${shareId}.csv`,
      `https://airtable.com/embed/${shareId}.csv`,
      `${viewableLink}/csv`,
      `${viewableLink}.csv`,
      viewableLink + '?csv=1',
    ];

    for (const csvUrl of csvUrls) {
      try {
        console.log('Testing CSV URL:', csvUrl);
        const response = await fetch(csvUrl);
        
        const attempt = {
          url: csvUrl,
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get('content-type'),
          contentLength: response.headers.get('content-length'),
        };

        if (response.ok) {
          const content = await response.text();
          attempt.responseLength = content.length;
          attempt.firstChars = content.substring(0, 300);
          attempt.looksLikeCSV = content.includes(',') && content.includes('\n') && !content.includes('<html');
          
          if (attempt.looksLikeCSV) {
            diagnostics.workingUrl = csvUrl;
            diagnostics.csvPreview = content.substring(0, 500);
          }
        }
        
        diagnostics.attempts.push(attempt);
        
      } catch (error: any) {
        diagnostics.attempts.push({
          url: csvUrl,
          error: error.message,
        });
      }
    }

    // Test the main shared view page
    try {
      const htmlResponse = await fetch(viewableLink, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        }
      });
      
      diagnostics.mainPage = {
        status: htmlResponse.status,
        contentType: htmlResponse.headers.get('content-type'),
      };

      if (htmlResponse.ok) {
        const htmlContent = await htmlResponse.text();
        diagnostics.mainPage.contentLength = htmlContent.length;
        diagnostics.mainPage.containsAirtable = htmlContent.includes('Airtable');
        diagnostics.mainPage.title = htmlContent.match(/<title>(.*?)<\/title>/)?.[1] || 'No title found';
        
        // Look for CSV download links or buttons
        const csvLinks = htmlContent.match(/href="[^"]*csv[^"]*"/gi) || [];
        diagnostics.mainPage.csvLinksFound = csvLinks;
        
        // Check for data export mentions
        diagnostics.mainPage.hasDownloadButton = htmlContent.includes('download') || htmlContent.includes('export');
        diagnostics.mainPage.hasCSVMention = htmlContent.toLowerCase().includes('csv');
      }
      
    } catch (error: any) {
      diagnostics.mainPage = { error: error.message };
    }

    return NextResponse.json(diagnostics);

  } catch (error: any) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      { error: 'Debug failed', details: error.message },
      { status: 500 }
    );
  }
}