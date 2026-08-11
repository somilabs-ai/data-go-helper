import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { endpointUrl, apiKey, keyType = 'encoding', params = {} } = body;

    if (!endpointUrl) {
      return NextResponse.json({ success: false, message: '엔드포인트 URL이 없습니다.' }, { status: 400 });
    }

    // Build URL with serviceKey
    const url = new URL(endpointUrl);
    
    // Attach params
    Object.keys(params).forEach(key => {
      if (params[key]) {
        url.searchParams.set(key, params[key]);
      }
    });

    // Attach serviceKey if provided
    let targetUrl = url.toString();
    if (apiKey) {
      if (keyType === 'decoding') {
        url.searchParams.set('serviceKey', apiKey);
        targetUrl = url.toString();
      } else {
        // Encoding key is already URL-encoded, append raw
        const separator = url.search ? '&' : '?';
        targetUrl = url.toString() + `${separator}serviceKey=${apiKey}`;
      }
    }

    console.log('Proxying request to:', targetUrl);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        'Accept': 'application/json, application/xml, text/xml, */*'
      },
      next: { revalidate: 0 }
    });

    const contentType = response.headers.get('content-type') || '';
    const responseText = await response.text();

    return NextResponse.json({
      success: true,
      status: response.status,
      statusText: response.statusText,
      contentType,
      url: targetUrl,
      data: responseText
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      message: `CORS 프록시 요청 실패: ${err.message}`
    }, { status: 500 });
  }
}
