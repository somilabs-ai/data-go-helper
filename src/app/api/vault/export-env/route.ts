import { NextResponse } from 'next/server';
import { getVault } from '@/lib/db';

export async function GET() {
  const vault = getVault();
  
  const envLines: string[] = [
    '# ========================================================',
    '# data.go.kr Public API Keys Export (.env)',
    '# Generated at: ' + new Date().toISOString(),
    '# ========================================================',
    ''
  ];

  vault.appliedApis.forEach((item, index) => {
    // Generate clean env variable keys
    const cleanTitle = item.title.replace(/[^a-zA-Z0-9가-힣]/g, '_').toUpperCase();
    const envKeyPrefix = `DATA_GO_KR_KEY_${index + 1}_${cleanTitle.substring(0, 20)}`;
    
    envLines.push(`# [${item.provider}] ${item.title}`);
    if (item.encodingKey) {
      envLines.push(`${envKeyPrefix}_ENCODING="${item.encodingKey}"`);
    }
    if (item.decodingKey) {
      envLines.push(`${envKeyPrefix}_DECODING="${item.decodingKey}"`);
    }
    if (item.endpointUrl) {
      envLines.push(`${envKeyPrefix}_ENDPOINT="${item.endpointUrl}"`);
    }
    envLines.push('');
  });

  const envContent = envLines.join('\n');

  return new Response(envContent, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': 'attachment; filename="data-go-kr-keys.env"'
    }
  });
}
