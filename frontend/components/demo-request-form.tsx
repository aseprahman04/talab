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
  desiredPlan: 'Business',
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
        text: 'Demo request submitted. Our team will follow up within business hours.',
      });
      setForm(initialState);
    } catch (error) {
      setStatus({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Failed to submit demo request.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="demo-form" onSubmit={handleSubmit}>
      <label className="field-block">
        <span>Name</span>
        <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Point of contact name" required />
      </label>
      <label className="field-block">
        <span>Email</span>
        <input type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} placeholder="you@company.com" required />
      </label>
      <label className="field-block">
        <span>WhatsApp number</span>
        <input value={form.phoneNumber} onChange={(event) => setForm((prev) => ({ ...prev, phoneNumber: event.target.value }))} placeholder="62812xxxxxx" />
      </label>
      <label className="field-block">
        <span>Company</span>
        <input value={form.companyName} onChange={(event) => setForm((prev) => ({ ...prev, companyName: event.target.value }))} placeholder="Acme Corp" />
      </label>
      <label className="field-block">
        <span>Target plan</span>
        <select value={form.desiredPlan} onChange={(event) => setForm((prev) => ({ ...prev, desiredPlan: event.target.value }))}>
          <option value="Free">Free</option>
          <option value="Business">Business</option>
          <option value="Team">Team</option>
        </select>
      </label>
      <label className="field-block span-2">
        <span>Main use case</span>
        <textarea rows={4} value={form.useCase} onChange={(event) => setForm((prev) => ({ ...prev, useCase: event.target.value }))} placeholder="e.g. payment reminders + sales follow-up notifications" />
      </label>
      <div className="span-2 button-row">
        <button className="button-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit demo request'}
        </button>
      </div>
      {status.text ? <p className={status.tone === 'success' ? 'form-note success' : 'form-note error'}>{status.text}</p> : null}
    </form>
  );
}
