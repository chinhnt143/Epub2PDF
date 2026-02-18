export interface ConverterOptions {
  includeSummary: boolean;
  fontSize: number;
  lineHeight: number;
}

export interface EpubMetadata {
  title: string;
  creator: string;
  language?: string;
  description?: string;
  coverUrl?: string;
}

export interface EpubChapter {
  id: string;
  title: string;
  content: string; // HTML content
}

export interface EpubStructure {
  metadata: EpubMetadata;
  structure: any; // TOC structure
}

export interface ConversionResult {
  pdfPath: string;
  pageCount: number;
  title: string;
  author: string;
}

export interface ChapterInfo {
  id: string;
  title: string;
  href: string;
  startPage: number;
}
