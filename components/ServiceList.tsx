"use client";
import React, { useEffect, useState } from 'react';
import apiFetch from '../lib/apiFetch';

type Service = {
  id: string;
  title: string;
  description?: string | null;
  price: number;
  sellerId: string;
  seller?: { id: string; email: string; name?: string | null };
};

export default function ServiceList() {
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    apiFetch('/api/services')
      .then((r) => r.json())
      .then(setServices)
      .catch(console.error);
  }, []);

  return (
    <div>
      <h3>Services</h3>
      <ul>
        {services.map((s) => (
          <li key={s.id}>
            <strong>{s.title}</strong> — {s.description} — ${s.price / 100}
            <div style={{ fontSize: 12, color: '#666' }}>Seller: {s.seller?.name ?? s.seller?.email}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
