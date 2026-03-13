'use client';

import { FormEvent, startTransition, useDeferredValue, useEffect, useState } from 'react';
import {
  apiBaseUrl,
  apiRequest,
  AuthTokens,
  AutoReplyRule,
  Broadcast,
  Device,
  formatDateTime,
  Message,
  Webhook,
  WorkspaceMembership,
} from '../lib/api';

type AuthMode = 'login' | 'register';

type SessionState = AuthTokens & {
  email?: string;
  name?: string;
};

const sessionStorageKey = 'watether.console.session';
const workspaceStorageKey = 'watether.console.workspace';

export default function HomePage() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [session, setSession] = useState<SessionState | null>(null);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [workspaceForm, setWorkspaceForm] = useState({ name: '', slug: '' });
  const [deviceForm, setDeviceForm] = useState({ name: '' });
  const [messageForm, setMessageForm] = useState({ deviceId: '', target: '', type: 'TEXT', message: '', mediaUrl: '' });
  const [webhookForm, setWebhookForm] = useState({ name: '', url: '', secret: '' });
  const [broadcastForm, setBroadcastForm] = useState({ deviceId: '', name: '', messageTemplate: '', recipientsText: '' });
  const [autoReplyForm, setAutoReplyForm] = useState({ deviceId: '', name: '', matchType: 'contains', keyword: '', response: '', priority: '10' });
  const [workspaces, setWorkspaces] = useState<WorkspaceMembership[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [devices, setDevices] = useState<Device[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [autoReplies, setAutoReplies] = useState<AutoReplyRule[]>([]);
  const [recentBroadcasts, setRecentBroadcasts] = useState<Broadcast[]>([]);
  const [generatedToken, setGeneratedToken] = useState<{ deviceName: string; token: string } | null>(null);
  const [messageSearch, setMessageSearch] = useState('');
  const deferredMessageSearch = useDeferredValue(messageSearch);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const rawSession = window.localStorage.getItem(sessionStorageKey);
    const rawWorkspace = window.localStorage.getItem(workspaceStorageKey);

    if (rawSession) {
      try {
        setSession(JSON.parse(rawSession) as SessionState);
      } catch {
        window.localStorage.removeItem(sessionStorageKey);
      }
    }

    if (rawWorkspace) {
      setSelectedWorkspaceId(rawWorkspace);
    }
  }, []);

  useEffect(() => {
    if (!session) {
      window.localStorage.removeItem(sessionStorageKey);
      return;
    }

    window.localStorage.setItem(sessionStorageKey, JSON.stringify(session));
  }, [session]);

  useEffect(() => {
    if (!selectedWorkspaceId) {
      window.localStorage.removeItem(workspaceStorageKey);
      return;
    }

    window.localStorage.setItem(workspaceStorageKey, selectedWorkspaceId);
  }, [selectedWorkspaceId]);

  useEffect(() => {
    if (!session?.accessToken) return;
    void loadWorkspaces(session.accessToken);
  }, [session?.accessToken]);

  useEffect(() => {
    if (!session?.accessToken || !selectedWorkspaceId) return;
    void refreshWorkspaceData(selectedWorkspaceId, session.accessToken);
  }, [selectedWorkspaceId, session?.accessToken]);

  const filteredMessages = messages.filter((entry) => {
    const query = deferredMessageSearch.trim().toLowerCase();
    if (!query) return true;
    return [entry.content, entry.recipient, entry.sender, entry.status, entry.type]
      .filter(Boolean)
      .some((value) => value?.toLowerCase().includes(query));
  });

  const selectedWorkspace = workspaces.find((item) => item.workspace.id === selectedWorkspaceId) ?? null;

  async function loadWorkspaces(accessToken: string) {
    setIsRefreshing(true);

    try {
      const data = await apiRequest<WorkspaceMembership[]>('/workspaces', undefined, accessToken);
      startTransition(() => {
        setWorkspaces(data);

        if (!data.length) {
          setSelectedWorkspaceId('');
          setDevices([]);
          setMessages([]);
          setWebhooks([]);
          setAutoReplies([]);
          return;
        }

        const exists = data.some((item) => item.workspace.id === selectedWorkspaceId);
        if (!selectedWorkspaceId || !exists) {
          setSelectedWorkspaceId(data[0].workspace.id);
        }
      });
    } catch (error) {
      pushFeedback('error', getErrorMessage(error));
    } finally {
      setIsRefreshing(false);
    }
  }

  async function refreshWorkspaceData(workspaceId: string, accessToken: string) {
    setIsRefreshing(true);

    try {
      const [deviceData, messageData, webhookData, autoReplyData] = await Promise.all([
        apiRequest<Device[]>(`/devices?workspaceId=${workspaceId}`, undefined, accessToken),
        apiRequest<Message[]>(`/messages?workspaceId=${workspaceId}`, undefined, accessToken),
        apiRequest<Webhook[]>(`/webhooks?workspaceId=${workspaceId}`, undefined, accessToken),
        apiRequest<AutoReplyRule[]>(`/auto-replies?workspaceId=${workspaceId}`, undefined, accessToken),
      ]);

      startTransition(() => {
        setDevices(deviceData);
        setMessages(messageData);
        setWebhooks(webhookData);
        setAutoReplies(autoReplyData);

        if (!messageForm.deviceId && deviceData[0]) {
          setMessageForm((current) => ({ ...current, deviceId: deviceData[0].id }));
        }

        if (!broadcastForm.deviceId && deviceData[0]) {
          setBroadcastForm((current) => ({ ...current, deviceId: deviceData[0].id }));
        }

        if (!autoReplyForm.deviceId && deviceData[0]) {
          setAutoReplyForm((current) => ({ ...current, deviceId: deviceData[0].id }));
        }
      });
    } catch (error) {
      pushFeedback('error', getErrorMessage(error));
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    try {
      const path = authMode === 'login' ? '/auth/login' : '/auth/register';
      const payload = authMode === 'login'
        ? { email: authForm.email, password: authForm.password }
        : { name: authForm.name, email: authForm.email, password: authForm.password };

      const result = await apiRequest<AuthTokens>(path, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setSession({ ...result, email: authForm.email, name: authForm.name });
      setAuthForm({ name: '', email: authForm.email, password: '' });
      pushFeedback('success', authMode === 'login' ? 'Login berhasil.' : 'Akun berhasil dibuat.');
    } catch (error) {
      pushFeedback('error', getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleWorkspaceCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.accessToken) return;

    setIsLoading(true);
    try {
      await apiRequest('/workspaces', {
        method: 'POST',
        body: JSON.stringify(workspaceForm),
      }, session.accessToken);

      setWorkspaceForm({ name: '', slug: '' });
      pushFeedback('success', 'Workspace baru berhasil dibuat.');
      await loadWorkspaces(session.accessToken);
    } catch (error) {
      pushFeedback('error', getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeviceCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.accessToken || !selectedWorkspaceId) return;

    setIsLoading(true);
    try {
      await apiRequest('/devices', {
        method: 'POST',
        body: JSON.stringify({ workspaceId: selectedWorkspaceId, name: deviceForm.name }),
      }, session.accessToken);

      setDeviceForm({ name: '' });
      pushFeedback('success', 'Device berhasil ditambahkan.');
      await refreshWorkspaceData(selectedWorkspaceId, session.accessToken);
    } catch (error) {
      pushFeedback('error', getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeviceAction(deviceId: string, action: 'pair' | 'reconnect') {
    if (!session?.accessToken || !selectedWorkspaceId) return;

    try {
      const result = await apiRequest<{ status?: string; qrCode?: string }>(`/devices/${deviceId}/${action}`, {
        method: 'POST',
      }, session.accessToken);

      if (action === 'pair' && result.qrCode) {
        pushFeedback('info', `Stub QR siap: ${result.qrCode}`);
      } else {
        pushFeedback('success', `Device berhasil di-${action === 'pair' ? 'pair' : 'reconnect'}.`);
      }

      await refreshWorkspaceData(selectedWorkspaceId, session.accessToken);
    } catch (error) {
      pushFeedback('error', getErrorMessage(error));
    }
  }

  async function handleTokenCreate(device: Device) {
    if (!session?.accessToken) return;

    try {
      const result = await apiRequest<{ tokenId: string; token: string }>(`/devices/${device.id}/tokens`, {
        method: 'POST',
        body: JSON.stringify({ name: `${device.name} token` }),
      }, session.accessToken);

      setGeneratedToken({ deviceName: device.name, token: result.token });
      pushFeedback('success', `Token baru untuk ${device.name} berhasil dibuat.`);
    } catch (error) {
      pushFeedback('error', getErrorMessage(error));
    }
  }

  async function handleMessageSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.accessToken || !selectedWorkspaceId) return;

    setIsLoading(true);
    try {
      await apiRequest('/messages/send', {
        method: 'POST',
        body: JSON.stringify({
          workspaceId: selectedWorkspaceId,
          deviceId: messageForm.deviceId,
          target: messageForm.target,
          type: messageForm.type,
          message: messageForm.message,
          mediaUrl: messageForm.mediaUrl || undefined,
        }),
      }, session.accessToken);

      setMessageForm((current) => ({ ...current, target: '', message: '', mediaUrl: '' }));
      pushFeedback('success', 'Pesan berhasil masuk queue.');
      await refreshWorkspaceData(selectedWorkspaceId, session.accessToken);
    } catch (error) {
      pushFeedback('error', getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleWebhookCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.accessToken || !selectedWorkspaceId) return;

    setIsLoading(true);
    try {
      await apiRequest('/webhooks', {
        method: 'POST',
        body: JSON.stringify({ ...webhookForm, workspaceId: selectedWorkspaceId, isActive: true }),
      }, session.accessToken);

      setWebhookForm({ name: '', url: '', secret: '' });
      pushFeedback('success', 'Webhook baru berhasil dibuat.');
      await refreshWorkspaceData(selectedWorkspaceId, session.accessToken);
    } catch (error) {
      pushFeedback('error', getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleBroadcastCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.accessToken || !selectedWorkspaceId) return;

    const recipients = broadcastForm.recipientsText
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);

    setIsLoading(true);
    try {
      const broadcast = await apiRequest<Broadcast>('/broadcasts', {
        method: 'POST',
        body: JSON.stringify({
          workspaceId: selectedWorkspaceId,
          deviceId: broadcastForm.deviceId,
          name: broadcastForm.name,
          messageTemplate: broadcastForm.messageTemplate,
          recipients,
        }),
      }, session.accessToken);

      setBroadcastForm((current) => ({ ...current, name: '', messageTemplate: '', recipientsText: '' }));
      setRecentBroadcasts((current) => [broadcast, ...current].slice(0, 5));
      pushFeedback('success', 'Broadcast berhasil dibuat.');
    } catch (error) {
      pushFeedback('error', getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleBroadcastStart(broadcastId: string) {
    if (!session?.accessToken) return;

    try {
      await apiRequest(`/broadcasts/${broadcastId}/start`, { method: 'POST' }, session.accessToken);
      setRecentBroadcasts((current) => current.map((item) => (
        item.id === broadcastId ? { ...item, status: 'QUEUED' } : item
      )));
      pushFeedback('success', 'Broadcast dimasukkan ke queue.');
    } catch (error) {
      pushFeedback('error', getErrorMessage(error));
    }
  }

  async function handleAutoReplyCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.accessToken || !selectedWorkspaceId) return;

    setIsLoading(true);
    try {
      await apiRequest('/auto-replies', {
        method: 'POST',
        body: JSON.stringify({
          workspaceId: selectedWorkspaceId,
          deviceId: autoReplyForm.deviceId,
          name: autoReplyForm.name,
          matchType: autoReplyForm.matchType,
          keyword: autoReplyForm.keyword,
          response: autoReplyForm.response,
          priority: Number(autoReplyForm.priority),
          isEnabled: true,
        }),
      }, session.accessToken);

      setAutoReplyForm((current) => ({ ...current, name: '', keyword: '', response: '', priority: '10' }));
      pushFeedback('success', 'Auto-reply berhasil ditambahkan.');
      await refreshWorkspaceData(selectedWorkspaceId, session.accessToken);
    } catch (error) {
      pushFeedback('error', getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  function handleLogout() {
    setSession(null);
    setWorkspaces([]);
    setSelectedWorkspaceId('');
    setDevices([]);
    setMessages([]);
    setWebhooks([]);
    setAutoReplies([]);
    setRecentBroadcasts([]);
    setGeneratedToken(null);
    pushFeedback('info', 'Session lokal dibersihkan.');
  }

  function pushFeedback(tone: 'success' | 'error' | 'info', text: string) {
    setFeedback({ tone, text });
  }

  if (!session) {
    return (
      <main className="landing-shell">
        <section className="hero-card glass-panel">
          <div className="hero-copy">
            <span className="eyebrow">WATether Console</span>
            <h1>Dashboard operasional untuk device WhatsApp, queue pesan, dan webhook tenant.</h1>
            <p>
              Frontend ini sengaja dibuat mengikuti kondisi backend yang sudah benar-benar ada hari ini.
              Bukan layar palsu, melainkan control panel yang bisa register, login, buat workspace,
              tambah device, kirim pesan, atur webhook, broadcast, dan auto-reply.
            </p>

            <div className="hero-metrics">
              <Metric label="Stack" value="Next.js + NestJS" />
              <Metric label="API Base" value={apiBaseUrl.replace(/^https?:\/\//, '')} />
              <Metric label="Mode" value="Multi-tenant" />
            </div>
          </div>

          <div className="auth-panel">
            <div className="auth-switch">
              <button className={authMode === 'login' ? 'pill active' : 'pill'} onClick={() => setAuthMode('login')} type="button">Login</button>
              <button className={authMode === 'register' ? 'pill active' : 'pill'} onClick={() => setAuthMode('register')} type="button">Register</button>
            </div>

            <form className="stack-form" onSubmit={handleAuthSubmit}>
              {authMode === 'register' ? (
                <label className="field-block">
                  <span>Nama</span>
                  <input value={authForm.name} onChange={(event) => setAuthForm((current) => ({ ...current, name: event.target.value }))} placeholder="Asep Rahman" required />
                </label>
              ) : null}

              <label className="field-block">
                <span>Email</span>
                <input type="email" value={authForm.email} onChange={(event) => setAuthForm((current) => ({ ...current, email: event.target.value }))} placeholder="you@example.com" required />
              </label>

              <label className="field-block">
                <span>Password</span>
                <input type="password" value={authForm.password} onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))} placeholder="Minimal 8 karakter" required minLength={8} />
              </label>

              <button className="button-primary" disabled={isLoading} type="submit">
                {isLoading ? 'Memproses...' : authMode === 'login' ? 'Masuk ke Console' : 'Buat Akun'}
              </button>
            </form>

            {feedback ? <Feedback tone={feedback.tone} text={feedback.text} /> : null}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="console-shell">
      <aside className="workspace-rail glass-panel">
        <div className="rail-header">
          <span className="eyebrow">Console aktif</span>
          <h2>{session.email || 'Signed in'}</h2>
          <p>Pilih workspace, lalu operasikan device dan workflow tenant dari satu tempat.</p>
        </div>

        <form className="stack-form compact" onSubmit={handleWorkspaceCreate}>
          <label className="field-block">
            <span>Nama workspace</span>
            <input value={workspaceForm.name} onChange={(event) => setWorkspaceForm((current) => ({ ...current, name: event.target.value }))} placeholder="Ops Sales" required />
          </label>
          <label className="field-block">
            <span>Slug</span>
            <input value={workspaceForm.slug} onChange={(event) => setWorkspaceForm((current) => ({ ...current, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))} placeholder="ops-sales" required />
          </label>
          <button className="button-secondary" type="submit">Buat Workspace</button>
        </form>

        <div className="workspace-list">
          {workspaces.length ? workspaces.map((item) => (
            <button
              key={item.id}
              className={item.workspace.id === selectedWorkspaceId ? 'workspace-item active' : 'workspace-item'}
              onClick={() => setSelectedWorkspaceId(item.workspace.id)}
              type="button"
            >
              <strong>{item.workspace.name}</strong>
              <span>{item.workspace.slug}</span>
              <small>{item.role} · {item.workspace.status}</small>
            </button>
          )) : <p className="empty-copy">Belum ada workspace. Buat satu untuk mulai.</p>}
        </div>

        <div className="rail-actions">
          <button className="button-ghost" onClick={() => session.accessToken && loadWorkspaces(session.accessToken)} type="button">Refresh workspace</button>
          <button className="button-ghost danger" onClick={handleLogout} type="button">Logout lokal</button>
        </div>
      </aside>

      <section className="main-column">
        <header className="console-header glass-panel">
          <div>
            <span className="eyebrow">{selectedWorkspace?.workspace.slug || 'Pilih workspace'}</span>
            <h1>{selectedWorkspace?.workspace.name || 'Belum ada workspace aktif'}</h1>
            <p>Panel ini fokus pada endpoint yang sudah tersedia di backend saat ini.</p>
          </div>

          <div className="hero-metrics compact">
            <Metric label="Devices" value={String(devices.length)} />
            <Metric label="Messages" value={String(messages.length)} />
            <Metric label="Webhooks" value={String(webhooks.length)} />
            <Metric label="Auto Reply" value={String(autoReplies.length)} />
          </div>
        </header>

        {feedback ? <Feedback tone={feedback.tone} text={feedback.text} /> : null}

        {generatedToken ? (
          <section className="token-strip glass-panel">
            <div>
              <span className="eyebrow">Token baru</span>
              <strong>{generatedToken.deviceName}</strong>
            </div>
            <code>{generatedToken.token}</code>
          </section>
        ) : null}

        <div className="panel-grid">
          <section className="panel glass-panel">
            <SectionHeading title="Devices" subtitle="Buat device, start pairing stub, reconnect, dan generate token API." />
            <form className="stack-form compact" onSubmit={handleDeviceCreate}>
              <label className="field-block">
                <span>Nama device</span>
                <input value={deviceForm.name} onChange={(event) => setDeviceForm({ name: event.target.value })} placeholder="CS Jakarta 01" required />
              </label>
              <button className="button-secondary" disabled={!selectedWorkspaceId} type="submit">Tambah Device</button>
            </form>

            <div className="list-stack">
              {devices.length ? devices.map((device) => (
                <article className="card-row" key={device.id}>
                  <div>
                    <strong>{device.name}</strong>
                    <p>{device.phoneNumber || 'Nomor belum terhubung'}</p>
                    <small>{device.status} · Health {device.healthScore}</small>
                  </div>
                  <div className="action-row">
                    <button className="mini-button" onClick={() => handleDeviceAction(device.id, 'pair')} type="button">Pair</button>
                    <button className="mini-button" onClick={() => handleDeviceAction(device.id, 'reconnect')} type="button">Reconnect</button>
                    <button className="mini-button accent" onClick={() => handleTokenCreate(device)} type="button">Token</button>
                  </div>
                </article>
              )) : <p className="empty-copy">Belum ada device untuk workspace ini.</p>}
            </div>
          </section>

          <section className="panel glass-panel wide">
            <SectionHeading title="Send Message" subtitle="Mengirim request ke queue `message.send` dan membaca log message workspace." />
            <form className="form-grid" onSubmit={handleMessageSend}>
              <label className="field-block">
                <span>Device</span>
                <select value={messageForm.deviceId} onChange={(event) => setMessageForm((current) => ({ ...current, deviceId: event.target.value }))} required>
                  <option value="">Pilih device</option>
                  {devices.map((device) => <option key={device.id} value={device.id}>{device.name}</option>)}
                </select>
              </label>
              <label className="field-block">
                <span>Target</span>
                <input value={messageForm.target} onChange={(event) => setMessageForm((current) => ({ ...current, target: event.target.value }))} placeholder="6281234567890" required />
              </label>
              <label className="field-block">
                <span>Tipe</span>
                <select value={messageForm.type} onChange={(event) => setMessageForm((current) => ({ ...current, type: event.target.value }))}>
                  <option value="TEXT">TEXT</option>
                  <option value="IMAGE">IMAGE</option>
                  <option value="DOCUMENT">DOCUMENT</option>
                  <option value="AUDIO">AUDIO</option>
                  <option value="VIDEO">VIDEO</option>
                </select>
              </label>
              <label className="field-block span-2">
                <span>Pesan</span>
                <textarea rows={4} value={messageForm.message} onChange={(event) => setMessageForm((current) => ({ ...current, message: event.target.value }))} placeholder="Halo, pesanmu sudah diproses." required />
              </label>
              <label className="field-block span-2">
                <span>Media URL opsional</span>
                <input value={messageForm.mediaUrl} onChange={(event) => setMessageForm((current) => ({ ...current, mediaUrl: event.target.value }))} placeholder="https://cdn.example.com/file.pdf" />
              </label>
              <div className="span-2 button-row">
                <button className="button-primary" disabled={!selectedWorkspaceId} type="submit">Queue Message</button>
                <input className="search-input" value={messageSearch} onChange={(event) => setMessageSearch(event.target.value)} placeholder="Cari log message..." />
              </div>
            </form>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Waktu</th>
                    <th>Arah</th>
                    <th>Target / From</th>
                    <th>Tipe</th>
                    <th>Status</th>
                    <th>Konten</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMessages.length ? filteredMessages.map((entry) => (
                    <tr key={entry.id}>
                      <td>{formatDateTime(entry.createdAt)}</td>
                      <td>{entry.direction}</td>
                      <td>{entry.recipient || entry.sender || '-'}</td>
                      <td>{entry.type}</td>
                      <td><span className={`status-chip ${statusTone(entry.status)}`}>{entry.status}</span></td>
                      <td>{entry.content || entry.errorMessage || '-'}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="empty-table">Belum ada message log untuk filter ini.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel glass-panel">
            <SectionHeading title="Webhooks" subtitle="Buat endpoint callback tenant yang akan dipakai worker webhook." />
            <form className="stack-form compact" onSubmit={handleWebhookCreate}>
              <label className="field-block"><span>Nama</span><input value={webhookForm.name} onChange={(event) => setWebhookForm((current) => ({ ...current, name: event.target.value }))} placeholder="Main webhook" required /></label>
              <label className="field-block"><span>URL</span><input value={webhookForm.url} onChange={(event) => setWebhookForm((current) => ({ ...current, url: event.target.value }))} placeholder="https://example.com/webhook" required /></label>
              <label className="field-block"><span>Secret</span><input value={webhookForm.secret} onChange={(event) => setWebhookForm((current) => ({ ...current, secret: event.target.value }))} placeholder="supersecretkey" required /></label>
              <button className="button-secondary" disabled={!selectedWorkspaceId} type="submit">Tambah Webhook</button>
            </form>

            <div className="list-stack compact-list">
              {webhooks.length ? webhooks.map((hook) => (
                <article className="card-row slim" key={hook.id}>
                  <div>
                    <strong>{hook.name}</strong>
                    <p>{hook.url}</p>
                    <small>{hook.isActive ? 'Aktif' : 'Nonaktif'} · {formatDateTime(hook.createdAt)}</small>
                  </div>
                </article>
              )) : <p className="empty-copy">Belum ada webhook aktif.</p>}
            </div>
          </section>

          <section className="panel glass-panel">
            <SectionHeading title="Broadcast" subtitle="Create dan start broadcast memakai endpoint yang saat ini tersedia." />
            <form className="stack-form compact" onSubmit={handleBroadcastCreate}>
              <label className="field-block">
                <span>Device</span>
                <select value={broadcastForm.deviceId} onChange={(event) => setBroadcastForm((current) => ({ ...current, deviceId: event.target.value }))} required>
                  <option value="">Pilih device</option>
                  {devices.map((device) => <option key={device.id} value={device.id}>{device.name}</option>)}
                </select>
              </label>
              <label className="field-block"><span>Nama campaign</span><input value={broadcastForm.name} onChange={(event) => setBroadcastForm((current) => ({ ...current, name: event.target.value }))} placeholder="Promo Jumat" required /></label>
              <label className="field-block"><span>Template pesan</span><textarea rows={3} value={broadcastForm.messageTemplate} onChange={(event) => setBroadcastForm((current) => ({ ...current, messageTemplate: event.target.value }))} placeholder="Halo, ada promo baru hari ini." required /></label>
              <label className="field-block"><span>Recipients</span><textarea rows={4} value={broadcastForm.recipientsText} onChange={(event) => setBroadcastForm((current) => ({ ...current, recipientsText: event.target.value }))} placeholder="6281234567890&#10;6289876543210" required /></label>
              <button className="button-secondary" disabled={!selectedWorkspaceId} type="submit">Buat Broadcast</button>
            </form>

            <div className="list-stack compact-list">
              {recentBroadcasts.length ? recentBroadcasts.map((item) => (
                <article className="card-row" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <p>{item.messageTemplate}</p>
                    <small>{item.totalTargets} recipients · {item.status}</small>
                  </div>
                  <button className="mini-button accent" onClick={() => handleBroadcastStart(item.id)} type="button">Start</button>
                </article>
              )) : <p className="empty-copy">Belum ada broadcast yang dibuat dari console ini.</p>}
            </div>
          </section>

          <section className="panel glass-panel wide">
            <SectionHeading title="Auto Reply" subtitle="Rule sederhana per device untuk keyword-based response." />
            <form className="form-grid" onSubmit={handleAutoReplyCreate}>
              <label className="field-block">
                <span>Device</span>
                <select value={autoReplyForm.deviceId} onChange={(event) => setAutoReplyForm((current) => ({ ...current, deviceId: event.target.value }))} required>
                  <option value="">Pilih device</option>
                  {devices.map((device) => <option key={device.id} value={device.id}>{device.name}</option>)}
                </select>
              </label>
              <label className="field-block">
                <span>Nama rule</span>
                <input value={autoReplyForm.name} onChange={(event) => setAutoReplyForm((current) => ({ ...current, name: event.target.value }))} placeholder="Order keyword" required />
              </label>
              <label className="field-block">
                <span>Match type</span>
                <select value={autoReplyForm.matchType} onChange={(event) => setAutoReplyForm((current) => ({ ...current, matchType: event.target.value }))}>
                  <option value="contains">contains</option>
                  <option value="exact">exact</option>
                </select>
              </label>
              <label className="field-block">
                <span>Priority</span>
                <input value={autoReplyForm.priority} onChange={(event) => setAutoReplyForm((current) => ({ ...current, priority: event.target.value }))} type="number" min="0" max="100" required />
              </label>
              <label className="field-block span-2">
                <span>Keyword</span>
                <input value={autoReplyForm.keyword} onChange={(event) => setAutoReplyForm((current) => ({ ...current, keyword: event.target.value }))} placeholder="cek pesanan" required />
              </label>
              <label className="field-block span-2">
                <span>Response</span>
                <textarea rows={4} value={autoReplyForm.response} onChange={(event) => setAutoReplyForm((current) => ({ ...current, response: event.target.value }))} placeholder="Halo, silakan kirim nomor order Anda." required />
              </label>
              <div className="span-2 button-row">
                <button className="button-primary" disabled={!selectedWorkspaceId} type="submit">Tambah Rule</button>
                <span className="helper-copy">{isRefreshing ? 'Menyegarkan data workspace...' : 'Data workspace sinkron.'}</span>
              </div>
            </form>

            <div className="table-wrap compact-table">
              <table>
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Device</th>
                    <th>Keyword</th>
                    <th>Priority</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {autoReplies.length ? autoReplies.map((rule) => (
                    <tr key={rule.id}>
                      <td>{rule.name}</td>
                      <td>{devices.find((device) => device.id === rule.deviceId)?.name || rule.deviceId}</td>
                      <td>{rule.keyword}</td>
                      <td>{rule.priority}</td>
                      <td><span className={`status-chip ${rule.isEnabled ? 'status-success' : 'status-danger'}`}>{rule.isEnabled ? 'ENABLED' : 'DISABLED'}</span></td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="empty-table">Belum ada auto-reply rule.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-pill">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Feedback({ tone, text }: { tone: 'success' | 'error' | 'info'; text: string }) {
  return <div className={`feedback-banner ${tone}`}>{text}</div>;
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="section-heading">
      <h3>{title}</h3>
      <p>{subtitle}</p>
    </div>
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Terjadi kesalahan yang tidak dikenali.';
}

function statusTone(status: string) {
  const normalized = status.toUpperCase();
  if (['SENT', 'DELIVERED', 'READ', 'CONNECTED', 'RUNNING', 'COMPLETED'].includes(normalized)) return 'status-success';
  if (['PROCESSING', 'PAIRING', 'RECONNECTING', 'QUEUED'].includes(normalized)) return 'status-warning';
  return 'status-danger';
}