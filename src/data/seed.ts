import { Employee, Location, Shift } from '../types';

export const DEFAULT_EMPLOYEES: Employee[] = [
  { id: 'emp-1', name: 'Mario Rossi', role: 'Cassiere', phone: '', email: '', color: '#2563eb', notes: '', active: true },
  { id: 'emp-2', name: 'Giulia Bianchi', role: 'Addetta sala', phone: '', email: '', color: '#16a34a', notes: '', active: true },
  { id: 'emp-3', name: 'Anna Verdi', role: 'Responsabile', phone: '', email: '', color: '#dc2626', notes: '', active: true }
];

export const DEFAULT_LOCATIONS: Location[] = [
  { id: 'loc-1', name: 'Sede principale', address: '', notes: '' },
  { id: 'loc-2', name: 'Magazzino', address: '', notes: '' }
];

export const DEFAULT_SHIFTS: Shift[] = [];
