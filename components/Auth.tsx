"use client";
import React, { useEffect, useState } from 'react';
import supabase from '../lib/supabaseClient';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [session, setSession] = useState<any>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, d) => {
      setSession(d.session ?? null);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!email) return setMessage('Enter an email');

    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) setMessage(error.message ?? String(error));
    else setMessage('Check your email for the magic link.');
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setSession(null);
  }

  if (session) {
    return (
      <div>
        <div>Signed in as {session.user.email}</div>
        <button onClick={handleSignOut}>Sign out</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSignIn}>
      <label>Email</label>
      <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
      <button type="submit">Sign in (magic link)</button>
      {message && <div style={{ color: 'green' }}>{message}</div>}
    </form>
  );
}
