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

export type Doctor = {
  id: string;
  name: string;
  practice: string;
  email: string | null;
  phone: string | null;
  auth_user_id: string | null;
};

// Case data as seen by doctors in the portal (no financial data)
export type PortalCase = {
  id: string;
  case_number: string;
  patient: string;
  type: string;
  shade: string;
  status: 'received' | 'in_progress' | 'quality_check' | 'ready' | 'shipped';
  rush: boolean;
  due: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CaseAttachment = {
  id: string;
  case_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  uploaded_by: string;
  uploaded_by_role: 'lab' | 'doctor';
  created_at: string;
};

export type CaseMessage = {
  id: string;
  case_id: string;
  sender_id: string;
  sender_role: 'lab' | 'doctor';
  sender_name: string;
  message: string;
  created_at: string;
};

// Case data for doctor invoice view (includes price + invoiced)
export type PortalInvoiceCase = {
  id: string;
  case_number: string;
  patient: string;
  type: string;
  status: 'received' | 'in_progress' | 'quality_check' | 'ready' | 'shipped';
  due: string;
  price: number;
  invoiced: boolean;
};

export type SortColumn = 'case_number' | 'patient' | 'doctor' | 'type' | 'status' | 'due' | 'price';
export type SortDirection = 'asc' | 'desc';
