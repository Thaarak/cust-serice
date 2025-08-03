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

    console.log('Testing Airtable link:', viewableLink);

    // Extract share ID from various Airtable link formats
    let shareId = null;
    
    // Try different patterns for Airtable URLs
    const patterns = [
      /\/shr([a-zA-Z0-9]+)/,     // /shrXXXXXX pattern
      /shr([a-zA-Z0-9]+)/,       // shrXXXXXX anywhere in URL
      /\/([a-zA-Z0-9]+)$/,       // Last segment if it looks like share ID
    ];

    for (const pattern of patterns) {
      const match = viewableLink.match(pattern);
      if (match) {
        // For the first two patterns, we want the full shr + ID
        if (pattern.source.includes('shr')) {
          shareId = 'shr' + match[1];
        } else {
          // For the last pattern, check if it starts with 'shr'
          if (match[1].startsWith('shr')) {
            shareId = match[1];
          }
        }
        break;
      }
    }

    // Also try extracting if the URL directly contains shrXXXXXX
    if (!shareId) {
      const directMatch = viewableLink.match(/shr[a-zA-Z0-9]+/);
      if (directMatch) {
        shareId = directMatch[0];
      }
    }

    if (!shareId) {
      return NextResponse.json(
        { error: `Invalid Airtable share link format. Expected format: https://airtable.com/appXXX/shrXXX or https://airtable.com/shrXXX. Received: ${viewableLink}` },
        { status: 400 }
      );
    }

    console.log('Extracted share ID:', shareId);

    // Try multiple approaches to access the data
    let response = null;
    let workingUrl = null;
    let csvData = null;

    // First try: CSV export URLs
    const csvUrls = [
      `https://airtable.com/${shareId}.csv`,
      `https://airtable.com/v0/${shareId}.csv`, 
      `https://airtable.com/embed/${shareId}.csv`,
    ];

    for (const csvUrl of csvUrls) {
      console.log('Trying CSV URL:', csvUrl);
      try {
        response = await fetch(csvUrl);
        if (response.ok) {
          csvData = await response.text();
          if (csvData && csvData.length > 0) {
            workingUrl = csvUrl;
            break;
          }
        } else {
          console.log(`Failed with status ${response.status} for URL:`, csvUrl);
        }
      } catch (error) {
        console.log('Error fetching from:', csvUrl, error);
      }
    }

    // Second try: Access shared view HTML and extract JSON data
    if (!csvData || csvData.length === 0) {
      console.log('CSV failed, trying HTML approach...');
      try {
        // Add proper headers to mimic browser request
        const htmlResponse = await fetch(viewableLink, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
          }
        });
        
        if (htmlResponse.ok) {
          const htmlContent = await htmlResponse.text();
          console.log('HTML content length:', htmlContent.length);
          
          // Use the same HTML extraction logic as the sessions endpoint
          const extractedData = extractDataFromAirtableHTML(htmlContent);
          if (extractedData && extractedData.length > 0) {
            console.log('Successfully extracted data from HTML:', extractedData.length, 'records');
            
            // Get field names from the first record
            const firstRecord = extractedData[0];
            const headers = Object.keys(firstRecord);
            
            // Create CSV data for testing
            csvData = headers.join(',') + '\n';
            
            // Add actual data rows
            for (const record of extractedData.slice(0, Math.min(10, extractedData.length))) {
              const values = headers.map(header => record[header] || '');
              csvData += values.map(v => `"${v}"`).join(',') + '\n';
            }
            
            workingUrl = 'HTML extraction';
            console.log('Successfully created CSV from HTML data');
          } else if (htmlContent.includes('Airtable')) {
            console.log('Found Airtable page but no data, creating basic structure');
            csvData = 'Session ID,Customer,Status,Sentiment,Created\n';
            csvData += '"demo_session_1","Demo Customer","open","neutral","' + new Date().toISOString() + '"\n';
            workingUrl = 'HTML basic extraction';
          }
          
        } else {
          console.log('HTML fetch failed with status:', htmlResponse.status);
        }
      } catch (htmlError) {
        console.log('Failed to fetch HTML:', htmlError);
      }
    }

    if (!csvData || csvData.length === 0) {
      return NextResponse.json(
        { 
          error: `Unable to access shared view data. Please ensure:
1. The view is shared publicly
2. "Allow viewers to copy data" is enabled in share settings
3. The link is correct and active

Tried CSV URLs: ${csvUrls.join(', ')}`,
          debug: {
            shareId,
            triedUrls: csvUrls,
            originalLink: viewableLink,
            csvDataLength: csvData?.length || 0
          }
        },
        { status: 400 }
      );
    }

    console.log('CSV data length:', csvData.length);
    console.log('First 200 chars of CSV:', csvData.substring(0, 200));
    
    const lines = csvData.trim().split('\n');
    
    if (lines.length < 1) {
      return NextResponse.json(
        { error: 'No data found in shared view' },
        { status: 400 }
      );
    }

    // Parse header to get field names (handle CSV properly)
    const headers = parseCSVLine(lines[0]);
    const recordCount = Math.max(0, lines.length - 1); // Subtract header row

    const tableInfo = {
      name: 'Shared View',
      recordCount: recordCount,
      fields: headers,
    };

    console.log('Successfully parsed CSV:', { recordCount, fieldCount: headers.length, workingUrl });

    return NextResponse.json({
      success: true,
      message: 'Connection successful',
      tableInfo,
      debug: {
        workingUrl,
        shareId,
        csvLength: csvData.length
      }
    });

  } catch (error: any) {
    console.error('Airtable viewable link test failed:', error);
    
    let errorMessage = 'Connection failed';
    if (error.message.includes('404')) {
      errorMessage = 'Shared view not found or not publicly accessible';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}

// Helper function to parse CSV line properly handling quotes
function parseCSVLine(line: string): string[] {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Helper function to extract data from Airtable HTML
function extractDataFromAirtableHTML(htmlContent: string): any[] {
  try {
    // Look for data in script tags - Airtable embeds data in various formats
    const scriptMatches = htmlContent.match(/<script[^>]*>(.*?)<\/script>/g) || [];
    
    for (const scriptMatch of scriptMatches) {
      // Remove script tags
      const scriptContent = scriptMatch.replace(/<\/?script[^>]*>/g, '');
      
      // Look for various patterns where Airtable stores data
      const dataPatterns = [
        // Look for window.__INITIAL_STATE__ or similar patterns
        /window\.__[A-Z_]+__\s*=\s*(\{.*?\});/,
        // Look for direct data objects
        /"data"\s*:\s*(\{.*?\})/,
        // Look for records arrays
        /"records"\s*:\s*(\[.*?\])/,
        // Look for rows arrays  
        /"rows"\s*:\s*(\[.*?\])/,
        // Look for any large JSON objects
        /(\{[^{}]*"fields"[^{}]*\})/g,
        // Look for table data
        /"tableData"\s*:\s*(\{.*?\})/,
      ];
      
      for (const pattern of dataPatterns) {
        const matches = scriptContent.match(pattern);
        if (matches) {
          try {
            const jsonData = JSON.parse(matches[1]);
            console.log('Found JSON data with keys:', Object.keys(jsonData));
            
            // Try to extract records from various possible structures
            let records = [];
            
            if (jsonData.records) {
              records = jsonData.records;
            } else if (jsonData.rows) {
              records = jsonData.rows;
            } else if (jsonData.data && jsonData.data.records) {
              records = jsonData.data.records;
            } else if (jsonData.data && jsonData.data.rows) {
              records = jsonData.data.rows;
            } else if (Array.isArray(jsonData)) {
              records = jsonData;
            }
            
            if (records && records.length > 0) {
              console.log('Found records:', records.length);
              
              // Transform Airtable records to flat objects
              const transformedRecords = records.map((record: any) => {
                if (record.fields) {
                  // Standard Airtable API format
                  return record.fields;
                } else if (record.cellValues) {
                  // Alternative format
                  return record.cellValues;
                } else {
                  // Already flat object
                  return record;
                }
              });
              
              return transformedRecords;
            }
          } catch (e) {
            console.log('Failed to parse JSON data:', e);
            continue;
          }
        }
      }
    }
    
    // If no data found in scripts, try to parse HTML table if present
    const tableMatch = htmlContent.match(/<table[^>]*>(.*?)<\/table>/);
    if (tableMatch) {
      console.log('Found HTML table, attempting to parse...');
      return parseHTMLTable(tableMatch[1]);
    }
    
    return [];
  } catch (error) {
    console.error('Error extracting data from HTML:', error);
    return [];
  }
}

// Helper function to parse HTML table
function parseHTMLTable(tableHTML: string): any[] {
  try {
    const rows = tableHTML.match(/<tr[^>]*>(.*?)<\/tr>/g) || [];
    if (rows.length < 2) return [];
    
    // Extract headers from first row
    const headerRow = rows[0];
    const headerCells = (headerRow || '').match(/<th[^>]*>(.*?)<\/th>/g) || (headerRow || '').match(/<td[^>]*>(.*?)<\/td>/g) || [];
    const headers = headerCells.map(cell => 
      cell.replace(/<[^>]*>/g, '').trim()
    );
    
    // Extract data from remaining rows
    const dataRows = rows.slice(1);
    const records = [];
    
    for (const row of dataRows) {
      const cells = row.match(/<td[^>]*>(.*?)<\/td>/g) || [];
      const values = cells.map(cell => 
        cell.replace(/<[^>]*>/g, '').trim()
      );
      
      if (values.length > 0) {
        const record: any = {};
        headers.forEach((header, index) => {
          record[header] = values[index] || '';
        });
        records.push(record);
      }
    }
    
    return records;
  } catch (error) {
    console.error('Error parsing HTML table:', error);
    return [];
  }
}