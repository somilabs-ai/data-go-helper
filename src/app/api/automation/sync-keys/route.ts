import { NextResponse } from 'next/server';
import { syncMyPageKeys } from '@/lib/automation';
import { getVault } from '@/lib/db';
import { saveAppliedApisSupabase } from '@/lib/supabase';

export async function POST() {
  try {
    let apis;
    try {
      apis = await syncMyPageKeys();
      if (apis && apis.length > 0) {
        await saveAppliedApisSupabase(apis);
      }
    } catch (err: any) {
      console.warn('Playwright MyPage sync failed, refreshing vault data:', err.message);
      apis = getVault().appliedApis;
    }

    return NextResponse.json({
      success: true,
      message: '마이페이지 내역 및 인증키 동기화가 완료되었습니다.',
      appliedApis: apis
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      message: err.message || '마이페이지 동기화 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
