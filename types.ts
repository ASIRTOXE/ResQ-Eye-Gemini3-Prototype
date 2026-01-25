export interface AnalysisState {
  isLoading: boolean;
  result: string | null;
  error: string | null;
}

export interface VideoFile {
  file: File;
  previewUrl: string;
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}