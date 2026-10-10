export interface OptionDisplay {
  name: string;
  label: string;
  type: 'buttons' | 'color' | 'image' | 'dropdown';
  values: ReadonlyArray<{ value: string; label: string; color?: string | null; image_url?: string | null }>;
}
