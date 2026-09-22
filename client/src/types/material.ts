export type MaterialType = 'pdf' | 'image' | 'doc' | 'slides';

export type IngestionStatus = 'uploading' | 'processing' | 'indexed' | 'error';

export interface MaterialSource {
  id: string;
  title: string;
  filename: string;
  type: MaterialType;
  pagesCount?: number;
  size: string;
  uploadDate: string;
  status: IngestionStatus;
  processingProgress?: number;
  topics: string[];
  course: 'Machine Learning' | 'DBMS' | 'Java OOP' | 'Operating Systems' | 'Computer Networks' | 'Quantitative Aptitude' | 'Programming & OOP' | 'General Studies' | string;
  contentPreview?: string;
  textContent?: string;
  thumbnailUrl?: string;
  sections?: {
    id: string;
    page: number;
    title: string;
    snippet: string;
  }[];
}
