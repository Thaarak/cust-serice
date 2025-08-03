import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { viewableLink } = await request.json();

    if (!viewableLink) {
      return NextResponse.json({ error: 'Missing viewableLink' }, { status: 400 });
    }

    console.log('Testing API extraction for:', viewableLink);

    // Fetch the HTML page
    const htmlResponse = await fetch(viewableLink, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      }
    });

    if (!htmlResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch HTML' }, { status: 400 });
    }

    const htmlContent = await htmlResponse.text();
    
    // Extract the API URL
    const apiUrlMatch = htmlContent.match(/urlWithParams:\s*"([^"]+)"/);
    if (!apiUrlMatch) {
      return NextResponse.json({ error: 'No API URL found in HTML' }, { status: 400 });
    }

    const apiPath = apiUrlMatch[1].replace(/\\u002F/g, '/');
    const fullApiUrl = `https://airtable.com${apiPath}`;
    
    console.log('Found API URL:', fullApiUrl);

    // Try to call the API
    const apiResponse = await fetch(fullApiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': viewableLink,
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
        'x-time-zone': 'UTC',
      }
    });

    const apiResult = {
      apiUrl: fullApiUrl,
      status: apiResponse.status,
      statusText: apiResponse.statusText,
      headers: Object.fromEntries(apiResponse.headers.entries()),
    };

    if (apiResponse.ok) {
      const apiData = await apiResponse.text();
      apiResult.responseLength = apiData.length;
      apiResult.contentPreview = apiData.substring(0, 500);
      
      try {
        const jsonData = JSON.parse(apiData);
        apiResult.isValidJson = true;
        apiResult.jsonKeys = Object.keys(jsonData);
        apiResult.hasData = !!(jsonData.data || jsonData.tables || jsonData.rows);
      } catch (e) {
        apiResult.isValidJson = false;
        apiResult.parseError = e.message;
      }
    } else {
      const errorText = await apiResponse.text();
      apiResult.errorContent = errorText.substring(0, 500);
    }

    return NextResponse.json({
      success: true,
      result: apiResult
    });

  } catch (error: any) {
    console.error('Test API extraction error:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error.message },
      { status: 500 }
    );
  }
}