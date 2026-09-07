import fs from 'fs';
import path from 'path';

// Local storage paths
const DATA_DIR = path.join(process.cwd(), 'data');
const VAULT_FILE = path.join(DATA_DIR, 'vault.json');

/** Playwright 가 반환하는 쿠키(Cookie 타입과 호환되게 맞춘다). */
export interface BrowserCookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

export interface StoredSession {
  cookies: BrowserCookie[];
  updatedAt: string;
  isLoggedIn: boolean;
  userId?: string;
}

export interface AppliedApiItem {
  id: string; // e.g. "15084084" or infId
  title: string;
  provider: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'NOT_APPLIED';
  encodingKey?: string;
  decodingKey?: string;
  appliedAt?: string;
  limitPerDay?: string;
  type?: 'OpenAPI' | 'File' | 'Activity';
  endpointUrl?: string;
  usagePurpose?: string;
  notes?: string;
}

export interface ApplicationJob {
  jobId: string;
  infId: string;
  title: string;
  status: 'QUEUED' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'SKIPPED';
  message?: string;
  updatedAt: string;
}

export interface VaultData {
  session: StoredSession;
  appliedApis: AppliedApiItem[];
  cart: AppliedApiItem[];
  jobs: ApplicationJob[];
  settings: {
    autoSyncKeys: boolean;
    defaultUsagePurpose: string;
    headlessBrowser: boolean;
  };
}

const DEFAULT_VAULT: VaultData = {
  session: {
    cookies: [],
    updatedAt: new Date().toISOString(),
    isLoggedIn: false,
  },
  appliedApis: [
    {
      id: "15084084",
      title: "기상청_단기예보 ((구)동네예보) 조회서비스",
      provider: "기상청",
      status: "APPROVED",
      encodingKey: "sampleEncodingKeyDataGoKr1234567890%3D%3D",
      decodingKey: "sampleDecodingKeyDataGoKr1234567890==",
      appliedAt: "2026-08-01 14:20",
      limitPerDay: "10,000회",
      type: "OpenAPI",
      endpointUrl: "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0",
      usagePurpose: "연구 및 데이터 분석용 샘플"
    },
    {
      id: "15057739",
      title: "국토교통부_아파트매매 실거래자료",
      provider: "국토교통부",
      status: "APPROVED",
      encodingKey: "sampleEncodingKeyDataGoKr9876543210%3D%3D",
      decodingKey: "sampleDecodingKeyDataGoKr9876543210==",
      appliedAt: "2026-08-05 09:15",
      limitPerDay: "10,000회",
      type: "OpenAPI",
      endpointUrl: "http://openapi.molit.go.kr/OpenRT/RTMSDataSvcAptTradeDev",
      usagePurpose: "부동산 시장 분석 시스템 구축"
    }
  ],
  cart: [],
  jobs: [],
  settings: {
    autoSyncKeys: true,
    defaultUsagePurpose: "연구 및 데이터 분석, 서비스 개발 테스트",
    headlessBrowser: false
  }
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getVault(): VaultData {
  ensureDataDir();
  if (!fs.existsSync(VAULT_FILE)) {
    saveVault(DEFAULT_VAULT);
    return DEFAULT_VAULT;
  }
  try {
    const raw = fs.readFileSync(VAULT_FILE, 'utf-8');
    return JSON.parse(raw) as VaultData;
  } catch (e) {
    console.error('Failed to read vault file, initializing default:', e);
    saveVault(DEFAULT_VAULT);
    return DEFAULT_VAULT;
  }
}

export function saveVault(data: VaultData): void {
  ensureDataDir();
  fs.writeFileSync(VAULT_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export function updateSession(session: Partial<StoredSession>): StoredSession {
  const vault = getVault();
  vault.session = {
    ...vault.session,
    ...session,
    updatedAt: new Date().toISOString()
  };
  saveVault(vault);
  return vault.session;
}

export function addToCart(items: AppliedApiItem[]): AppliedApiItem[] {
  const vault = getVault();
  const existingIds = new Set(vault.cart.map(i => i.id));
  for (const item of items) {
    if (!existingIds.has(item.id)) {
      vault.cart.push(item);
    }
  }
  saveVault(vault);
  return vault.cart;
}

export function removeFromCart(id: string): AppliedApiItem[] {
  const vault = getVault();
  vault.cart = vault.cart.filter(i => i.id !== id);
  saveVault(vault);
  return vault.cart;
}

export function clearCart(): void {
  const vault = getVault();
  vault.cart = [];
  saveVault(vault);
}

export function saveAppliedApis(apis: AppliedApiItem[]): void {
  const vault = getVault();
  const map = new Map<string, AppliedApiItem>();
  for (const item of vault.appliedApis) {
    map.set(item.id, item);
  }
  for (const item of apis) {
    const prev = map.get(item.id);
    map.set(item.id, { ...prev, ...item });
  }
  vault.appliedApis = Array.from(map.values());
  saveVault(vault);
}

/** AppliedApiItem.type 의 유니온만 따로 쓴다. */
export type ApiType = NonNullable<AppliedApiItem['type']>;

/**
 * 공공데이터포털 odcloud API 가 돌려주는 행.
 * 외부 스키마라 모든 필드가 선택적이다 — 한글 키가 실제 응답 키다.
 */
export interface OdcloudRow {
  id?: string | number;
  title?: string;
  provider?: string;
  description?: string;
  URL?: string;
  공공데이터한글명?: string;
  공공데이터설명?: string;
  공공데이터제공형식?: string;
  제공기관명?: string;
  분류체계?: string;
  수정일자?: string;
}

/** 일괄 신청 요청 본문의 대상 항목. */
export interface TargetItem {
  id: string;
  title: string;
  provider?: string;
}
