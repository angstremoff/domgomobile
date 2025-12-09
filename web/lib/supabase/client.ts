import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@shared/lib/database.types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function createMockResponse<T>() {
  return async () => ({ data: null as T | null, error: new Error('Supabase env is not configured') });
}

function createMockClient() {
  const mock = {
    select: () => mock,
    eq: () => mock,
    order: () => mock,
    limit: () => mock,
    single: createMockResponse(),
    maybeSingle: createMockResponse(),
    insert: createMockResponse(),
    update: createMockResponse(),
    delete: createMockResponse(),
  };

  return {
    from: () => mock,
    auth: {
      getUser: createMockResponse(),
      getSession: createMockResponse(),
      signInWithPassword: createMockResponse(),
      signOut: createMockResponse(),
    },
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
