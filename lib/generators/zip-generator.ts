import archiver from 'archiver';

export interface FileToZip {
  filename: string;
  buffer: Buffer;
}

export async function generateZipFile(files: FileToZip[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    archive.on('data', (data: Buffer) => {
      chunks.push(data);
    });

    archive.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    archive.on('error', (err) => {
      reject(err);
    });

    files.forEach((file) => {
      archive.append(file.buffer, { name: file.filename });
    });

    archive.finalize();
  });
}
