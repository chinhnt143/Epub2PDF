import path from 'path';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import puppeteer, { Browser, Page } from 'puppeteer';
import { PDFDocument, PDFName, PDFRef, PDFString } from 'pdf-lib';
// @ts-ignore
import EPub from 'epub2';
import * as cheerio from 'cheerio';
import { Buffer } from 'buffer';
import { PRINT_STYLES } from './styles';
import { ConversionResult, ChapterInfo } from './types';

// Types representing the structure of the 'epub2' library instance
interface EpubFlowItem {
  id: string;
  title?: string;
  href: string;
}

interface EpubManifestItem {
  href: string;
}

interface EpubInstance {
  metadata: {
    title?: string;
    creator?: string;
  };
  flow: EpubFlowItem[];
  manifest: Record<string, EpubManifestItem>;
  getChapter(id: string, callback: (err: Error | null, text: string) => void): void;
  getImage(id: string, callback: (err: Error | null, data: Buffer, mimeType: string) => void): void;
}

// Helper to resolve paths within the EPUB structure
const resolveRelativePath = (baseHref: string, relativePath: string): string => {
  const stack = baseHref.split('/');
  stack.pop(); // Remove the current filename
  const parts = relativePath.split('/');
  for (const part of parts) {
    if (part === '.') continue;
    if (part === '..') stack.pop();
    else stack.push(part);
  }
  return stack.join('/');
};

export class ConverterEngine {
  private browser: Browser | null = null;
  
  async convertEpubToPdf(filePath: string, outputDir: string): Promise<ConversionResult> {
    // Note: We don't create a temp dir here for the engine itself, as we process in-memory 
    // or read directly from the file path provided by the API route.

    try {
      console.log(`[Converter] Starting conversion for: ${filePath}`);
      
      // 1. Parse EPUB
      // Casting to EpubInstance to ensure type safety in subsequent calls
      const epub = (await EPub.createAsync(filePath)) as EpubInstance;
      
      const title = epub.metadata.title || "Untitled";
      const author = epub.metadata.creator || "Unknown";
      
      console.log(`[Converter] Metadata: ${title} by ${author}`);

      // 2. Initialize Puppeteer
      // We use --no-sandbox to ensure compatibility with containerized environments (Docker/Cloud Run).
      // --disable-setuid-sandbox is often required alongside no-sandbox.
      // --font-render-hinting=none helps with consistent text rendering across systems.
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--font-render-hinting=none',
            '--disable-dev-shm-usage' // prevents crash on low memory docker containers
        ]
      });

      // 3. Create Master PDF Document using pdf-lib
      const masterPdfDoc = await PDFDocument.create();
      masterPdfDoc.setTitle(title);
      masterPdfDoc.setAuthor(author);
      masterPdfDoc.setCreator('AI-Enhanced EPUB Converter');

      // 4. Process Chapters
      const chapterInfos: ChapterInfo[] = [];
      let currentPageIndex = 0;

      console.log(`[Converter] Processing ${epub.flow.length} chapters...`);

      for (const chapterRef of epub.flow) {
        const chapterId = chapterRef.id;
        const chapterData = await this.processChapter(epub, chapterId);
        
        // Skip empty chapters
        if (!chapterData.html || !chapterData.html.trim()) continue;

        // Generate PDF for this chapter
        const chapterPdfBuffer = await this.renderHtmlToPdf(chapterData.html);
        
        // Merge into Master PDF
        // We load the chapter PDF and copy its pages into the master document
        const chapterDoc = await PDFDocument.load(chapterPdfBuffer);
        const copiedPages = await masterPdfDoc.copyPages(chapterDoc, chapterDoc.getPageIndices());
        
        // Record chapter start page for TOC/Bookmarks
        chapterInfos.push({
            id: chapterId,
            title: chapterRef.title || chapterData.title || `Chapter ${chapterInfos.length + 1}`,
            href: chapterRef.href,
            startPage: currentPageIndex
        });

        copiedPages.forEach(page => masterPdfDoc.addPage(page));
        currentPageIndex += copiedPages.length;
        
        console.log(`[Converter] Processed chapter: ${chapterInfos[chapterInfos.length - 1].title}`);
      }

      // 5. Build Outlines (Bookmarks)
      await this.addOutlines(masterPdfDoc, chapterInfos);

      // 6. Save Final PDF
      const outputFileName = `${uuidv4()}.pdf`;
      const outputPath = path.join(outputDir, outputFileName);
      
      // Ensure output directory exists before writing
      await fs.ensureDir(outputDir);
      
      const pdfBytes = await masterPdfDoc.save();
      await fs.writeFile(outputPath, pdfBytes);

      console.log(`[Converter] Finished. Saved to ${outputPath}`);

      return {
        pdfPath: outputPath,
        pageCount: currentPageIndex,
        title,
        author
      };

    } catch (error) {
      console.error("[Converter] Fatal error:", error);
      throw error;
    } finally {
      // Critical: Always close the browser to prevent zombie processes
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
    }
  }

  private async processChapter(epub: EpubInstance, chapterId: string): Promise<{ html: string, title?: string }> {
    return new Promise((resolve, reject) => {
      epub.getChapter(chapterId, async (err, text) => {
        if (err) return reject(err);

        const $ = cheerio.load(text);
        
        // 1. Extract Title if missing in spine
        const title = $('h1, h2').first().text();

        // 2. Embed Images as Base64
        // Puppeteer cannot access internal EPUB files easily (as they are inside the zip), 
        // so we must read them from the epub library and embed them directly into the HTML as Data URIs.
        const imagePromises: Promise<void>[] = [];
        
        $('img, image').each((_, element) => {
          const img = $(element);
          // Handle both src (img) and xlink:href (svg image)
          const rawSrc = img.attr('src') || img.attr('xlink:href');
          
          if (rawSrc && !rawSrc.startsWith('http') && !rawSrc.startsWith('data:')) {
             // Find the file in the manifest based on relative path
             const chapterHref = epub.flow.find((i) => i.id === chapterId)?.href;
             if (chapterHref) {
                const absolutePath = resolveRelativePath(chapterHref, rawSrc);
                
                // Find id in manifest by href match
                let imageId: string | null = null;
                for (const [key, val] of Object.entries(epub.manifest)) {
                    if (val.href === absolutePath) {
                        imageId = key;
                        break;
                    }
                }

                if (imageId) {
                    const p = new Promise<void>((res) => {
                        // @ts-ignore - getImage types are tricky in the lib
                        epub.getImage(imageId!, (err: any, data: Buffer, mimeType: string) => {
                            if (!err && data) {
                                if (img.prop('tagName').toLowerCase() === 'image') {
                                    img.attr('xlink:href', `data:${mimeType};base64,${data.toString('base64')}`);
                                } else {
                                    img.attr('src', `data:${mimeType};base64,${data.toString('base64')}`);
                                }
                            }
                            res();
                        });
                    });
                    imagePromises.push(p);
                }
             }
          }
        });

        await Promise.all(imagePromises);

        // 3. Inject CSS
        // We inject print-specific CSS to ensure the output PDF looks professional (A4, margins, typography)
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>${PRINT_STYLES}</style>
            </head>
            <body>
              ${$('body').html()}
            </body>
          </html>
        `;

        resolve({ html, title });
      });
    });
  }

  private async renderHtmlToPdf(html: string): Promise<Buffer> {
    if (!this.browser) throw new Error("Browser not initialized");
    
    const page = await this.browser.newPage();
    try {
      // waitUntil: 'networkidle0' is crucial. It tells Puppeteer to wait until there are no more than 0 network connections for at least 500ms.
      // This ensures that any external fonts or embedded resources are fully loaded before rendering.
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          bottom: '20mm',
          left: '20mm',
          right: '20mm'
        },
        printBackground: true, // Required to print CSS backgrounds/colors
        displayHeaderFooter: false
      });
      
      return Buffer.from(pdfBuffer);
    } finally {
      await page.close();
    }
  }

  /**
   * Adds a basic flat outline to the PDF
   */
  private async addOutlines(pdfDoc: PDFDocument, chapters: ChapterInfo[]) {
    // Basic low-level implementation for compatibility
    // Creates a root "Outlines" dictionary and links items
    
    const outlinesDictRef = pdfDoc.context.nextRef();
    const outlinesDict = pdfDoc.context.obj({
      Type: 'Outlines',
      Count: chapters.length,
    });
    
    // Create refs for all items first
    const itemRefs = chapters.map(() => pdfDoc.context.nextRef());
    
    if (chapters.length > 0) {
        outlinesDict.set(PDFName.of('First'), itemRefs[0]);
        outlinesDict.set(PDFName.of('Last'), itemRefs[chapters.length - 1]);
    }

    pdfDoc.catalog.set(PDFName.of('Outlines'), outlinesDictRef);
    
    for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];
        const ref = itemRefs[i];
        const prev = i > 0 ? itemRefs[i - 1] : null;
        const next = i < chapters.length - 1 ? itemRefs[i + 1] : null;
        
        // Create the GoTo action
        // We need to look up the PDF page reference
        const pageList = pdfDoc.getPages();
        if (chapter.startPage >= pageList.length) continue;
        
        const pageRef = pageList[chapter.startPage].ref;

        const outlineItem = pdfDoc.context.obj({
            Title: PDFString.of(chapter.title),
            Parent: outlinesDictRef,
            ...(prev ? { Prev: prev } : {}),
            ...(next ? { Next: next } : {}),
            Dest: [pageRef, 'XYZ', null, null, null] // Scroll to top of page
        });
        
        pdfDoc.context.assign(ref, outlineItem);
    }
    
    pdfDoc.context.assign(outlinesDictRef, outlinesDict);
  }
}
