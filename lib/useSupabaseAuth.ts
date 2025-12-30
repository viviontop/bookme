"use client";
import { useEffect, useState } from 'react';
import supabase from './supabaseClient';

export default function useSupabaseAuth() {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setToken(data.session?.access_token ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, d) => {
      setSession(d.session ?? null);
      setUser(d.session?.user ?? null);
      setToken(d.session?.access_token ?? null);
    });

    return () => {
      mounted = false;
      try { listener.subscription.unsubscribe(); } catch {};
    };
  }, []);

  return { session, user, token };
}
