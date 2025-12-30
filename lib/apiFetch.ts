import supabase from './supabaseClient';

export default async function apiFetch(input: RequestInfo, init?: RequestInit) {
  // Try to attach the current user's access token (client-side)
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token ?? null;
    const headers = new Headers(init?.headers as HeadersInit || {});
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const res = await fetch(input, { ...init, headers });
    return res;
  } catch (err) {
    // Fallback to plain fetch if anything goes wrong
    return fetch(input, init);
  }
}
