import { createClient } from '@supabase/supabase-js';
import { AppliedApiItem, ApiType, StoredSession, VaultData, getVault, saveVault } from './db';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured =
  supabaseUrl.length > 0 &&
  !supabaseUrl.includes('your-project-id') &&
  supabaseAnonKey.length > 0 &&
  !supabaseAnonKey.includes('your-anon-key');

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Table Names with Prefix (datago_)
const TABLE_APPLIED_APIS = 'datago_applied_apis';
const TABLE_CART = 'datago_cart';
const TABLE_SESSION = 'datago_session';

/**
 * Supabase 또는 Local Vault에서 Applied APIs 로드
 */
export async function loadAppliedApisSupabase(): Promise<AppliedApiItem[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from(TABLE_APPLIED_APIS)
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((row: AppliedApiRow) => ({
          id: row.id,
          title: row.title,
          provider: row.provider,
          status: row.status,
          encodingKey: row.encoding_key,
          decodingKey: row.decoding_key,
          appliedAt: row.applied_at,
          limitPerDay: row.limit_per_day,
          type: row.type,
          endpointUrl: row.endpoint_url,
          usagePurpose: row.usage_purpose,
          notes: row.notes
        }));
      }
    } catch (err) {
      console.warn('Supabase fetch applied apis failed, fallback to local vault:', err);
    }
  }

  return getVault().appliedApis;
}

/**
 * Supabase에 Applied APIs 업서트/저장
 */
export async function saveAppliedApisSupabase(items: AppliedApiItem[]): Promise<void> {
  // Always save to local vault first for offline/cache guarantee
  const vault = getVault();
  const map = new Map<string, AppliedApiItem>();
  for (const item of vault.appliedApis) map.set(item.id, item);
  for (const item of items) map.set(item.id, { ...map.get(item.id), ...item });
  vault.appliedApis = Array.from(map.values());
  saveVault(vault);

  if (isSupabaseConfigured && supabase) {
    try {
      const rows = items.map(item => ({
        id: item.id,
        title: item.title,
        provider: item.provider,
        status: item.status,
        encoding_key: item.encodingKey,
        decoding_key: item.decodingKey,
        applied_at: item.appliedAt,
        limit_per_day: item.limitPerDay,
        type: item.type || 'OpenAPI',
        endpoint_url: item.endpointUrl,
        usage_purpose: item.usagePurpose,
        notes: item.notes
      }));

      await supabase.from(TABLE_APPLIED_APIS).upsert(rows);
    } catch (e) {
      console.error('Supabase saveAppliedApis error:', e);
    }
  }
}

/**
 * Supabase Cart 로드
 */
export async function loadCartSupabase(): Promise<AppliedApiItem[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from(TABLE_CART)
        .select('*');

      if (!error && data) {
        return data.map((row: CartRow) => ({
          id: row.id,
          title: row.title,
          provider: row.provider,
          type: row.type,
          description: row.description,
          url: row.url,
          category: row.category,
          status: 'NOT_APPLIED'
        }));
      }
    } catch (e) {
      console.warn('Supabase loadCart error:', e);
    }
  }

  return getVault().cart;
}

/**
 * Supabase Cart 항목 추가/삭제
 */
export async function syncCartSupabase(cartItems: AppliedApiItem[]): Promise<void> {
  const vault = getVault();
  vault.cart = cartItems;
  saveVault(vault);

  if (isSupabaseConfigured && supabase) {
    try {
      // Clear existing cart in DB and insert new
      await supabase.from(TABLE_CART).delete().neq('id', 'dummy_never_matches');
      if (cartItems.length > 0) {
        const rows = cartItems.map(item => ({
          id: item.id,
          title: item.title,
          provider: item.provider,
          type: item.type,
          description: item.notes || item.title,
          endpoint_url: item.endpointUrl
        }));
        await supabase.from(TABLE_CART).insert(rows);
      }
    } catch (e) {
      console.error('Supabase syncCart error:', e);
    }
  }
}

/**
 * Supabase Session 저장
 */
export async function saveSessionSupabase(session: StoredSession): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from(TABLE_SESSION).upsert({
        id: 'primary',
        cookies: session.cookies,
        is_logged_in: session.isLoggedIn,
        user_id: session.userId || '',
        updated_at: session.updatedAt
      });
    } catch (e) {
      console.error('Supabase saveSession error:', e);
    }
  }
}

/**
 * SQL Schema 생성 스크립트 출력
 */
export function getSupabaseSqlSchema(): string {
  return `
-- datago_prefix Supabase Schema Migration Script
CREATE TABLE IF NOT EXISTS datago_applied_apis (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  provider TEXT,
  status TEXT DEFAULT 'APPROVED',
  encoding_key TEXT,
  decoding_key TEXT,
  applied_at TEXT,
  limit_per_day TEXT,
  type TEXT DEFAULT 'OpenAPI',
  endpoint_url TEXT,
  usage_purpose TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS datago_cart (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  provider TEXT,
  type TEXT,
  description TEXT,
  endpoint_url TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS datago_session (
  id TEXT PRIMARY KEY DEFAULT 'primary',
  cookies JSONB,
  is_logged_in BOOLEAN DEFAULT FALSE,
  user_id TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
  `.trim();
}

/** Supabase 테이블 행 — snake_case 컬럼을 그대로 받는다. */
interface AppliedApiRow {
  id: string;
  title: string;
  provider: string;
  status: AppliedApiItem['status'];
  encoding_key?: string;
  decoding_key?: string;
  applied_at?: string;
  limit_per_day?: string;
  type?: ApiType;
  endpoint_url?: string;
  usage_purpose?: string;
  notes?: string;
}

interface CartRow {
  id: string;
  title: string;
  provider: string;
  type?: ApiType;
  description?: string;
  url?: string;
  category?: string;
}
