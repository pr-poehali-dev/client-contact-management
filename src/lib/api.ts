import { Client, Contact } from '@/types/client';

const CLIENTS_API = 'https://functions.poehali.dev/8695a7be-f940-4ae5-bc32-af54e101c743';
const CONTACTS_API = 'https://functions.poehali.dev/bebd6db5-8950-42be-9388-5ad83b2e2054';

export const clientsApi = {
  async getAll(search?: string): Promise<Client[]> {
    const url = search ? `${CLIENTS_API}?search=${encodeURIComponent(search)}` : CLIENTS_API;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch clients');
    return response.json();
  },

  async getById(id: number): Promise<Client> {
    const response = await fetch(`${CLIENTS_API}?id=${id}`);
    if (!response.ok) throw new Error('Failed to fetch client');
    return response.json();
  },

  async create(client: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client> {
    const response = await fetch(CLIENTS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(client),
    });
    if (!response.ok) throw new Error('Failed to create client');
    return response.json();
  },

  async update(client: Partial<Client> & { id: number }): Promise<Client> {
    const response = await fetch(CLIENTS_API, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(client),
    });
    if (!response.ok) throw new Error('Failed to update client');
    return response.json();
  },

  async delete(id: number): Promise<void> {
    const response = await fetch(`${CLIENTS_API}?id=${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete client');
  },
};

export const contactsApi = {
  async getAll(clientId?: number): Promise<Contact[]> {
    const url = clientId ? `${CONTACTS_API}?client_id=${clientId}` : CONTACTS_API;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch contacts');
    return response.json();
  },

  async create(contact: Omit<Contact, 'id' | 'created_at'>): Promise<Contact> {
    const response = await fetch(CONTACTS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contact),
    });
    if (!response.ok) throw new Error('Failed to create contact');
    return response.json();
  },

  async update(contact: Partial<Contact> & { id: number }): Promise<Contact> {
    const response = await fetch(CONTACTS_API, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contact),
    });
    if (!response.ok) throw new Error('Failed to update contact');
    return response.json();
  },

  async delete(id: number): Promise<void> {
    const response = await fetch(`${CONTACTS_API}?id=${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete contact');
  },
};
