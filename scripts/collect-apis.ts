import { POPULAR_PUBLIC_APIS } from '../src/lib/odcloud';
import { saveAppliedApis, AppliedApiItem, getVault } from '../src/lib/db';
import { saveAppliedApisSupabase, isSupabaseConfigured } from '../src/lib/supabase';

async function main() {
  console.log('🚀 Data.go.kr Open API 데이터 수집 및 DB 저장 시작...');

  const collectedItems: AppliedApiItem[] = [];

  // 1. Preset Popular APIs
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
      type: (preset.type as any) || 'OpenAPI',
      endpointUrl: `http://apis.data.go.kr/${1360000 + idx * 10}/service_${idx}`,
      usagePurpose: '공공데이터포털 수집 및 자동 테스트'
    });
  });

  // 2. Fetch from odcloud
  const pageCount = 5;
  const testKey = process.env.DATA_GO_KR_TEST_KEY || 'data-portal-test-key';

  for (let page = 1; page <= pageCount; page++) {
    try {
      const url = `https://api.odcloud.kr/api/15077093/v1/open-data-list?page=${page}&perPage=20&serviceKey=${encodeURIComponent(testKey)}`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.data)) {
          json.data.forEach((item: any, idx: number) => {
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
              type: (item.공공데이터제공형식 as any) || 'OpenAPI',
              endpointUrl: item.URL || `https://www.data.go.kr/data/${infId}/openapi.do`,
              usagePurpose: '자동 수집 및 DB 동기화'
            });
          });
          console.log(`✅ Page ${page} 수집 완료 (${json.data.length}개)`);
        }
      }
    } catch (err: any) {
      console.warn(`⚠️ Page ${page} 수집 건너뜀: ${err.message}`);
    }
  }

  // Save to DB
  saveAppliedApis(collectedItems);
  await saveAppliedApisSupabase(collectedItems);

  const vault = getVault();
  console.log(`🎉 성공! 총 ${collectedItems.length}개 수집 완료. DB 저장 총 수: ${vault.appliedApis.length}개 (Supabase 연동 여부: ${isSupabaseConfigured})`);
}

main().catch(console.error);
