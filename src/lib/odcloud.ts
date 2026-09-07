import type { OdcloudRow, ApiType } from './db';
export interface OpenDataApiMetadata {
  id: string; // infId or dataset id
  title: string;
  provider: string;
  type: string;
  description: string;
  modifiedAt: string;
  url: string;
  category: string;
  downloads?: number;
}

// Popular public API presets for quick testing
export const POPULAR_PUBLIC_APIS: OpenDataApiMetadata[] = [
  {
    id: "15084084",
    title: "기상청_단기예보 ((구)동네예보) 조회서비스",
    provider: "기상청",
    type: "OpenAPI",
    description: "단기예보(초단기실황, 초단기예보, 단기예보) 조회 서비스입니다.",
    modifiedAt: "2026-07-20",
    url: "https://www.data.go.kr/data/15084084/openapi.do",
    category: "재난안전"
  },
  {
    id: "15057739",
    title: "국토교통부_아파트매매 실거래자료",
    provider: "국토교통부",
    type: "OpenAPI",
    description: "국토교통부에서 제공하는 아파트 매매 실거래 내역 조회 서비스입니다.",
    modifiedAt: "2026-08-01",
    url: "https://www.data.go.kr/data/15057739/openapi.do",
    category: "국토관리"
  },
  {
    id: "15000123",
    title: "한국전력공사_전력소비량 및 고객 통계",
    provider: "한국전력공사",
    type: "OpenAPI",
    description: "지역별, 업종별 전력 사용량 및 고객수 통계 정보 API입니다.",
    modifiedAt: "2026-06-15",
    url: "https://www.data.go.kr/data/15000123/openapi.do",
    category: "산업통상"
  },
  {
    id: "15081808",
    title: "소상공인시장진흥공단_상권정보",
    provider: "소상공인시장진흥공단",
    type: "OpenAPI",
    description: "전국 상가업소 정보 및 주요 상권 업종 분포 정보를 제공합니다.",
    modifiedAt: "2026-07-10",
    url: "https://www.data.go.kr/data/15081808/openapi.do",
    category: "소상공인"
  },
  {
    id: "15000532",
    title: "한국도로공사_고속도로 교통자료",
    provider: "한국도로공사",
    type: "OpenAPI",
    description: "고속도로 구간별 교통량, 소요시간 및 실시간 소통상황 정보를 제공합니다.",
    modifiedAt: "2026-08-05",
    url: "https://www.data.go.kr/data/15000532/openapi.do",
    category: "수송교통"
  },
  {
    id: "15000211",
    title: "국민건강보험공단_건강검진정보",
    provider: "국민건강보험공단",
    type: "OpenAPI",
    description: "연령별, 성별 건강검진 측정항목 통계 및 결과 데이터 API입니다.",
    modifiedAt: "2026-05-30",
    url: "https://www.data.go.kr/data/15000211/openapi.do",
    category: "보건의료"
  }
];

export async function searchOpenDataApis(keyword: string = '', category: string = 'ALL', page: number = 1, perPage: number = 10): Promise<{ data: OpenDataApiMetadata[]; total: number }> {
  try {
    const testKey = process.env.DATA_GO_KR_TEST_KEY || 'data-portal-test-key';
    const url = `https://api.odcloud.kr/api/15077093/v1/open-data-list?page=${page}&perPage=${perPage}&serviceKey=${encodeURIComponent(testKey)}`;
    
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (response.ok) {
      const resJson = await response.json();
      if (resJson && Array.isArray(resJson.data)) {
        const seenIds = new Set<string>();
        let items: OpenDataApiMetadata[] = resJson.data.map((item: OdcloudRow, idx: number) => {
          const rawId = item.id || item.공공데이터한글명 || `item_${idx}`;
          let uniqueId = String(rawId);
          if (seenIds.has(uniqueId)) {
            uniqueId = `${rawId}_p${page}_${idx}`;
          }
          seenIds.add(uniqueId);

          return {
            id: uniqueId,
            title: item.공공데이터한글명 || item.title || '공공데이터 API',
            provider: item.제공기관명 || item.provider || '공공기관',
            type: item.공공데이터제공형식 || 'OpenAPI',
            description: item.공공데이터설명 || item.description || '공공데이터포털 등록 OpenAPI 서비스',
            modifiedAt: item.수정일자 || '2026-08-01',
            url: item.URL || `https://www.data.go.kr/data/${15000000 + idx}/openapi.do`,
            category: item.분류체계 || '일반공공행정'
          };
        });

        if (keyword.trim()) {
          const k = keyword.toLowerCase();
          items = items.filter(i => i.title.toLowerCase().includes(k) || i.provider.toLowerCase().includes(k) || i.description.toLowerCase().includes(k));
        }

        if (category !== 'ALL') {
          items = items.filter(i => i.category === category || i.provider.includes(category));
        }

        return { data: items, total: items.length };
      }
    }
  } catch (err) {
    console.warn('Odcloud API fetch failed, falling back to preset data:', err);
  }

  // Fallback filtering on POPULAR_PUBLIC_APIS
  let filtered = [...POPULAR_PUBLIC_APIS];
  if (keyword.trim()) {
    const k = keyword.toLowerCase();
    filtered = filtered.filter(i => i.title.toLowerCase().includes(k) || i.provider.toLowerCase().includes(k) || i.description.toLowerCase().includes(k));
  }
  if (category !== 'ALL') {
    filtered = filtered.filter(i => i.category === category);
  }

  return { data: filtered, total: filtered.length };
}
