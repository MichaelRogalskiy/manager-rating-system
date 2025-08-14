import { ukLocale } from './uk';

export const locale = ukLocale;
export type LocaleType = typeof ukLocale;

// Utility function for string interpolation
export function t(key: string, params?: Record<string, string | number>): string {
  let text = (locale as Record<string, string>)[key] || key;
  
  if (params) {
    Object.entries(params).forEach(([param, value]) => {
      text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), value.toString());
    });
  }
  
  return text;
}

// Nested key access function
export function getNestedKey(obj: Record<string, unknown>, path: string): string {
  return path.split('.').reduce((curr, key) => curr?.[key], obj) || path;
}

export function tn(keyPath: string, params?: Record<string, string | number>): string {
  const text = getNestedKey(locale, keyPath);
  
  if (params) {
    return Object.entries(params).reduce(
      (str, [param, value]) => str.replace(new RegExp(`\\{${param}\\}`, 'g'), value.toString()),
      text
    );
  }
  
  return text;
}