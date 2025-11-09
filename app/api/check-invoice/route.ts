import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const invoiceNumber = searchParams.get('invoiceNumber');
    
    if (!userId || !invoiceNumber) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }
    
    const { data, error } = await supabaseAdmin
      .from('invoices')
      .select('id')
      .eq('user_id', userId)
      .eq('invoice_number', invoiceNumber)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      isUnique: !data, // If no data found, invoice number is unique
    });
    
  } catch (error) {
    const err = error as Error;
    console.error('Check invoice error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to check invoice number' },
      { status: 500 }
    );
  }
}
