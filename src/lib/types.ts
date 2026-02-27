// Case row as returned by Supabase with joined doctor name
export type Case = {
  id: string;
  case_number: string;
  patient: string;
  doctor_id: string;
  type: string;
  shade: string;
  status: 'received' | 'in_progress' | 'quality_check' | 'ready' | 'shipped';
  rush: boolean;
  due: string;
  price: number;
  notes: string | null;
  invoiced: boolean;
  created_at: string;
  updated_at: string;
  doctors: { name: string } | null;
};

export type SortColumn = 'case_number' | 'patient' | 'doctor' | 'type' | 'status' | 'due' | 'price';
export type SortDirection = 'asc' | 'desc';
