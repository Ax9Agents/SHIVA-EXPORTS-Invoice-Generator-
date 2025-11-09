import { NextRequest, NextResponse } from 'next/server';
import { extractDataFromText } from '@/lib/ai/text-extractor';
import { enrichItemWithAI } from '@/lib/ai/item-enrichment';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    console.log('Extracting data from text input...');

    const result = await extractDataFromText(text);

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to extract data from text' },
        { status: 400 }
      );
    }

    // Auto-enrich items with AI-generated batch/mfg/exp/botanical data
    if (result.items && result.items.length > 0) {
      console.log('🤖 Auto-enriching items with AI-generated details...');
      
      result.items = await Promise.all(
        result.items.map(async (item, index) => {
          try {
            // Only enrich if these fields are missing
            if (!item.batchNumber || !item.mfgDate || !item.expDate || !item.botanicalName) {
              console.log(`Enriching item ${index + 1}: ${item.description}`);
              
              const enrichment = await enrichItemWithAI(item.description, 'essential oil');
              
              return {
                ...item,
                batchNumber: item.batchNumber || enrichment.batchNumber,
                mfgDate: item.mfgDate || enrichment.mfgDate,
                expDate: item.expDate || enrichment.expDate,
                botanicalName: item.botanicalName || enrichment.botanicalName,
              };
            }
            return item;
          } catch (error) {
            console.error(`Failed to enrich ${item.description}:`, error);
            // Return item with fallback values if enrichment fails
            return {
              ...item,
              batchNumber: item.batchNumber || 'N/A',
              mfgDate: item.mfgDate || '',
              expDate: item.expDate || '',
              botanicalName: item.botanicalName || item.description,
            };
          }
        })
      );
      
      console.log('✅ All items enriched successfully');
    }

    console.log('Successfully extracted data from text');

    return NextResponse.json({
      success: true,
      data: result,
    });

  } catch (error) {
    const err = error as Error;
    console.error('Text extraction error:', err);
    return NextResponse.json(
      { 
        success: false,
        error: err.message || 'Failed to extract data from text' 
      },
      { status: 500 }
    );
  }
}

