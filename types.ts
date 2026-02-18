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

export interface ParsedEpub {
  metadata: EpubMetadata;
  chapters: EpubChapter[];
}

export enum ConversionStatus {
  IDLE = 'IDLE',
  PARSING = 'PARSING',
  GENERATING_SUMMARY = 'GENERATING_SUMMARY',
  READY = 'READY',
  ERROR = 'ERROR'
}

export interface ProgressState {
  status: ConversionStatus;
  message: string;
  percentage: number;
}