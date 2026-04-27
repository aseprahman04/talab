'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { apiRequest, type AuthTokens, formatDateTime } from '../lib/api';
import type { Device } from '../lib/api';

type SessionState = AuthTokens & { email?: string; name?: string };

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'An unexpected error occurred.';
}

function statusTone(status: string) {
  const n = status.toUpperCase();
  if (['PAID', 'DONE', 'MATCHED', 'APPROVED', 'AUTO_MATCHED'].includes(n)) return 'status-success';
  if (['PROCESSING', 'AWAITING_PAYMENT', 'PROOF_UPLOADED', 'NEEDS_REVIEW', 'LOW_CONFIDENCE'].includes(n)) return 'status-warning';
  if (['CANCELLED', 'REJECTED', 'MISMATCH'].includes(n)) return 'status-danger';
  return 'status-info';
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="metric-pill"><span>{label}</span><strong>{value}</strong></div>;
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return <div className="section-heading"><h3>{title}</h3><p>{subtitle}</p></div>;
}

interface OrderItem { id: string; name: string; price: number; qty: number }
interface Order {
  id: string; contactName: string; contactPhone: string; status: string;
  totalAmount: number; notes?: string; items: OrderItem[];
  invoice?: { id: string; invoiceNo: string; status: string } | null;
  createdAt: string;
}

interface Invoice {
  id: string; invoiceNo: string; totalAmount: number; vatRate: number;
  vatAmount: number; status: string; issuedAt: string;
  order: { contactName: string; contactPhone: string; status: string };
  paymentProofs: Array<{ id: string; status: string }>;
}

interface PaymentProof {
  id: string; imageUrl: string; ocrAmount: number | null; ocrRef: string | null;
  matchScore: number | null; status: string; createdAt: string;
}

// ── TalabOverview ────────────────────────────────────────────────────────────

export function TalabOverview({ devices, selectedWorkspaceId, session }: { devices: Device[]; selectedWorkspaceId: string; session: SessionState }) {
  const [stats, setStats] = useState<{ orders: number; invoices: number; pendingPayments: number } | null>(null);

  useEffect(() => {
    if (!selectedWorkspaceId || !session?.accessToken) return;
    Promise.all([
      apiRequest(`/workspaces/${selectedWorkspaceId}/orders`, {}, session.accessToken),
      apiRequest(`/workspaces/${selectedWorkspaceId}/invoices`, {}, session.accessToken),
    ]).then(([orders, invoices]) => {
      const o = orders as Order[];
      const inv = invoices as Invoice[];
      setStats({
        orders: o.length,
        invoices: inv.length,
        pendingPayments: inv.filter(i => ['PROOF_UPLOADED', 'NEEDS_REVIEW', 'UNPAID'].includes(i.status)).length,
      });
    }).catch(() => {});
  }, [selectedWorkspaceId, session?.accessToken]);

  return (
    <div className="panel-grid">
      <section className="panel glass-panel">
        <SectionHeading title="Dashboard" subtitle="Your Talab sales overview." />
        <div className="hero-metrics compact">
          <Metric label="Total Orders" value={stats ? String(stats.orders) : '—'} />
          <Metric label="Invoices" value={stats ? String(stats.invoices) : '—'} />
          <Metric label="Pending Payments" value={stats ? String(stats.pendingPayments) : '—'} />
          <Metric label="Devices" value={String(devices.length)} />
        </div>
      </section>
    </div>
  );
}

// ── OrdersPanel ──────────────────────────────────────────────────────────────

export function OrdersPanel({ selectedWorkspaceId, session, pushFeedback }: { selectedWorkspaceId: string; session: SessionState; pushFeedback: (tone: 'success' | 'error' | 'info', text: string) => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [form, setForm] = useState({ contactName: '', contactPhone: '', notes: '', items: [{ name: '', price: '', qty: '1' }] });
  const [isLoading, setIsLoading] = useState(false);

  const load = async () => {
    if (!selectedWorkspaceId || !session?.accessToken) return;
    try { setOrders(await apiRequest(`/workspaces/${selectedWorkspaceId}/orders`, {}, session.accessToken) as Order[]); } catch {}
  };

  useEffect(() => { void load(); }, [selectedWorkspaceId]);

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { name: '', price: '', qty: '1' }] }));
  const removeItem = (i: number) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i: number, field: string, val: string) =>
    setForm(f => ({ ...f, items: f.items.map((item, idx) => idx === i ? { ...item, [field]: val } : item) }));

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedWorkspaceId) return;
    setIsLoading(true);
    try {
      await apiRequest(`/workspaces/${selectedWorkspaceId}/orders`, {
        method: 'POST',
        body: JSON.stringify({
          contactName: form.contactName,
          contactPhone: form.contactPhone,
          notes: form.notes,
          items: form.items.map(i => ({ name: i.name, price: Number(i.price), qty: Number(i.qty) })),
        }),
      }, session.accessToken);
      setForm({ contactName: '', contactPhone: '', notes: '', items: [{ name: '', price: '', qty: '1' }] });
      pushFeedback('success', 'Order created.');
      await load();
    } catch (err) { pushFeedback('error', getErrorMessage(err)); }
    setIsLoading(false);
  };

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await apiRequest(`/workspaces/${selectedWorkspaceId}/orders/${orderId}/status`, {
        method: 'PATCH', body: JSON.stringify({ status }),
      }, session.accessToken);
      pushFeedback('success', `Status updated to ${status}`);
      await load();
    } catch (err) { pushFeedback('error', getErrorMessage(err)); }
  };

  return (
    <section className="panel glass-panel">
      <SectionHeading title="Orders" subtitle="Create and manage customer orders from WhatsApp chats." />

      <form className="stack-form compact" onSubmit={onSubmit}>
        <div className="form-grid">
          <label className="field-block">
            <span>Customer name</span>
            <input value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} placeholder="Ahmed Al-Rashid" required />
          </label>
          <label className="field-block">
            <span>Phone</span>
            <input value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} placeholder="+966512345678" required />
          </label>
        </div>

        <div style={{ marginTop: '12px' }}>
          <span className="eyebrow" style={{ display: 'block', marginBottom: '8px' }}>Order items</span>
          {form.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
              <input value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} placeholder="Item name" required style={{ flex: 2, padding: '8px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--paper)', color: 'var(--ink)' }} />
              <input value={item.price} onChange={e => updateItem(i, 'price', e.target.value)} placeholder="Price" type="number" min="0" step="0.01" required style={{ flex: 1, padding: '8px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--paper)', color: 'var(--ink)' }} />
              <input value={item.qty} onChange={e => updateItem(i, 'qty', e.target.value)} placeholder="Qty" type="number" min="1" required style={{ width: '64px', padding: '8px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--paper)', color: 'var(--ink)' }} />
              {form.items.length > 1 && <button type="button" className="mini-button" onClick={() => removeItem(i)} style={{ flexShrink: 0 }}>×</button>}
            </div>
          ))}
        </div>

        <div className="button-row">
          <button type="button" className="button-ghost" onClick={addItem}>+ Add item</button>
          <button className="button-primary" disabled={!selectedWorkspaceId || isLoading} type="submit">
            {isLoading ? 'Creating...' : 'Create Order'}
          </button>
        </div>
      </form>

      <div className="table-wrap" style={{ marginTop: '24px' }}>
        <table>
          <thead>
            <tr><th>Customer</th><th>Phone</th><th>Items</th><th>Total</th><th>Status</th><th>Invoice</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {orders.length ? orders.map(o => (
              <tr key={o.id}>
                <td><strong>{o.contactName}</strong></td>
                <td>{o.contactPhone}</td>
                <td>{o.items?.length ?? 0} items</td>
                <td>{Number(o.totalAmount).toFixed(2)}</td>
                <td><span className={`status-chip ${statusTone(o.status)}`}>{o.status}</span></td>
                <td>{o.invoice ? <span className="status-chip status-info">{o.invoice.invoiceNo}</span> : <span className="helper-copy">—</span>}</td>
                <td>
                  <div className="action-row">
                    {o.status === 'PENDING' && <button className="mini-button" onClick={() => updateStatus(o.id, 'PROCESSING')} type="button">Process</button>}
                    {o.status === 'PROCESSING' && <button className="mini-button" onClick={() => updateStatus(o.id, 'AWAITING_PAYMENT')} type="button">Await Pay</button>}
                    {o.status === 'PAID' && <button className="mini-button accent" onClick={() => updateStatus(o.id, 'DONE')} type="button">Done</button>}
                  </div>
                </td>
              </tr>
            )) : <tr><td colSpan={7} className="empty-table">No orders yet. Create one above.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ── InvoicesPanel ────────────────────────────────────────────────────────────

export function InvoicesPanel({ selectedWorkspaceId, session, pushFeedback }: { selectedWorkspaceId: string; session: SessionState; pushFeedback: (tone: 'success' | 'error' | 'info', text: string) => void }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [form, setForm] = useState({ orderId: '', vatRate: '0' });
  const [isLoading, setIsLoading] = useState(false);

  const load = async () => {
    if (!selectedWorkspaceId || !session?.accessToken) return;
    try {
      const [inv, ord] = await Promise.all([
        apiRequest(`/workspaces/${selectedWorkspaceId}/invoices`, {}, session.accessToken),
        apiRequest(`/workspaces/${selectedWorkspaceId}/orders`, {}, session.accessToken),
      ]);
      setInvoices(inv as Invoice[]);
      setOrders((ord as Order[]).filter(o => !o.invoice));
    } catch {}
  };

  useEffect(() => { void load(); }, [selectedWorkspaceId]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await apiRequest(`/workspaces/${selectedWorkspaceId}/invoices`, {
        method: 'POST',
        body: JSON.stringify({ orderId: form.orderId, vatRate: Number(form.vatRate) }),
      }, session.accessToken);
      setForm({ orderId: '', vatRate: '0' });
      pushFeedback('success', 'Invoice generated.');
      await load();
    } catch (err) { pushFeedback('error', getErrorMessage(err)); }
    setIsLoading(false);
  };

  return (
    <section className="panel glass-panel">
      <SectionHeading title="Invoices" subtitle="Generate branded invoices from orders and send to customers." />

      <form className="form-grid" onSubmit={onSubmit}>
        <label className="field-block">
          <span>Order (without invoice)</span>
          <select value={form.orderId} onChange={e => setForm(f => ({ ...f, orderId: e.target.value }))} required>
            <option value="">Select order</option>
            {orders.map(o => <option key={o.id} value={o.id}>{o.contactName} — {Number(o.totalAmount).toFixed(2)}</option>)}
          </select>
        </label>
        <label className="field-block">
          <span>VAT % (optional)</span>
          <input value={form.vatRate} onChange={e => setForm(f => ({ ...f, vatRate: e.target.value }))} type="number" min="0" max="100" />
        </label>
        <button className="button-primary" disabled={!selectedWorkspaceId || isLoading} type="submit">
          {isLoading ? 'Generating...' : 'Generate Invoice'}
        </button>
      </form>

      <div className="table-wrap" style={{ marginTop: '24px' }}>
        <table>
          <thead>
            <tr><th>Invoice #</th><th>Customer</th><th>Total</th><th>VAT</th><th>Status</th><th>Proofs</th><th>Date</th></tr>
          </thead>
          <tbody>
            {invoices.length ? invoices.map(inv => (
              <tr key={inv.id}>
                <td><strong>{inv.invoiceNo}</strong></td>
                <td>{inv.order?.contactName}</td>
                <td>{Number(inv.totalAmount).toFixed(2)}</td>
                <td>{inv.vatRate > 0 ? `${inv.vatRate}%` : '—'}</td>
                <td><span className={`status-chip ${statusTone(inv.status)}`}>{inv.status}</span></td>
                <td>{inv.paymentProofs?.length ?? 0}</td>
                <td>{formatDateTime(inv.issuedAt)}</td>
              </tr>
            )) : <tr><td colSpan={7} className="empty-table">No invoices yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ── PaymentsPanel ────────────────────────────────────────────────────────────

export function PaymentsPanel({ selectedWorkspaceId, session, pushFeedback }: { selectedWorkspaceId: string; session: SessionState; pushFeedback: (tone: 'success' | 'error' | 'info', text: string) => void }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [form, setForm] = useState({ invoiceId: '', imageUrl: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [proofs, setProofs] = useState<PaymentProof[]>([]);

  const load = async () => {
    if (!selectedWorkspaceId || !session?.accessToken) return;
    try { setInvoices(await apiRequest(`/workspaces/${selectedWorkspaceId}/invoices`, {}, session.accessToken) as Invoice[]); } catch {}
  };

  const loadProofs = async (invoiceId: string) => {
    if (!invoiceId) return;
    try {
      setProofs(await apiRequest(`/workspaces/${selectedWorkspaceId}/payment-proofs/invoice/${invoiceId}`, {}, session.accessToken) as PaymentProof[]);
    } catch {}
  };

  useEffect(() => { void load(); }, [selectedWorkspaceId]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await apiRequest(`/workspaces/${selectedWorkspaceId}/payment-proofs`, {
        method: 'POST',
        body: JSON.stringify({ invoiceId: form.invoiceId, imageUrl: form.imageUrl }),
      }, session.accessToken) as { matchStatus: string };
      pushFeedback(result.matchStatus === 'MATCHED' ? 'success' : 'info', `OCR result: ${result.matchStatus}`);
      setForm(f => ({ ...f, imageUrl: '' }));
      await loadProofs(form.invoiceId);
      await load();
    } catch (err) { pushFeedback('error', getErrorMessage(err)); }
    setIsLoading(false);
  };

  const approve = async (proofId: string) => {
    try {
      await apiRequest(`/workspaces/${selectedWorkspaceId}/payment-proofs/${proofId}/approve`, { method: 'PATCH' }, session.accessToken);
      pushFeedback('success', 'Payment approved. Order marked PAID.');
      await load();
      await loadProofs(form.invoiceId);
    } catch (err) { pushFeedback('error', getErrorMessage(err)); }
  };

  const reject = async (proofId: string) => {
    try {
      await apiRequest(`/workspaces/${selectedWorkspaceId}/payment-proofs/${proofId}/reject`, { method: 'PATCH' }, session.accessToken);
      pushFeedback('info', 'Proof rejected.');
      await loadProofs(form.invoiceId);
    } catch (err) { pushFeedback('error', getErrorMessage(err)); }
  };

  return (
    <section className="panel glass-panel">
      <SectionHeading title="Payment Verification" subtitle="Upload payment proof, OCR extracts amount, system auto-matches to invoice." />

      <form className="form-grid" onSubmit={onSubmit}>
        <label className="field-block">
          <span>Invoice</span>
          <select value={form.invoiceId} onChange={e => { setForm(f => ({ ...f, invoiceId: e.target.value })); void loadProofs(e.target.value); }} required>
            <option value="">Select invoice</option>
            {invoices.map(inv => (
              <option key={inv.id} value={inv.id}>{inv.invoiceNo} — {Number(inv.totalAmount).toFixed(2)} ({inv.status})</option>
            ))}
          </select>
        </label>
        <label className="field-block">
          <span>Payment proof image URL</span>
          <input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." required />
        </label>
        <div className="span-2 button-row">
          <button className="button-primary" disabled={!selectedWorkspaceId || isLoading} type="submit">
            {isLoading ? 'Processing OCR...' : 'Upload & Verify'}
          </button>
          <span className="helper-copy">OCR extracts amount, date, reference from image</span>
        </div>
      </form>

      {proofs.length > 0 && (
        <div className="table-wrap" style={{ marginTop: '24px' }}>
          <table>
            <thead>
              <tr><th>Proof</th><th>OCR Amount</th><th>OCR Ref</th><th>Confidence</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {proofs.map(p => (
                <tr key={p.id}>
                  <td><a href={p.imageUrl} target="_blank" rel="noreferrer" className="link-accent">View image</a></td>
                  <td>{p.ocrAmount != null ? Number(p.ocrAmount).toFixed(2) : '—'}</td>
                  <td>{p.ocrRef ?? '—'}</td>
                  <td>{p.matchScore != null ? `${Math.round(p.matchScore * 100)}%` : '—'}</td>
                  <td><span className={`status-chip ${statusTone(p.status)}`}>{p.status}</span></td>
                  <td>
                    <div className="action-row">
                      {['MATCHED', 'MISMATCH', 'NEEDS_REVIEW', 'LOW_CONFIDENCE'].includes(p.status) && (
                        <>
                          <button className="mini-button accent" onClick={() => approve(p.id)} type="button">Approve</button>
                          <button className="mini-button" onClick={() => reject(p.id)} type="button">Reject</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
