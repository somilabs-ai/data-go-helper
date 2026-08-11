import { NextResponse } from 'next/server';
import { searchOpenDataApis, POPULAR_PUBLIC_APIS } from '@/lib/odcloud';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('q') || '';
  const category = searchParams.get('category') || 'ALL';
  const page = parseInt(searchParams.get('page') || '1');

  const result = await searchOpenDataApis(keyword, category, page, 10);
  return NextResponse.json({
    success: true,
    data: result.data,
    total: result.total,
    presets: POPULAR_PUBLIC_APIS
  });
}
