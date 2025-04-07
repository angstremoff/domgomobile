import { SupabaseClient } from '@supabase/supabase-js';

export const safeQuery = async <T>(
  client: SupabaseClient,
  table: string,
  params: {
    select?: string;
    filters?: Record<string, any>;
    limit?: number;
    page?: number;
  }
): Promise<{ data: T[]; error: string | null }> => {
  try {
    let query = client.from(table).select(params.select || '*');

    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    const { data } = await query
      .range(
        ((params.page || 1) - 1) * (params.limit || 20),
        (params.page || 1) * (params.limit || 20) - 1
      )
      .throwOnError();

    return { data: data as T[], error: null };
  } catch (error: any) {
    return { data: [] as unknown as T[], error: error.message };
  }
};
