// app.config.ts (05 §12.2)
// Dynamic config that EXTENDS the static app.json (name/slug/icon/splash/plugins are
// preserved via `...config`) and surfaces the API base URL through `extra.apiBaseUrl`,
// which src/lib/env.ts reads as its primary source. We intentionally do NOT delete app.json.
import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  // `config.name`/`config.slug` come from app.json; ExpoConfig requires them as strings.
  name: config.name ?? 'mobile',
  slug: config.slug ?? 'mobile',
  extra: {
    ...config.extra,
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
  },
});
