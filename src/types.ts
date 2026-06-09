export interface Employee {
  id: string | null;
  name: string;
  role: string;
  phone: string;
  email: string;
  color: string;
  notes: string;
  active: boolean;
}

export interface Location {
  id: string | null;
  name: string;
  address: string;
  notes: string;
}

export interface Shift {
  id: string | null;
  employeeId: string;
  locationId: string;
  date: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  breakStartTime?: string;
  role: string;
  notes: string;
}

export interface AppData {
  businessName: string;
  employees: Employee[];
  locations: Location[];
  shifts: Shift[];
}

export type Locale = 'it' | 'en';

export interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export interface ExportPayload {
  businessName: string;
  employees: Employee[];
  locations: Location[];
  shifts: Shift[];
  weekStart: Date;
}
