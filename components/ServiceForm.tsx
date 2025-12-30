"use client";
import React, { useState } from 'react';
import supabase from '../lib/supabaseClient';
import apiFetch from '../lib/apiFetch';

export default function ServiceForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const { data: { session } = {} } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      setError('You must be signed in to create a service.');
      return;
    }

    // Create service as the current user
    const sellerId = session.user.id;

    const res = await apiFetch('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, price, sellerId }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body?.error || 'Failed to create service');
      return;
    }

    setTitle('');
    setDescription('');
    setPrice(0);
    // Optionally refresh or show created item
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3>Create Service</h3>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <div>
        <label>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <label>Description</label>
        <input value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div>
        <label>Price (in cents)</label>
        <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value || 0))} />
      </div>
      <button type="submit">Create</button>
    </form>
  );
}
