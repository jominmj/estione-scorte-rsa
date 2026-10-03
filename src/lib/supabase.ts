import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Medication = {
  id: string;
  active_ingredient: string;
  dosage: string;
  commercial_name: string;
  pack_size: number;
  qty_pt: number;
  qty_1: number;
  qty_2: number;
  qty_3: number;
  created_at: string;
  updated_at: string;
};

export type MedicationInsert = {
  active_ingredient: string;
  dosage: string;
  commercial_name: string;
  pack_size?: number;
  qty_pt?: number;
  qty_1?: number;
  qty_2?: number;
  qty_3?: number;
};

export type MedicationUpdate = {
  active_ingredient?: string;
  dosage?: string;
  commercial_name?: string;
  pack_size?: number;
  qty_pt?: number;
  qty_1?: number;
  qty_2?: number;
  qty_3?: number;
};

export function totalQty(m: Pick<Medication, 'qty_pt' | 'qty_1' | 'qty_2' | 'qty_3'>): number {
  return m.qty_pt + m.qty_1 + m.qty_2 + m.qty_3;
}
