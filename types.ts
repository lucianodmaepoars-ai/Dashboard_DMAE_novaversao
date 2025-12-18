export interface VisitRaw {
  date: string; // DD/MM/YYYY
  time: string; // HH:mm:ss
  location: string;
}

export interface Visit extends VisitRaw {
  id: string;
  team: string; // Equipe
  shiftDate: string; // The date the shift belongs to
  shiftType: 'DIURNO' | 'NOTURNO';
}

export interface ChartData {
  name: string;
  value: number;
}

export enum ViewMode {
  DATA_ENTRY = 'DATA_ENTRY',
  ANALYTICS = 'ANALYTICS',
}

export type ProcessingStatus = 'idle' | 'processing' | 'success' | 'error';