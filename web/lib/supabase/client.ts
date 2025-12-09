import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@shared/lib/database.types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function createMockClient() {
  const mockAuth = {
    getSession: async () => ({ data: { session: null }, error: new Error('Supabase env is not configured') }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: async () => ({ data: { user: null, session: null }, error: new Error('Supabase env is not configured') }),
    signUp: async () => ({ data: { user: null, session: null }, error: new Error('Supabase env is not configured') }),
    signOut: async () => ({ error: new Error('Supabase env is not configured') }),
    getUser: async () => ({ data: { user: null }, error: new Error('Supabase env is not configured') }),
  };

  const mock = {
    select: () => mock,
    eq: () => mock,
    order: () => mock,
    limit: () => mock,
    single: async () => ({ data: null, error: new Error('Supabase env is not configured') }),
    maybeSingle: async () => ({ data: null, error: new Error('Supabase env is not configured') }),
    insert: async () => ({ data: null, error: new Error('Supabase env is not configured') }),
    update: async () => ({ data: null, error: new Error('Supabase env is not configured') }),
    delete: async () => ({ data: null, error: new Error('Supabase env is not configured') }),
  };

  return {
    from: () => mock,
    auth: mockAuth,
  };
}

export function createClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return createMockClient() as unknown as ReturnType<typeof createBrowserClient<Database>>;
  }

  try {
    return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch {
    return createMockClient() as unknown as ReturnType<typeof createBrowserClient<Database>>;
  }
}
