import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const fieldName = searchParams.get('fieldName');
    const query = searchParams.get('query') || '';

    if (!userId || !fieldName) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Search for autofill suggestions
    const { data, error } = await supabaseAdmin
      .from('autofill_data')
      .select('*')
      .eq('user_id', userId)
      .eq('field_name', fieldName)
      .ilike('field_value', `%${query}%`)
      .order('usage_count', { ascending: false })
      .order('last_used', { ascending: false })
      .limit(5);

    if (error) {
      throw error;
    }

    // Format suggestions with related data
    const suggestions = data.map(item => ({
      value: item.field_value,
      relatedData: item.metadata || {},
      usageCount: item.usage_count,
      lastUsed: item.last_used,
    }));

    return NextResponse.json({
      success: true,
      suggestions
    });

  } catch (error) {
    const err = error as Error;
    console.error('Autofill error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch autofill suggestions' },
      { status: 500 }
    );
  }
}
