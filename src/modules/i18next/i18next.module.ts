import { defineModule } from '@core/module';
import i18next, { TFunction } from 'i18next';

import en from 'assets/i18next/en';

export const I18NextModule = defineModule((ctx) => {
  let t!: TFunction;

  ctx.onModuleInit(async () => {
    t = await i18next.init({
      lng: 'en',
      resources: {
        en,
      },
    });
  });

  return {
    useI18Next() {
      return t;
    },
  };
});
