import { NextResponse } from 'next/server';
import { checkSessionValid, launchInteractiveLogin } from '@/lib/automation';
import { getVault } from '@/lib/db';
import { errorMessage } from '@/lib/errors';

export async function GET() {
  const vault = getVault();
  const isValid = await checkSessionValid();
  return NextResponse.json({
    success: true,
    isLoggedIn: isValid,
    updatedAt: vault.session.updatedAt
  });
}

export async function POST() {
  try {
    const result = await launchInteractiveLogin();
    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json({
      success: false,
      message: errorMessage(err) || '인터랙티브 로그인 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
