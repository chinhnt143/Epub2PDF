import JSZip from 'jszip';
import { EpubMetadata, EpubChapter, ParsedEpub } from '../types';

// Helper to resolve relative paths
const resolvePath = (base: string, relative: string): string => {
  const stack = base.split('/');
  stack.pop(); // Remove current file
  const parts = relative.split('/');
  for (const part of parts) {
    if (part === '.') continue;
    if (part === '..') stack.pop();
    else stack.push(part);
  }
  return stack.join('/');
};

export const parseEpub = async (file: File, onProgress: (msg: string) => void): Promise<ParsedEpub> => {
  const zip = new JSZip();
  const content = await zip.loadAsync(file);

  onProgress("Reading container.xml...");
  
  // 1. Find the OPF file path from META-INF/container.xml
  const containerXml = await content.file("META-INF/container.xml")?.async("text");
  if (!containerXml) throw new Error("Invalid EPUB: Missing META-INF/container.xml");

  const parser = new DOMParser();
  const containerDoc = parser.parseFromString(containerXml, "application/xml");
  const rootfile = containerDoc.querySelector("rootfile");
  const opfPath = rootfile?.getAttribute("full-path");

  if (!opfPath) throw new Error("Invalid EPUB: Could not find OPF path");

  // 2. Read and Parse OPF
  onProgress("Parsing metadata...");
  const opfContent = await content.file(opfPath)?.async("text");
  if (!opfContent) throw new Error("Invalid EPUB: Missing OPF file");

  const opfDoc = parser.parseFromString(opfContent, "application/xml");
  
  // Metadata extraction
  const metadata: EpubMetadata = {
    title: opfDoc.querySelector("metadata > title")?.textContent || "Untitled",
    creator: opfDoc.querySelector("metadata > creator")?.textContent || "Unknown Author",
    language: opfDoc.querySelector("metadata > language")?.textContent || "en",
  };

  // 3. Process Manifest (files) and Spine (order)
  const manifestItems = Array.from(opfDoc.querySelectorAll("manifest > item"));
  const manifestMap = new Map<string, { href: string; type: string }>();
  
  manifestItems.forEach(item => {
    const id = item.getAttribute("id");
    const href = item.getAttribute("href");
    const type = item.getAttribute("media-type");
    if (id && href && type) manifestMap.set(id, { href, type });
  });

  const spineItems = Array.from(opfDoc.querySelectorAll("spine > itemref"));
  
  onProgress("Extracting chapters...");
  const chapters: EpubChapter[] = [];

  // Create Blob URLs for images/css to render inside browser
  const resourceCache = new Map<string, string>();

  const getResourceUrl = async (fullPath: string, type: string) => {
    if (resourceCache.has(fullPath)) return resourceCache.get(fullPath);
    
    const fileData = content.file(fullPath);
    if (!fileData) return null;
    
    const blob = await fileData.async("blob");
    const url = URL.createObjectURL(new Blob([blob], { type }));
    resourceCache.set(fullPath, url);
    return url;
  };

  // Process spine items sequentially
  for (let i = 0; i < spineItems.length; i++) {
    const idref = spineItems[i].getAttribute("idref");
    if (!idref) continue;

    const item = manifestMap.get(idref);
    if (!item) continue;

    const itemPath = resolvePath(opfPath, item.href);
    const itemContent = await content.file(itemPath)?.async("text");
    
    if (itemContent) {
        // Post-process HTML to fix image links
        const chapterDoc = parser.parseFromString(itemContent, "application/xhtml+xml") || parser.parseFromString(itemContent, "text/html");
        
        // Fix Images
        const images = Array.from(chapterDoc.querySelectorAll("img, image"));
        for (const img of images) {
            const src = img.getAttribute("src") || img.getAttribute("xlink:href");
            if (src && !src.startsWith("http") && !src.startsWith("data:")) {
                const imgPath = resolvePath(itemPath, src);
                const imgType = "image/jpeg"; // Simplified
                const blobUrl = await getResourceUrl(imgPath, imgType);
                if (blobUrl) {
                    if (img.tagName.toLowerCase() === 'image') {
                        img.setAttribute("xlink:href", blobUrl);
                    } else {
                        img.setAttribute("src", blobUrl);
                    }
                }
            }
        }

        // Fix CSS links (optional, often better to strip or use default for PDF consistency)
        // For this converter, we strip external styles to enforce our print layout
        chapterDoc.querySelectorAll("link[rel='stylesheet']").forEach(el => el.remove());
        chapterDoc.querySelectorAll("style").forEach(el => el.remove());

        const bodyContent = chapterDoc.body.innerHTML;
        // Simple title extraction
        const chapterTitle = chapterDoc.querySelector("h1, h2")?.textContent || `Chapter ${i+1}`;

        chapters.push({
            id: idref,
            title: chapterTitle,
            content: bodyContent
        });
    }

    onProgress(`Processed chapter ${i + 1} of ${spineItems.length}`);
  }

  return { metadata, chapters };
};