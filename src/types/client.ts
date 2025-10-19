export interface Client {
  id: number;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  created_at: string;
  updated_at: string;
  contacts?: Contact[];
}

export interface Contact {
  id: number;
  client_id: number;
  contact_person: string;
  position: string;
  email: string;
  phone: string;
  is_primary: boolean;
  created_at: string;
}
