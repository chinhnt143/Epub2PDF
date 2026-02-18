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