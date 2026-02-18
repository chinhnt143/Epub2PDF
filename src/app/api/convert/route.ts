import { NextRequest, NextResponse } from 'next/server';
import { ConverterEngine } from '../../../lib/converter/engine';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { Buffer } from 'buffer';

export const maxDuration = 60; // Set max duration for serverless functions (if applicable)

// Helper to write ArrayBuffer to disk
async function saveFile(file: File, destPath: string) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await fs.writeFile(destPath, buffer);
}

// Robust cleanup helper
async function cleanupTempFiles(paths: string[]) {
    await Promise.all(
        paths.map(async (p) => {
            try {
                if (p && await fs.pathExists(p)) {
                    await fs.remove(p);
                }
            } catch (e: any) {
                console.warn(`[Cleanup Warning] Failed to delete ${p}: ${e.message}`);
            }
        })
    );
}

export async function POST(req: NextRequest) {
  const requestId = uuidv4();
  // Create a unique temp directory for this request
  const tempDir = path.join(os.tmpdir(), 'epub-converter', requestId);
  const inputPath = path.join(tempDir, 'input.epub');
  const outputDir = path.join(tempDir, 'output');

  try {
    // 1. Validate Input
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.epub')) {
      return NextResponse.json({ error: 'Invalid file type. Please upload an EPUB.' }, { status: 400 });
    }

    // 2. Prepare Environment
    await fs.ensureDir(tempDir);
    await fs.ensureDir(outputDir);
    await saveFile(file, inputPath);

    // 3. Execute Server-Side Conversion Engine
    console.log(`[API] Starting conversion for ${requestId}`);
    const engine = new ConverterEngine();
    const result = await engine.convertEpubToPdf(inputPath, outputDir);

    // 4. Verify Output
    if (!await fs.pathExists(result.pdfPath)) {
        throw new Error("Conversion engine finished but output PDF is missing.");
    }
    const pdfBuffer = await fs.readFile(result.pdfPath);

    // 5. Cleanup
    await cleanupTempFiles([tempDir]);

    // 6. Return Stream
    const safeTitle = (result.title || 'converted_document').replace(/[^a-z0-9]/gi, '_').substring(0, 50);
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeTitle}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error: any) {
    console.error('[API] Fatal Error:', error);
    
    // Cleanup on error
    await cleanupTempFiles([tempDir]);

    return NextResponse.json(
      { error: error.message || 'Internal Server Error during conversion.' },
      { status: 500 }
    );
  }
}