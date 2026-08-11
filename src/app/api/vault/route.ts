import { NextResponse } from 'next/server';
import { getVault, addToCart, removeFromCart, clearCart, saveVault, AppliedApiItem } from '@/lib/db';
import { loadAppliedApisSupabase, saveAppliedApisSupabase, syncCartSupabase, isSupabaseConfigured } from '@/lib/supabase';

export async function GET() {
  const vault = getVault();
  // Try loading appliedApis from Supabase if configured
  if (isSupabaseConfigured) {
    const sbApis = await loadAppliedApisSupabase();
    if (sbApis && sbApis.length > 0) {
      vault.appliedApis = sbApis;
    }
  }

  return NextResponse.json({
    success: true,
    data: vault,
    isSupabaseConfigured
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { action, items, id, item } = body;
  const vault = getVault();

  if (action === 'ADD_CART') {
    const cart = addToCart(items || []);
    await syncCartSupabase(cart);
    return NextResponse.json({ success: true, cart });
  }

  if (action === 'REMOVE_CART') {
    const cart = removeFromCart(id);
    await syncCartSupabase(cart);
    return NextResponse.json({ success: true, cart });
  }

  if (action === 'CLEAR_CART') {
    clearCart();
    await syncCartSupabase([]);
    return NextResponse.json({ success: true, cart: [] });
  }

  if (action === 'ADD_APPLIED_MANUAL') {
    if (item) {
      const newItem: AppliedApiItem = {
        id: item.id || `manual_${Date.now()}`,
        title: item.title || '수동 등록 OpenAPI',
        provider: item.provider || '공공기관',
        status: 'APPROVED',
        encodingKey: item.encodingKey || '',
        decodingKey: item.decodingKey || '',
        endpointUrl: item.endpointUrl || '',
        appliedAt: new Date().toLocaleDateString('ko-KR')
      };
      await saveAppliedApisSupabase([newItem]);
    }
    return NextResponse.json({ success: true, appliedApis: getVault().appliedApis });
  }

  return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
}
