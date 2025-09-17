interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly AUTH_CALLBACK_URL: string;
  readonly SUPABASE_GOOGLE_CLIENT_SECRET: string;
  readonly SUPABASE_GOOGLE_CLIENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
