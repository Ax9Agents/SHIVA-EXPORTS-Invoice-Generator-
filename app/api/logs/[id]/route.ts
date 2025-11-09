import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // params is now a Promise
) {
  try {
    const { id } = await params;  // Await params
    const body = await request.json();
    const { userId } = body;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify the invoice belongs to the user
    const { data: invoice, error: fetchError } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    
    if (fetchError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found or unauthorized' },
        { status: 404 }
      );
    }
    
    // Delete the invoice
    const { error: deleteError } = await supabaseAdmin
      .from('invoices')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (deleteError) {
      throw deleteError;
    }
    
    return NextResponse.json({
      success: true,
      message: 'Invoice deleted successfully'
    });
    
  } catch (error) {
    const err = error as Error;
    console.error('Delete invoice error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to delete invoice' },
      { status: 500 }
    );
  }
}
