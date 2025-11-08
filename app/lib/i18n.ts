import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export type Locale = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'zh' | 'ja' | 'ar' | 'ru';

export interface TranslationKey {
  key: string;
  namespace?: string;
  defaultValue?: string;
}

export interface Translation {
  locale: Locale;
  key: string;
  value: string;
  namespace?: string;
  context?: string;
}

export interface I18nConfig {
  defaultLocale: Locale;
  supportedLocales: Locale[];
  fallbackLocale: Locale;
  loadPath?: string;
  saveMissing?: boolean;
}

export interface LocaleInfo {
  code: Locale;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  dateFormat: string;
  timeFormat: string;
  currencySymbol: string;
}

const LOCALE_INFO: Record<Locale, LocaleInfo> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: 'h:mm A',
    currencySymbol: '$',
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    direction: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    currencySymbol: '€',
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    direction: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    currencySymbol: '€',
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    direction: 'ltr',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: 'HH:mm',
    currencySymbol: '€',
  },
  pt: {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    direction: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    currencySymbol: 'R$',
  },
  zh: {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    direction: 'ltr',
    dateFormat: 'YYYY/MM/DD',
    timeFormat: 'HH:mm',
    currencySymbol: '¥',
  },
  ja: {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    direction: 'ltr',
    dateFormat: 'YYYY/MM/DD',
    timeFormat: 'HH:mm',
    currencySymbol: '¥',
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    direction: 'rtl',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    currencySymbol: 'ر.س',
  },
  ru: {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    direction: 'ltr',
    dateFormat: 'DD.MM.YYYY',
    timeFormat: 'HH:mm',
    currencySymbol: '₽',
  },
};

class I18nSystem {
  private static instance: I18nSystem;
  private translations: Map<string, Map<string, string>> = new Map();
  private currentLocale: Locale;
  private config: I18nConfig;

  private constructor() {
    this.currentLocale = 'en';
    this.config = {
      defaultLocale: 'en',
      supportedLocales: ['en', 'es', 'fr', 'de', 'pt', 'zh', 'ja', 'ar', 'ru'],
      fallbackLocale: 'en',
      saveMissing: true,
    };
  }

  static getInstance(): I18nSystem {
    if (!I18nSystem.instance) {
      I18nSystem.instance = new I18nSystem();
    }
    return I18nSystem.instance;
  }

  // Initialize with config
  init(config: Partial<I18nConfig>): void {
    this.config = { ...this.config, ...config };
    this.currentLocale = config.defaultLocale || this.config.defaultLocale;
  }

  // Load translations for a locale
  async loadTranslations(locale: Locale, namespace?: string): Promise<void> {
    try {
      let query = supabase
        .from('translations')
        .select('*')
        .eq('locale', locale);

      if (namespace) {
        query = query.eq('namespace', namespace);
      }

      const { data, error } = await query;

      if (error) throw error;

      const localeKey = namespace ? `${locale}:${namespace}` : locale;
      const translationMap = new Map<string, string>();

      data?.forEach((translation) => {
        translationMap.set(translation.key, translation.value);
      });

      this.translations.set(localeKey, translationMap);
    } catch (error) {
      console.error('Failed to load translations:', error);
    }
  }

  // Translate a key
  t(key: string, options?: {
    locale?: Locale;
    namespace?: string;
    defaultValue?: string;
    interpolation?: Record<string, any>;
    count?: number;
  }): string {
    const locale = options?.locale || this.currentLocale;
    const namespace = options?.namespace;
    const localeKey = namespace ? `${locale}:${namespace}` : locale;

    // Get translation
    let translation =
      this.translations.get(localeKey)?.get(key) ||
      this.translations.get(locale)?.get(key);

    // Try fallback locale
    if (!translation && locale !== this.config.fallbackLocale) {
      const fallbackKey = namespace
        ? `${this.config.fallbackLocale}:${namespace}`
        : this.config.fallbackLocale;
      translation =
        this.translations.get(fallbackKey)?.get(key) ||
        this.translations.get(this.config.fallbackLocale)?.get(key);
    }

    // Use default value or key itself
    if (!translation) {
      translation = options?.defaultValue || key;

      // Save missing translation
      if (this.config.saveMissing) {
        this.saveMissingKey(locale, key, namespace, options?.defaultValue);
      }
    }

    // Handle pluralization
    if (options?.count !== undefined) {
      translation = this.pluralize(translation, options.count, locale);
    }

    // Handle interpolation
    if (options?.interpolation) {
      translation = this.interpolate(translation, options.interpolation);
    }

    return translation;
  }

  // Set current locale
  setLocale(locale: Locale): void {
    if (this.config.supportedLocales.includes(locale)) {
      this.currentLocale = locale;
    }
  }

  // Get current locale
  getLocale(): Locale {
    return this.currentLocale;
  }

  // Get locale info
  getLocaleInfo(locale?: Locale): LocaleInfo {
    return LOCALE_INFO[locale || this.currentLocale];
  }

  // Get all supported locales
  getSupportedLocales(): LocaleInfo[] {
    return this.config.supportedLocales.map((locale) => LOCALE_INFO[locale]);
  }

  // Add translation
  async addTranslation(translation: Translation): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('translations')
        .upsert({
          locale: translation.locale,
          key: translation.key,
          value: translation.value,
          namespace: translation.namespace,
          context: translation.context,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Update cache
      const localeKey = translation.namespace
        ? `${translation.locale}:${translation.namespace}`
        : translation.locale;

      if (!this.translations.has(localeKey)) {
        this.translations.set(localeKey, new Map());
      }

      this.translations.get(localeKey)!.set(translation.key, translation.value);

      return true;
    } catch (error) {
      console.error('Failed to add translation:', error);
      return false;
    }
  }

  // Save missing key
  private async saveMissingKey(
    locale: Locale,
    key: string,
    namespace?: string,
    defaultValue?: string
  ): Promise<void> {
    try {
      await supabase.from('missing_translations').insert({
        locale,
        key,
        namespace,
        default_value: defaultValue,
        first_seen: new Date().toISOString(),
      });
    } catch (error) {
      // Ignore errors for missing keys
    }
  }

  // Interpolate variables
  private interpolate(text: string, vars: Record<string, any>): string {
    let result = text;

    for (const [key, value] of Object.entries(vars)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }

    return result;
  }

  // Pluralize text
  private pluralize(text: string, count: number, locale: Locale): string {
    // Simple pluralization - in production, use proper pluralization rules
    const rules = this.getPluralRules(locale);
    const form = rules.select(count);

    // Look for pluralization syntax: "item|items"
    if (text.includes('|')) {
      const forms = text.split('|');
      return forms[form === 'one' ? 0 : 1] || forms[0];
    }

    return text;
  }

  // Get plural rules for locale
  private getPluralRules(locale: Locale): Intl.PluralRules {
    return new Intl.PluralRules(locale);
  }

  // Format date
  formatDate(date: Date | string, options?: {
    locale?: Locale;
    format?: 'short' | 'long' | 'full';
  }): string {
    const locale = options?.locale || this.currentLocale;
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    const formatOptions: Intl.DateTimeFormatOptions = {
      short: { year: 'numeric', month: 'numeric', day: 'numeric' },
      long: { year: 'numeric', month: 'long', day: 'numeric' },
      full: {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      },
    }[options?.format || 'short'];

    return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj);
  }

  // Format time
  formatTime(date: Date | string, options?: {
    locale?: Locale;
    format?: '12h' | '24h';
  }): string {
    const locale = options?.locale || this.currentLocale;
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    return new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      minute: 'numeric',
      hour12: options?.format === '12h',
    }).format(dateObj);
  }

  // Format number
  formatNumber(value: number, options?: {
    locale?: Locale;
    decimals?: number;
    style?: 'decimal' | 'percent';
  }): string {
    const locale = options?.locale || this.currentLocale;

    return new Intl.NumberFormat(locale, {
      style: options?.style || 'decimal',
      minimumFractionDigits: options?.decimals,
      maximumFractionDigits: options?.decimals,
    }).format(value);
  }

  // Format currency
  formatCurrency(value: number, options?: {
    locale?: Locale;
    currency?: string;
  }): string {
    const locale = options?.locale || this.currentLocale;
    const currency = options?.currency || 'USD';

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(value);
  }

  // Detect user locale from browser
  detectLocale(): Locale {
    if (typeof window === 'undefined') {
      return this.config.defaultLocale;
    }

    const browserLang = navigator.language.split('-')[0] as Locale;

    return this.config.supportedLocales.includes(browserLang)
      ? browserLang
      : this.config.defaultLocale;
  }

  // Get missing translations
  async getMissingTranslations(locale?: Locale): Promise<Array<{
    key: string;
    locale: Locale;
    namespace?: string;
    count: number;
  }>> {
    try {
      let query = supabase
        .from('missing_translations')
        .select('key, locale, namespace, count');

      if (locale) {
        query = query.eq('locale', locale);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Failed to get missing translations:', error);
      return [];
    }
  }

  // Export translations
  async exportTranslations(locale: Locale, format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('translations')
        .select('*')
        .eq('locale', locale);

      if (error) throw error;

      if (format === 'json') {
        const translations: Record<string, any> = {};

        data?.forEach((t) => {
          if (t.namespace) {
            if (!translations[t.namespace]) {
              translations[t.namespace] = {};
            }
            translations[t.namespace][t.key] = t.value;
          } else {
            translations[t.key] = t.value;
          }
        });

        return JSON.stringify(translations, null, 2);
      } else {
        // CSV format
        let csv = 'Key,Value,Namespace,Context\n';

        data?.forEach((t) => {
          csv += `"${t.key}","${t.value}","${t.namespace || ''}","${t.context || ''}"\n`;
        });

        return csv;
      }
    } catch (error) {
      console.error('Failed to export translations:', error);
      return '';
    }
  }

  // Import translations
  async importTranslations(locale: Locale, data: Record<string, any>, namespace?: string): Promise<number> {
    let count = 0;

    try {
      const translations: Translation[] = [];

      const flattenObject = (obj: any, prefix = ''): void => {
        for (const [key, value] of Object.entries(obj)) {
          const fullKey = prefix ? `${prefix}.${key}` : key;

          if (typeof value === 'object' && value !== null) {
            flattenObject(value, fullKey);
          } else {
            translations.push({
              locale,
              key: fullKey,
              value: String(value),
              namespace,
            });
          }
        }
      };

      flattenObject(data);

      for (const translation of translations) {
        const success = await this.addTranslation(translation);
        if (success) count++;
      }
    } catch (error) {
      console.error('Failed to import translations:', error);
    }

    return count;
  }
}

// Export singleton instance
export const i18n = I18nSystem.getInstance();

// React hook (for React/React Native projects)
export const useTranslation = (namespace?: string) => {
  const t = (key: string, options?: any) => {
    return i18n.t(key, { ...options, namespace });
  };

  return {
    t,
    locale: i18n.getLocale(),
    setLocale: (locale: Locale) => i18n.setLocale(locale),
    formatDate: i18n.formatDate.bind(i18n),
    formatTime: i18n.formatTime.bind(i18n),
    formatNumber: i18n.formatNumber.bind(i18n),
    formatCurrency: i18n.formatCurrency.bind(i18n),
  };
};

// Convenience functions
export const t = (key: string, options?: any) => i18n.t(key, options);
export const setLocale = (locale: Locale) => i18n.setLocale(locale);
export const getLocale = () => i18n.getLocale();
export const formatDate = (date: Date | string, options?: any) =>
  i18n.formatDate(date, options);
export const formatCurrency = (value: number, options?: any) =>
  i18n.formatCurrency(value, options);

