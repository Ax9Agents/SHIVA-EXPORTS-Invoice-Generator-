import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: data || {},
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, settings } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('user_settings')
      .upsert(
        {
          user_id: userId,
          exporter_name: settings.exporterName,
          exporter_address: settings.exporterAddress,
          exporter_phone: settings.exporterPhone,
          exporter_fax: settings.exporterFax,
          exporter_gstin: settings.exporterGSTIN,
          exporter_iec: settings.exporterIEC,
          exporter_bank: settings.exporterBank,
          exporter_account: settings.exporterAccount,
          ad_code: settings.adCode,
          exporter_arn_no: settings.exporterArnNo,
          country_origin: settings.countryOrigin,
          port_of_loading: settings.portOfLoading,
          terms_of_delivery: settings.termsOfDelivery,
          currency: settings.currency,
          exchange_rate: settings.exchangeRate,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
      data,
    });
  } catch (error) {
    console.error('Save settings error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
