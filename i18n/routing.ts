import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'zh'] as const,
  defaultLocale: 'en',
});
