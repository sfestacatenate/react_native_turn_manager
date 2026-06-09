import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_EMPLOYEES, DEFAULT_LOCATIONS, DEFAULT_SHIFTS } from '../data/seed';
import { AppData } from '../types';

const STORAGE_KEY = 'turni_offline_app_v1';

export async function loadAppData(): Promise<AppData> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return {
      businessName: 'La mia attivita',
      employees: DEFAULT_EMPLOYEES,
      locations: DEFAULT_LOCATIONS,
      shifts: DEFAULT_SHIFTS
    };
  }

  return JSON.parse(raw);
}

export async function saveAppData(data: AppData): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export async function resetAppData(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
