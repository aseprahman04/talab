'use client';

import { FormEvent, useState } from 'react';
import { apiRequest } from '../lib/api';

type DemoFormState = {
  name: string;
  email: string;
  phoneNumber: string;
  companyName: string;
  desiredPlan: string;
  useCase: string;
};

const initialState: DemoFormState = {
  name: '',
  email: '',
  phoneNumber: '',
  companyName: '',
  desiredPlan: 'UMKM Pro',
  useCase: '',
};

export function DemoRequestForm() {
  const [form, setForm] = useState<DemoFormState>(initialState);
  const [status, setStatus] = useState<{ tone: 'success' | 'error' | 'idle'; text: string }>({
    tone: 'idle',
    text: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus({ tone: 'idle', text: '' });

    try {
      await apiRequest('/demo-requests', {
        method: 'POST',
        body: JSON.stringify(form),
      });

      setStatus({
        tone: 'success',
        text: 'Request demo terkirim. Tim kami akan follow-up dalam jam kerja WIB.',
      });
      setForm(initialState);
    } catch (error) {
      setStatus({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Gagal mengirim request demo.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="demo-form" onSubmit={handleSubmit}>
      <label className="field-block">
        <span>Nama</span>
        <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Nama PIC" required />
      </label>
      <label className="field-block">
        <span>Email</span>
        <input type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} placeholder="pic@company.co.id" required />
      </label>
      <label className="field-block">
        <span>Nomor WhatsApp</span>
        <input value={form.phoneNumber} onChange={(event) => setForm((prev) => ({ ...prev, phoneNumber: event.target.value }))} placeholder="62812xxxxxx" />
      </label>
      <label className="field-block">
        <span>Perusahaan</span>
        <input value={form.companyName} onChange={(event) => setForm((prev) => ({ ...prev, companyName: event.target.value }))} placeholder="PT Contoh Nusantara" />
      </label>
      <label className="field-block">
        <span>Paket target</span>
        <select value={form.desiredPlan} onChange={(event) => setForm((prev) => ({ ...prev, desiredPlan: event.target.value }))}>
          <option value="Coba Dulu">Coba Dulu</option>
          <option value="UMKM Pro">UMKM Pro</option>
          <option value="Growth Team">Growth Team</option>
        </select>
      </label>
      <label className="field-block span-2">
        <span>Use case utama</span>
        <textarea rows={4} value={form.useCase} onChange={(event) => setForm((prev) => ({ ...prev, useCase: event.target.value }))} placeholder="Contoh: reminder cicilan + notifikasi follow-up sales" />
      </label>
      <div className="span-2 button-row">
        <button className="button-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Mengirim...' : 'Kirim request demo'}
        </button>
      </div>
      {status.text ? <p className={status.tone === 'success' ? 'form-note success' : 'form-note error'}>{status.text}</p> : null}
    </form>
  );
}
