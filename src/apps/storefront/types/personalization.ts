export interface PersonalizationField {
  key: string;
  type: 'text' | 'image';
  label: string;
  required: boolean;
  max_length: number;
}
export interface PersonalizationEntry {
  key: string;
  type: 'text' | 'image';
  label: string;
  value?: string;
  filename?: string;
  url?: string | null;
}
export type PersonalizationValues = Record<string, string>;
export interface PersonalizationChoice {
  values: PersonalizationValues;
  entries: PersonalizationEntry[];
  busy: boolean;
}
