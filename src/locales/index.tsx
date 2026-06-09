import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Locale, LocaleContextType } from '../types';
import it from './it';
import en from './en';

const locales: Record<Locale, Record<string, any>> = { it, en };
const LocaleContext = createContext<LocaleContextType | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>('it');
  const strings = locales[locale];

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = strings;
    for (const k of keys) {
      if (value == null) return key;
      value = value[k];
    }
    if (value == null) return key;
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (_: string, p: string) => params[p] != null ? String(params[p]) : `{{${p}}}`);
    }
    return value;
  }, [strings]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, t]);

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextType {
  const ctx = useContext(LocaleContext);
  if (!ctx) return { locale: 'it' as Locale, setLocale: () => {}, t: (_k: string) => _k };
  return ctx;
}
