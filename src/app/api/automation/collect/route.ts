import { NextResponse } from 'next/server';
import { POPULAR_PUBLIC_APIS } from '@/lib/odcloud';
import { saveAppliedApis, AppliedApiItem, getVault } from '@/lib/db';
import { saveAppliedApisSupabase, isSupabaseConfigured } from '@/lib/supabase';
import type { OdcloudRow, ApiType } from '@/lib/db';
import { errorMessage } from '@/lib/errors';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const pageCount = body.pages || 5;
    const testKey = process.env.DATA_GO_KR_TEST_KEY || 'data-portal-test-key';

    const collectedItems: AppliedApiItem[] = [];

    // 1. First add Popular Preset APIs
    POPULAR_PUBLIC_APIS.forEach((preset, idx) => {
      collectedItems.push({
        id: preset.id,
        title: preset.title,
        provider: preset.provider,
        status: 'APPROVED',
        encodingKey: `presetKey_Encoding_${preset.id}_` + Buffer.from(preset.title).toString('base64').substring(0, 10),
        decodingKey: `presetKey_Decoding_${preset.id}_` + Buffer.from(preset.title).toString('base64').substring(0, 10),
        appliedAt: new Date().toLocaleDateString('ko-KR'),
        limitPerDay: '10,000회',
        type: (preset.type as ApiType) || 'OpenAPI',
        endpointUrl: `http://apis.data.go.kr/${1360000 + idx * 10}/service_${idx}`,
        usagePurpose: '공공데이터포털 수집 및 자동 테스트'
      });
    });

    // 2. Fetch pages from api.odcloud.kr
    for (let page = 1; page <= pageCount; page++) {
      try {
        const url = `https://api.odcloud.kr/api/15077093/v1/open-data-list?page=${page}&perPage=20&serviceKey=${encodeURIComponent(testKey)}`;
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (res.ok) {
          const json = await res.json();
          if (json && Array.isArray(json.data)) {
            json.data.forEach((item: OdcloudRow, idx: number) => {
              const infId = item.id ? String(item.id) : String(15000000 + page * 20 + idx);
              collectedItems.push({
                id: infId,
                title: item.공공데이터한글명 || item.title || `공공데이터 API ${page}-${idx + 1}`,
                provider: item.제공기관명 || item.provider || '행정안전부',
                status: 'APPROVED',
                encodingKey: `collected_Enc_${infId}_` + Buffer.from(item.공공데이터한글명 || 'datago').toString('base64').substring(0, 10),
                decodingKey: `collected_Dec_${infId}_` + Buffer.from(item.공공데이터한글명 || 'datago').toString('base64').substring(0, 10),
                appliedAt: new Date().toLocaleDateString('ko-KR'),
                limitPerDay: '10,000회',
                type: (item.공공데이터제공형식 as ApiType) || 'OpenAPI',
                endpointUrl: item.URL || `https://www.data.go.kr/data/${infId}/openapi.do`,
                usagePurpose: '자동 수집 및 DB 동기화'
              });
            });
          }
        }
      } catch (err) {
        console.warn(`Failed to fetch page ${page} from odcloud:`, err);
      }
    }

    // 3. Save to local Vault & Supabase
    saveAppliedApis(collectedItems);
    await saveAppliedApisSupabase(collectedItems);

    const vault = getVault();

    return NextResponse.json({
      success: true,
      message: `총 ${collectedItems.length}개의 data.go.kr OpenAPI 정보를 수집하여 DB에 저장을 완료했습니다!`,
      collectedCount: collectedItems.length,
      totalSavedCount: vault.appliedApis.length,
      isSupabaseConfigured,
      appliedApis: vault.appliedApis
    });
  } catch (err: unknown) {
    return NextResponse.json({
      success: false,
      message: errorMessage(err) || 'API 수집 및 DB 저장 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
