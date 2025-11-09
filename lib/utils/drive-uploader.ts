import { supabaseAdmin } from '../supabase/server';

export interface UploadResult {
  fileId: string;
  viewLink: string;
  downloadLink: string;
}

export async function uploadToDrive(
  fileBuffer: Buffer | Uint8Array,
  filename: string,
  mimeType: string,
  userId: string
): Promise<UploadResult> {
  try {
    // Convert to Buffer if it's Uint8Array
    const buffer = Buffer.isBuffer(fileBuffer) ? fileBuffer : Buffer.from(fileBuffer);
    
    // Generate unique filename with timestamp to avoid collisions
    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}_${filename}`;
    const filePath = `${userId}/${uniqueFilename}`;
    
    // Upload to Supabase Storage with upsert enabled
    const { data, error } = await supabaseAdmin.storage
      .from('invoices')
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true, // Allow overwriting existing files
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('invoices')
      .getPublicUrl(filePath);

    console.log('✅ File uploaded successfully:', filePath);

    return {
      fileId: data.path,
      viewLink: publicUrlData.publicUrl,
      downloadLink: publicUrlData.publicUrl,
    };
  } catch (error) {
    const err = error as Error;
    console.error('Upload error:', err);
    throw new Error(`Failed to upload file: ${err.message}`);
  }
}
