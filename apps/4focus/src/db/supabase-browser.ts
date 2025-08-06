import { createBrowserClient } from '@supabase/ssr';
import { type Database } from './database.types';

export const supabaseBrowserClient = createBrowserClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY
);