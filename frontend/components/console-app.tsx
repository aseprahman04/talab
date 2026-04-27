'use client';

import QRCode from 'qrcode';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Dispatch, FormEvent, SetStateAction, startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react';
import Logo from './logo';
import ThemeToggle from './theme-toggle';
import { TalabOverview, OrdersPanel, InvoicesPanel, PaymentsPanel } from './talab-panels';
import { io, Socket } from 'socket.io-client';
import {
  apiBaseUrl,
  apiRequest,
  AuthTokens,
  AutoReplyRule,
  Broadcast,
  Contact,
  ContactList,
  Device,
  formatDateTime,
  Message,
  ScheduledMessage,
  Webhook,
  WebhookDelivery,
  WorkspaceMembership,
} from '../lib/api';

type AuthMode = 'login' | 'register';
type ActiveSection = 'overview' | 'orders' | 'invoices' | 'payments' | 'inbox' | 'devices' | 'billing';
type SessionState = AuthTokens & { email?: string; name?: string };

const sessionStorageKey = 'talab.console.session';
const workspaceStorageKey = 'talab.console.workspace';

const navItems: Array<{ key: ActiveSection; label: string; href: string; badge?: string }> = [
  { key: 'overview', label: 'Dashboard', href: '/console' },
  { key: 'orders', label: '📦 Orders', href: '/orders' },
  { key: 'invoices', label: '🧾 Invoices', href: '/invoices' },
  { key: 'payments', label: '💳 Payments', href: '/payments' },
  { key: 'inbox', label: 'Inbox', href: '/messages' },
  { key: 'devices', label: 'Devices', href: '/devices' },
  { key: 'billing', label: 'Billing', href: '/billing' },
];

export function ConsoleApp({ activeSection }: { activeSection: ActiveSection }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [session, setSession] = useState<SessionState | null>(null);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [workspaceForm, setWorkspaceForm] = useState({ name: '', slug: '' });
  const [deviceForm, setDeviceForm] = useState({ name: '' });
  const [messageForm, setMessageForm] = useState({ deviceId: '', target: '', type: 'TEXT', message: '', mediaUrl: '' });
  const [webhookForm, setWebhookForm] = useState({ name: '', url: '', secret: '' });
  const [broadcastForm, setBroadcastForm] = useState({ deviceId: '', name: '', messageTemplate: '', recipientsText: '', contactListId: '' });
  const [autoReplyForm, setAutoReplyForm] = useState({ deviceId: '', name: '', matchType: 'contains', keyword: '', response: '', webhookUrl: '', useWebhook: false, priority: '10' });
  const [scheduledMessageForm, setScheduledMessageForm] = useState({ deviceId: '', name: '', type: 'TEXT', content: '', recipient: '', repeatType: 'DAILY', sendHour: '9', sendMinute: '0', dayOfWeek: '1', dayOfMonth: '1' });
  const [scheduledMessages, setScheduledMessages] = useState<ScheduledMessage[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceMembership[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [devices, setDevices] = useState<Device[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<Record<string, WebhookDelivery[]>>({});
  const [autoReplies, setAutoReplies] = useState<AutoReplyRule[]>([]);
  const [recentBroadcasts, setRecentBroadcasts] = useState<Broadcast[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [activeQrCode, setActiveQrCode] = useState<{ deviceId: string; dataUrl: string } | null>(null);
  const [generatedToken, setGeneratedToken] = useState<{ deviceName: string; token: string } | null>(null);
  const [messageSearch, setMessageSearch] = useState('');
  const deferredMessageSearch = useDeferredValue(messageSearch);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [liveState, setLiveState] = useState<'idle' | 'connecting' | 'live' | 'offline'>('idle');
  const [hydrated, setHydrated] = useState(false);
  const [subscription, setSubscription] = useState<{ status: string; plan: { code: string; name: string; price: number; maxDevices: number; monthlyMessageQuota: number; maxMembers: number } | null; renewsAt?: string | null } | null>(null);
  const [plans, setPlans] = useState<Array<{ id: string; code: string; name: string; price: number; maxDevices: number; monthlyMessageQuota: number; maxMembers: number; lemonSqueezyVariantId: string | null }>>([]);

  useEffect(() => {
    const rawSession = window.localStorage.getItem(sessionStorageKey);
    const rawWorkspace = window.localStorage.getItem(workspaceStorageKey);
    const searchParams = new URLSearchParams(window.location.search);
    const requestedMode = searchParams.get('mode');
    const billingReturn = searchParams.get('billing');

    if (requestedMode === 'register' || requestedMode === 'login') {
      setAuthMode(requestedMode);
    }

    if (billingReturn === '1') {
      router.replace('/billing');
    }

    // Handle Google OAuth redirect — tokens arrive via URL fragment to avoid server logs
    const hash = window.location.hash.slice(1);
    if (hash) {
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (accessToken && refreshToken) {
        setSession({ accessToken, refreshToken });
        // Clean the fragment from the URL without a page reload
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
        return;
      }
    }

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

    setHydrated(true);
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

  useEffect(() => {
    if (!selectedWorkspaceId) {
      setLiveState('idle');
      return;
    }

    setLiveState('connecting');
    const socketOrigin = apiBaseUrl.startsWith('/') ? window.location.origin : apiBaseUrl.replace(/\/api$/, '');
    const socket: Socket = io(socketOrigin, {
      transports: ['websocket'],
      query: { workspaceId: selectedWorkspaceId },
    });

    socket.on('connect', () => setLiveState('live'));
    socket.on('disconnect', () => setLiveState('offline'));

    const refreshFromRealtime = () => {
      if (session?.accessToken) {
        void refreshWorkspaceData(selectedWorkspaceId, session.accessToken, true);
      }
    };

    const handleDeviceStatusUpdated = (payload: { deviceId: string; status: string; qrCode?: string }) => {
      refreshFromRealtime();
      if (payload.qrCode) {
        QRCode.toDataURL(payload.qrCode, { width: 280, margin: 2 })
          .then((dataUrl) => setActiveQrCode({ deviceId: payload.deviceId, dataUrl }))
          .catch(() => {});
      } else if (payload.status !== 'PAIRING') {
        setActiveQrCode((prev) => (prev?.deviceId === payload.deviceId ? null : prev));
      }
    };

    socket.on('message.sent', refreshFromRealtime);
    socket.on('message.failed', refreshFromRealtime);
    socket.on('device.status.updated', handleDeviceStatusUpdated);

    return () => {
      socket.off('message.sent', refreshFromRealtime);
      socket.off('message.failed', refreshFromRealtime);
      socket.off('device.status.updated', handleDeviceStatusUpdated);
      socket.disconnect();
    };
  }, [selectedWorkspaceId, session?.accessToken]);

  const filteredMessages = useMemo(() => {
    const query = deferredMessageSearch.trim().toLowerCase();
    if (!query) return messages;
    return messages.filter((entry) => [entry.content, entry.recipient, entry.sender, entry.status, entry.type]
      .filter(Boolean)
      .some((value) => value?.toLowerCase().includes(query)));
  }, [deferredMessageSearch, messages]);

  const selectedWorkspace = workspaces.find((item) => item.workspace.id === selectedWorkspaceId) ?? null;

  useEffect(() => {
    if (!session?.accessToken) return;
    apiRequest<Array<{ id: string; code: string; name: string; price: number; maxDevices: number; monthlyMessageQuota: number; maxMembers: number; lemonSqueezyVariantId: string | null }>>('/subscriptions/plans')
      .then((data) => setPlans(data))
      .catch(() => {});
  }, [session?.accessToken]);

  useEffect(() => {
    if (!session?.accessToken || !selectedWorkspaceId) return;
    apiRequest<{ status: string; plan: { code: string; name: string; price: number; maxDevices: number; monthlyMessageQuota: number; maxMembers: number } | null; renewsAt?: string | null } | null>(`/subscriptions/${selectedWorkspaceId}`, undefined, session.accessToken)
      .then((data) => setSubscription(data))
      .catch(() => {});
  }, [selectedWorkspaceId, session?.accessToken, activeSection]);

  function refreshSubscription() {
    if (!session?.accessToken || !selectedWorkspaceId) return;
    apiRequest<{ status: string; plan: { code: string; name: string; price: number; maxDevices: number; monthlyMessageQuota: number; maxMembers: number } | null; renewsAt?: string | null } | null>(`/subscriptions/${selectedWorkspaceId}`, undefined, session.accessToken)
      .then((data) => setSubscription(data))
      .catch(() => {});
  }

  async function handleUpgrade(planCode: string) {
    if (!session?.accessToken || !selectedWorkspaceId) return;
    setIsLoading(true);
    try {
      const result = await apiRequest<{ url: string }>('/subscriptions/checkout', {
        method: 'POST',
        body: JSON.stringify({ workspaceId: selectedWorkspaceId, planCode }),
      }, session.accessToken);
      window.open(result.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      pushFeedback('error', getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

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
          setWebhookLogs({});
          setAutoReplies([]);
          setContacts([]);
          setContactLists([]);
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

  async function refreshWorkspaceData(workspaceId: string, accessToken: string, silent = false) {
    if (!silent) setIsRefreshing(true);
    try {
      const [deviceData, messageData, webhookData, autoReplyData, contactData, contactListData, scheduledMessageData] = await Promise.all([
        apiRequest<Device[]>(`/devices?workspaceId=${workspaceId}`, undefined, accessToken),
        apiRequest<Message[]>(`/messages?workspaceId=${workspaceId}`, undefined, accessToken),
        apiRequest<Webhook[]>(`/webhooks?workspaceId=${workspaceId}`, undefined, accessToken),
        apiRequest<AutoReplyRule[]>(`/auto-replies?workspaceId=${workspaceId}`, undefined, accessToken),
        apiRequest<Contact[]>(`/contacts?workspaceId=${workspaceId}`, undefined, accessToken),
        apiRequest<ContactList[]>(`/contacts/lists?workspaceId=${workspaceId}`, undefined, accessToken),
        apiRequest<ScheduledMessage[]>(`/scheduled-messages?workspaceId=${workspaceId}`, undefined, accessToken),
      ]);

      startTransition(() => {
        setDevices(deviceData);
        setMessages(messageData);
        setWebhooks(webhookData);
        setWebhookLogs({});
        setAutoReplies(autoReplyData);
        setContacts(contactData);
        setContactLists(contactListData);
        setScheduledMessages(scheduledMessageData);
        if (!messageForm.deviceId && deviceData[0]) setMessageForm((current) => ({ ...current, deviceId: deviceData[0].id }));
        if (!broadcastForm.deviceId && deviceData[0]) setBroadcastForm((current) => ({ ...current, deviceId: deviceData[0].id }));
        if (!autoReplyForm.deviceId && deviceData[0]) setAutoReplyForm((current) => ({ ...current, deviceId: deviceData[0].id }));
        if (!scheduledMessageForm.deviceId && deviceData[0]) setScheduledMessageForm((current) => ({ ...current, deviceId: deviceData[0].id }));
      });
    } catch (error) {
      pushFeedback('error', getErrorMessage(error));
    } finally {
      if (!silent) setIsRefreshing(false);
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
      const result = await apiRequest<AuthTokens>(path, { method: 'POST', body: JSON.stringify(payload) });
      setSession({ ...result, email: authForm.email, name: authForm.name });
      setAuthForm({ name: '', email: authForm.email, password: '' });
      pushFeedback('success', authMode === 'login' ? 'Signed in.' : 'Account created.');
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
      await apiRequest('/workspaces', { method: 'POST', body: JSON.stringify(workspaceForm) }, session.accessToken);
      setWorkspaceForm({ name: '', slug: '' });
      pushFeedback('success', 'Workspace created.');
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
      await apiRequest('/devices', { method: 'POST', body: JSON.stringify({ workspaceId: selectedWorkspaceId, name: deviceForm.name }) }, session.accessToken);
      setDeviceForm({ name: '' });
      pushFeedback('success', 'Device added.');
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
      if (action === 'pair') {
        setActiveQrCode(null);
      }
      await apiRequest(`/devices/${deviceId}/${action}`, { method: 'POST' }, session.accessToken);
      pushFeedback('info', action === 'pair' ? 'Starting pairing… Scan the QR code below.' : 'Reconnect started.');
      await refreshWorkspaceData(selectedWorkspaceId, session.accessToken);
    } catch (error) {
      pushFeedback('error', getErrorMessage(error));
    }
  }

  async function handleTokenCreate(device: Device) {
    if (!session?.accessToken) return;
    try {
      const result = await apiRequest<{ token: string }>(`/devices/${device.id}/tokens`, { method: 'POST', body: JSON.stringify({ name: `${device.name} token` }) }, session.accessToken);
      setGeneratedToken({ deviceName: device.name, token: result.token });
      pushFeedback('success', `New token for ${device.name} created.`);
    } catch (error) {
      pushFeedback('error', getErrorMessage(error));
    }
  }

  async function handleMessageSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.accessToken || !selectedWorkspaceId) return;
    setIsLoading(true);
    try {
      await apiRequest('/messages/send', { method: 'POST', body: JSON.stringify({ workspaceId: selectedWorkspaceId, deviceId: messageForm.deviceId, target: messageForm.target, type: messageForm.type, message: messageForm.message, mediaUrl: messageForm.mediaUrl || undefined }) }, session.accessToken);
      setMessageForm((current) => ({ ...current, target: '', message: '', mediaUrl: '' }));
      pushFeedback('success', 'Message queued.');
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
      await apiRequest('/webhooks', { method: 'POST', body: JSON.stringify({ ...webhookForm, workspaceId: selectedWorkspaceId, isActive: true }) }, session.accessToken);
      setWebhookForm({ name: '', url: '', secret: '' });
      pushFeedback('success', 'Webhook created.');
      await refreshWorkspaceData(selectedWorkspaceId, session.accessToken);
    } catch (error) {
      pushFeedback('error', getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleWebhookTest(webhookId: string) {
    if (!session?.accessToken) return;
    try {
      await apiRequest(`/webhooks/${webhookId}/test`, { method: 'POST' }, session.accessToken);
      pushFeedback('success', 'Webhook test queued.');
      await handleWebhookLogsLoad(webhookId);
    } catch (error) {
      pushFeedback('error', getErrorMessage(error));
    }
  }

  async function handleWebhookLogsLoad(webhookId: string) {
    if (!session?.accessToken) return;
    try {
      const logs = await apiRequest<WebhookDelivery[]>(`/webhooks/${webhookId}/logs?limit=10`, undefined, session.accessToken);
      startTransition(() => {
        setWebhookLogs((current) => ({ ...current, [webhookId]: logs }));
      });
    } catch (error) {
      pushFeedback('error', getErrorMessage(error));
    }
  }

  async function handleMessageRetry(messageId: string) {
    if (!session?.accessToken || !selectedWorkspaceId) return;
    try {
      await apiRequest(`/messages/${messageId}/retry`, { method: 'POST' }, session.accessToken);
      pushFeedback('success', 'Failed message requeued.');
      await refreshWorkspaceData(selectedWorkspaceId, session.accessToken);
    } catch (error) {
      pushFeedback('error', getErrorMessage(error));
    }
  }

  async function handleBroadcastCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.accessToken || !selectedWorkspaceId) return;
    const recipients = broadcastForm.recipientsText.split(/[,\n]/).map((item) => item.trim()).filter(Boolean);
    setIsLoading(true);
    try {
      const payload: Record<string, unknown> = {
        workspaceId: selectedWorkspaceId,
        deviceId: broadcastForm.deviceId,
        name: broadcastForm.name,
        messageTemplate: broadcastForm.messageTemplate,
      };
      if (broadcastForm.contactListId) {
        payload.contactListId = broadcastForm.contactListId;
      } else {
        payload.recipients = recipients;
      }
      const broadcast = await apiRequest<Broadcast>('/broadcasts', { method: 'POST', body: JSON.stringify(payload) }, session.accessToken);
      setBroadcastForm((current) => ({ ...current, name: '', messageTemplate: '', recipientsText: '', contactListId: '' }));
      setRecentBroadcasts((current) => [broadcast, ...current].slice(0, 5));
      pushFeedback('success', 'Broadcast created.');
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
      setRecentBroadcasts((current) => current.map((item) => item.id === broadcastId ? { ...item, status: 'QUEUED' } : item));
      pushFeedback('success', 'Broadcast queued.');
    } catch (error) {
      pushFeedback('error', getErrorMessage(error));
    }
  }

  async function handleAutoReplyCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.accessToken || !selectedWorkspaceId) return;
    setIsLoading(true);
    try {
      const body: Record<string, unknown> = { workspaceId: selectedWorkspaceId, deviceId: autoReplyForm.deviceId, name: autoReplyForm.name, matchType: autoReplyForm.matchType, keyword: autoReplyForm.keyword, priority: Number(autoReplyForm.priority), isEnabled: true };
      if (autoReplyForm.useWebhook) { body.webhookUrl = autoReplyForm.webhookUrl; } else { body.response = autoReplyForm.response; }
      await apiRequest('/auto-replies', { method: 'POST', body: JSON.stringify(body) }, session.accessToken);
      setAutoReplyForm((current) => ({ ...current, name: '', keyword: '', response: '', webhookUrl: '', priority: '10' }));
      pushFeedback('success', 'Auto-reply added.');
      await refreshWorkspaceData(selectedWorkspaceId, session.accessToken);
    } catch (error) {
      pushFeedback('error', getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleScheduledMessageCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.accessToken || !selectedWorkspaceId) return;
    setIsLoading(true);
    try {
      const body: Record<string, unknown> = {
        workspaceId: selectedWorkspaceId,
        deviceId: scheduledMessageForm.deviceId,
        name: scheduledMessageForm.name,
        type: scheduledMessageForm.type,
        content: scheduledMessageForm.content || undefined,
        recipient: scheduledMessageForm.recipient,
        repeatType: scheduledMessageForm.repeatType,
        sendHour: Number(scheduledMessageForm.sendHour),
        sendMinute: Number(scheduledMessageForm.sendMinute),
      };
      if (scheduledMessageForm.repeatType === 'WEEKLY') body.dayOfWeek = Number(scheduledMessageForm.dayOfWeek);
      if (scheduledMessageForm.repeatType === 'MONTHLY') body.dayOfMonth = Number(scheduledMessageForm.dayOfMonth);
      await apiRequest('/scheduled-messages', { method: 'POST', body: JSON.stringify(body) }, session.accessToken);
      setScheduledMessageForm((current) => ({ ...current, name: '', content: '', recipient: '' }));
      pushFeedback('success', 'Scheduled message created.');
      await refreshWorkspaceData(selectedWorkspaceId, session.accessToken);
    } catch (error) {
      pushFeedback('error', getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleScheduledMessageToggle(id: string, isEnabled: boolean) {
    if (!session?.accessToken) return;
    try {
      await apiRequest(`/scheduled-messages/${id}/toggle`, { method: 'PATCH', body: JSON.stringify({ isEnabled }) }, session.accessToken);
      await refreshWorkspaceData(selectedWorkspaceId, session.accessToken);
    } catch (error) {
      pushFeedback('error', getErrorMessage(error));
    }
  }

  async function handleScheduledMessageDelete(id: string) {
    if (!session?.accessToken) return;
    try {
      await apiRequest(`/scheduled-messages/${id}`, { method: 'DELETE' }, session.accessToken);
      await refreshWorkspaceData(selectedWorkspaceId, session.accessToken);
    } catch (error) {
      pushFeedback('error', getErrorMessage(error));
    }
  }

  function handleLogout() {
    setSession(null);
    setWorkspaces([]);
    setSelectedWorkspaceId('');
    setDevices([]);
    setMessages([]);
    setWebhooks([]);
    setWebhookLogs({});
    setAutoReplies([]);
    setScheduledMessages([]);
    setRecentBroadcasts([]);
    setContacts([]);
    setContactLists([]);
    setGeneratedToken(null);
    pushFeedback('info', 'Session cleared.');
  }

  function pushFeedback(tone: 'success' | 'error' | 'info', text: string) {
    setFeedback({ tone, text });
  }

  if (!hydrated) return null;

  if (!session) {
    return <AuthScreen authMode={authMode} setAuthMode={setAuthMode} authForm={authForm} setAuthForm={setAuthForm} isLoading={isLoading} feedback={feedback} onSubmit={handleAuthSubmit} />;
  }

  return (
    <main className="console-shell">
      <aside className="workspace-rail glass-panel">
        <div className="rail-header">
          <div className="rail-brand">
            <Logo variant="long" height={32} />
            <ThemeToggle className="theme-toggle-btn" />
          </div>
          <span className="eyebrow" style={{ marginTop: '12px', display: 'block' }}>{session.email || 'Signed in'}</span>
          <p>Select a workspace, navigate per route, and monitor real-time events.</p>
        </div>

        <nav className="route-nav">
          {navItems.map((item) => (
            <Link key={item.key} className={pathname === item.href ? 'route-link active' : 'route-link'} href={item.href}>{item.label}</Link>
          ))}
        </nav>

        <form className="stack-form compact" onSubmit={handleWorkspaceCreate}>
          <label className="field-block">
            <span>Workspace name</span>
            <input value={workspaceForm.name} onChange={(event) => setWorkspaceForm((current) => ({ ...current, name: event.target.value }))} placeholder="Ops Sales" required />
          </label>
          <label className="field-block">
            <span>Slug</span>
            <input value={workspaceForm.slug} onChange={(event) => setWorkspaceForm((current) => ({ ...current, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))} placeholder="ops-sales" required />
          </label>
          <button className="button-secondary" type="submit">Create Workspace</button>
        </form>

        <div className="workspace-list">
          {workspaces.length ? workspaces.map((item) => (
            <button key={item.id} className={item.workspace.id === selectedWorkspaceId ? 'workspace-item active' : 'workspace-item'} onClick={() => setSelectedWorkspaceId(item.workspace.id)} type="button">
              <strong>{item.workspace.name}</strong>
              <span>{item.workspace.slug}</span>
              <small>{item.role} · {item.workspace.status}</small>
            </button>
          )) : <p className="empty-copy">No workspaces yet. Create one to get started.</p>}
        </div>

        <div className="rail-actions">
          <button className="button-ghost" onClick={() => session.accessToken && loadWorkspaces(session.accessToken)} type="button">Refresh workspaces</button>
          <button className="button-ghost danger" onClick={handleLogout} type="button">Sign out</button>
        </div>
      </aside>

      <section className="main-column">
        <header className="console-header glass-panel">
          <div>
            <span className="eyebrow">{selectedWorkspace?.workspace.slug || 'Select workspace'}</span>
            <h1>{selectedWorkspace?.workspace.name || 'No active workspace'}</h1>
            <p>Active route: {navItems.find((item) => item.key === activeSection)?.label}. Realtime: <span className={`status-chip ${liveState === 'live' ? 'status-success' : liveState === 'connecting' ? 'status-warning' : 'status-danger'}`}>{liveState.toUpperCase()}</span></p>
          </div>
          <div className="hero-metrics compact">
            <Metric label="Devices" value={String(devices.length)} />
            <Metric label="Messages" value={String(messages.length)} />
            <Metric label="Webhooks" value={String(webhooks.length)} />
            <Metric label="Auto Reply" value={String(autoReplies.length)} />
          </div>
        </header>

        {feedback ? <Feedback tone={feedback.tone} text={feedback.text} /> : null}
        {generatedToken ? <section className="token-strip glass-panel"><div><span className="eyebrow">New token</span><strong>{generatedToken.deviceName}</strong></div><code>{generatedToken.token}</code></section> : null}

        {activeSection === 'overview' ? <TalabOverview devices={devices} selectedWorkspaceId={selectedWorkspaceId} session={session} /> : null}
        {activeSection === 'orders' ? <OrdersPanel selectedWorkspaceId={selectedWorkspaceId} session={session} pushFeedback={pushFeedback} /> : null}
        {activeSection === 'invoices' ? <InvoicesPanel selectedWorkspaceId={selectedWorkspaceId} session={session} pushFeedback={pushFeedback} /> : null}
        {activeSection === 'payments' ? <PaymentsPanel selectedWorkspaceId={selectedWorkspaceId} session={session} pushFeedback={pushFeedback} /> : null}
        {activeSection === 'inbox' ? <MessagesPanel devices={devices} messageForm={messageForm} setMessageForm={setMessageForm} selectedWorkspaceId={selectedWorkspaceId} messageSearch={messageSearch} setMessageSearch={setMessageSearch} messages={filteredMessages} onSubmit={handleMessageSend} onRetry={handleMessageRetry} isLoading={isLoading} /> : null}
        {activeSection === 'devices' ? <DevicesPanel deviceForm={deviceForm} setDeviceForm={setDeviceForm} selectedWorkspaceId={selectedWorkspaceId} devices={devices} onCreate={handleDeviceCreate} onAction={handleDeviceAction} onCreateToken={handleTokenCreate} activeQrCode={activeQrCode} /> : null}
        {activeSection === 'billing' ? <BillingPanel subscription={subscription} plans={plans} isLoading={isLoading} onUpgrade={handleUpgrade} onRefresh={refreshSubscription} /> : null}
      </section>
    </main>
  );
}

function AuthScreen({ authMode, setAuthMode, authForm, setAuthForm, isLoading, feedback, onSubmit }: { authMode: AuthMode; setAuthMode: (value: AuthMode) => void; authForm: { name: string; email: string; password: string }; setAuthForm: Dispatch<SetStateAction<{ name: string; email: string; password: string }>>; isLoading: boolean; feedback: { tone: 'success' | 'error' | 'info'; text: string } | null; onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>; }) {
  const t = {
    eyebrow: 'Talab Console',
    headline: 'Capture orders from WhatsApp, generate invoices, and verify payments.',
    sub: 'Orders, invoices, payment proofs, and OCR matching — all in one dashboard.',
    trialTitle: 'Start for free',
    trialDesc: 'Create an account, connect your first WhatsApp number, and start sending messages in minutes.',
    loginTitle: 'Sign in to console',
    loginDesc: 'Continue managing your devices and workspaces.',
    nameLabel: 'Name', namePlaceholder: 'Full name',
    emailLabel: 'Email', emailPlaceholder: 'you@email.com',
    passLabel: 'Password', passPlaceholder: 'Min. 8 characters',
    submitRegister: 'Create Free Account',
    submitLogin: 'Sign In',
    loading: 'Processing...',
    switchToRegister: "Don't have an account? Sign up free",
    switchToLogin: 'Already have an account? Sign in',
    metric1Label: 'WA Numbers', metric1Value: 'Per workspace',
    metric2Label: 'Features', metric2Value: 'Broadcast · Auto Reply · Webhook',
    metric3Label: 'Plan', metric3Value: 'Free to start',
    orContinueWith: 'or continue with',
    continueWithGoogle: 'Continue with Google',
  };

  return (
    <main className="landing-shell">
      <section className="hero-card glass-panel">
        <div className="hero-copy">
          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Logo variant="long" height={36} />
            <ThemeToggle className="theme-toggle-btn" />
          </div>
          <h1>{t.headline}</h1>
          <p>{t.sub}</p>
          <div className="hero-metrics compact">
            <Metric label={t.metric1Label} value={t.metric1Value} />
            <Metric label={t.metric2Label} value={t.metric2Value} />
            <Metric label={t.metric3Label} value={t.metric3Value} />
          </div>
        </div>
        <div className="auth-panel">
          <div className="auth-intro">
            <strong>{authMode === 'register' ? t.trialTitle : t.loginTitle}</strong>
            <p>{authMode === 'register' ? t.trialDesc : t.loginDesc}</p>
          </div>
          <div className="auth-switch">
            <button className={authMode === 'login' ? 'pill active' : 'pill'} onClick={() => setAuthMode('login')} type="button">Login</button>
            <button className={authMode === 'register' ? 'pill active' : 'pill'} onClick={() => setAuthMode('register')} type="button">Register</button>
          </div>
          <form className="stack-form" onSubmit={onSubmit}>
            {authMode === 'register' ? <label className="field-block"><span>{t.nameLabel}</span><input value={authForm.name} onChange={(event) => setAuthForm((current) => ({ ...current, name: event.target.value }))} placeholder={t.namePlaceholder} required /></label> : null}
            <label className="field-block"><span>{t.emailLabel}</span><input type="email" value={authForm.email} onChange={(event) => setAuthForm((current) => ({ ...current, email: event.target.value }))} placeholder={t.emailPlaceholder} required /></label>
            <label className="field-block"><span>{t.passLabel}</span><input type="password" value={authForm.password} onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))} placeholder={t.passPlaceholder} required minLength={8} /></label>
            <button className="button-primary" disabled={isLoading} type="submit">{isLoading ? t.loading : authMode === 'login' ? t.submitLogin : t.submitRegister}</button>
          </form>
          <div className="auth-divider"><span>{t.orContinueWith}</span></div>
          <a className="button-google" href={`${process.env.NEXT_PUBLIC_API_BASE_URL || '/api'}/auth/google`}>
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>
            {t.continueWithGoogle}
          </a>
          <button className="button-ghost" style={{ width: '100%', marginTop: '4px', fontSize: '13px' }} onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} type="button">
            {authMode === 'login' ? t.switchToRegister : t.switchToLogin}
          </button>
          {feedback ? <Feedback tone={feedback.tone} text={feedback.text} /> : null}
        </div>
      </section>
    </main>
  );
}

function OverviewGrid({ devices, messages, webhooks, autoReplies }: { devices: Device[]; messages: Message[]; webhooks: Webhook[]; autoReplies: AutoReplyRule[] }) {
  return <div className="panel-grid"><section className="panel glass-panel"><SectionHeading title="Devices Snapshot" subtitle="Current device status for the active workspace." /><div className="list-stack">{devices.length ? devices.map((device) => <article className="card-row" key={device.id}><div><strong>{device.name}</strong><p>{device.phoneNumber || 'Number not connected'}</p><small>{device.status} · Health {device.healthScore}</small></div></article>) : <p className="empty-copy">No devices yet.</p>}</div></section><section className="panel glass-panel"><SectionHeading title="Webhook Snapshot" subtitle="Active webhooks registered." /><div className="list-stack compact-list">{webhooks.length ? webhooks.map((hook) => <article className="card-row slim" key={hook.id}><div><strong>{hook.name}</strong><p>{hook.url}</p><small>{hook.isActive ? 'Active' : 'Inactive'}</small></div></article>) : <p className="empty-copy">No webhooks yet.</p>}</div></section><section className="panel glass-panel wide"><SectionHeading title="Latest Messages" subtitle="Recent message log summary." /><div className="table-wrap"><table><thead><tr><th>Time</th><th>Direction</th><th>Target / From</th><th>Type</th><th>Status</th><th>Content</th></tr></thead><tbody>{messages.length ? messages.slice(0, 8).map((entry) => <tr key={entry.id}><td>{formatDateTime(entry.createdAt)}</td><td>{entry.direction}</td><td>{entry.recipient || entry.sender || '-'}</td><td>{entry.type}</td><td><span className={`status-chip ${statusTone(entry.status)}`}>{entry.status}</span></td><td>{entry.content || entry.errorMessage || '-'}</td></tr>) : <tr><td colSpan={6} className="empty-table">No message logs yet.</td></tr>}</tbody></table></div></section><section className="panel glass-panel wide"><SectionHeading title="Auto Reply Snapshot" subtitle="Active rules for devices in this workspace." /><div className="table-wrap compact-table"><table><thead><tr><th>Name</th><th>Keyword</th><th>Priority</th><th>Status</th></tr></thead><tbody>{autoReplies.length ? autoReplies.map((rule) => <tr key={rule.id}><td>{rule.name}</td><td>{rule.keyword}</td><td>{rule.priority}</td><td><span className={`status-chip ${rule.isEnabled ? 'status-success' : 'status-danger'}`}>{rule.isEnabled ? 'ENABLED' : 'DISABLED'}</span></td></tr>) : <tr><td colSpan={4} className="empty-table">No auto-reply rules yet.</td></tr>}</tbody></table></div></section></div>;
}

function DevicesPanel({ deviceForm, setDeviceForm, selectedWorkspaceId, devices, onCreate, onAction, onCreateToken, activeQrCode }: { deviceForm: { name: string }; setDeviceForm: Dispatch<SetStateAction<{ name: string }>>; selectedWorkspaceId: string; devices: Device[]; onCreate: (event: FormEvent<HTMLFormElement>) => Promise<void>; onAction: (deviceId: string, action: 'pair' | 'reconnect') => Promise<void>; onCreateToken: (device: Device) => Promise<void>; activeQrCode: { deviceId: string; dataUrl: string } | null; }) {
  const [agreed, setAgreed] = useState(false);
  return <section className="panel glass-panel"><SectionHeading title="Devices" subtitle="Add a device, connect WhatsApp via QR, and generate API tokens." /><div className="disclaimer-band" style={{marginBottom:'16px'}}><strong>Important before adding a device</strong><p style={{marginTop:'4px',marginBottom:0}}>Talab is not an official product of Meta or WhatsApp Inc. Using WhatsApp numbers through third-party tools may result in restrictions, blocks, or permanent bans by WhatsApp. All risks of bans, feature restrictions, or number deactivation are entirely the user&apos;s responsibility and outside of Talab&apos;s liability.</p><label style={{display:'flex',alignItems:'center',gap:'8px',marginTop:'10px',cursor:'pointer',fontSize:'13px'}}><input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />I understand the risks and accept full responsibility for using this number.</label></div><form className="stack-form compact" onSubmit={onCreate}><label className="field-block"><span>Device name</span><input value={deviceForm.name} onChange={(event) => setDeviceForm({ name: event.target.value })} placeholder="CS Main 01" required /></label><button className="button-secondary" disabled={!selectedWorkspaceId || !agreed} type="submit">Add Device</button></form><div className="list-stack">{devices.length ? devices.map((device) => <article className="card-row" key={device.id}><div><strong>{device.name}</strong><p>{device.phoneNumber || 'Number not connected'}</p><small>{device.status} · Health {device.healthScore}</small></div><div className="action-row"><button className="mini-button" onClick={() => onAction(device.id, 'pair')} type="button">Pair WhatsApp</button><button className="mini-button" onClick={() => onAction(device.id, 'reconnect')} type="button">Reconnect</button><button className="mini-button accent" onClick={() => onCreateToken(device)} type="button">Token</button></div>{activeQrCode?.deviceId === device.id ? <div className="qr-wrap" style={{marginTop:'12px',textAlign:'center'}}><p style={{marginBottom:'8px',fontSize:'13px',color:'var(--text-muted)'}}>Scan this QR code with WhatsApp on your phone. It will refresh automatically.</p><img src={activeQrCode.dataUrl} alt="WhatsApp QR Code" style={{width:'240px',height:'240px',borderRadius:'8px',border:'1px solid var(--border)'}} /></div> : null}</article>) : <p className="empty-copy">No devices for this workspace yet.</p>}</div></section>;
}

function MessagesPanel({ devices, messageForm, setMessageForm, selectedWorkspaceId, messageSearch, setMessageSearch, messages, onSubmit, onRetry, isLoading }: { devices: Device[]; messageForm: { deviceId: string; target: string; type: string; message: string; mediaUrl: string }; setMessageForm: Dispatch<SetStateAction<{ deviceId: string; target: string; type: string; message: string; mediaUrl: string }>>; selectedWorkspaceId: string; messageSearch: string; setMessageSearch: Dispatch<SetStateAction<string>>; messages: Message[]; onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>; onRetry: (messageId: string) => Promise<void>; isLoading: boolean; }) {
  return <section className="panel glass-panel"><SectionHeading title="Send Message" subtitle="Send a request to the message queue, monitor failures, and retry directly from the console." /><form className="form-grid" onSubmit={onSubmit}><label className="field-block"><span>Device</span><select value={messageForm.deviceId} onChange={(event) => setMessageForm((current) => ({ ...current, deviceId: event.target.value }))} required><option value="">Select device</option>{devices.map((device) => <option key={device.id} value={device.id}>{device.name}</option>)}</select></label><label className="field-block"><span>Target</span><input value={messageForm.target} onChange={(event) => setMessageForm((current) => ({ ...current, target: event.target.value }))} placeholder="6281234567890" required /></label><label className="field-block"><span>Type</span><select value={messageForm.type} onChange={(event) => setMessageForm((current) => ({ ...current, type: event.target.value }))}><option value="TEXT">TEXT</option><option value="IMAGE">IMAGE</option><option value="DOCUMENT">DOCUMENT</option><option value="AUDIO">AUDIO</option><option value="VIDEO">VIDEO</option></select></label><label className="field-block span-2"><span>Message</span><textarea rows={4} value={messageForm.message} onChange={(event) => setMessageForm((current) => ({ ...current, message: event.target.value }))} placeholder="Hello, your order has been processed." required /></label><label className="field-block span-2"><span>Media URL (optional)</span><input value={messageForm.mediaUrl} onChange={(event) => setMessageForm((current) => ({ ...current, mediaUrl: event.target.value }))} placeholder="https://cdn.example.com/file.pdf" /></label><div className="span-2 button-row"><button className="button-primary" disabled={!selectedWorkspaceId || isLoading} type="submit">{isLoading ? 'Sending...' : 'Queue Message'}</button><input className="search-input" value={messageSearch} onChange={(event) => setMessageSearch(event.target.value)} placeholder="Search message log..." /></div></form><div className="table-wrap"><table><thead><tr><th>Time</th><th>Direction</th><th>Target / From</th><th>Type</th><th>Status</th><th>Content</th><th>Action</th></tr></thead><tbody>{messages.length ? messages.map((entry) => <tr key={entry.id}><td>{formatDateTime(entry.createdAt)}</td><td>{entry.direction}</td><td>{entry.recipient || entry.sender || '-'}</td><td>{entry.type}</td><td><span className={`status-chip ${statusTone(entry.status)}`}>{entry.status}</span></td><td>{entry.content || entry.errorMessage || '-'}</td><td>{entry.status.toUpperCase() === 'FAILED' ? <button className="mini-button accent" onClick={() => onRetry(entry.id)} type="button">Retry</button> : <span className="helper-copy">-</span>}</td></tr>) : <tr><td colSpan={7} className="empty-table">No message logs for this filter.</td></tr>}</tbody></table></div></section>;
}

function WebhooksPanel({ selectedWorkspaceId, webhookForm, setWebhookForm, webhooks, webhookLogs, onSubmit, onTest, onLoadLogs }: { selectedWorkspaceId: string; webhookForm: { name: string; url: string; secret: string }; setWebhookForm: Dispatch<SetStateAction<{ name: string; url: string; secret: string }>>; webhooks: Webhook[]; webhookLogs: Record<string, WebhookDelivery[]>; onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>; onTest: (webhookId: string) => Promise<void>; onLoadLogs: (webhookId: string) => Promise<void>; }) {
  return <section className="panel glass-panel"><SectionHeading title="Webhooks" subtitle="Create tenant callback endpoints, send manual test events, and audit recent delivery history." /><form className="stack-form compact" onSubmit={onSubmit}><label className="field-block"><span>Name</span><input value={webhookForm.name} onChange={(event) => setWebhookForm((current) => ({ ...current, name: event.target.value }))} placeholder="Main webhook" required /></label><label className="field-block"><span>URL</span><input value={webhookForm.url} onChange={(event) => setWebhookForm((current) => ({ ...current, url: event.target.value }))} placeholder="https://example.com/webhook" required /></label><label className="field-block"><span>Secret</span><input value={webhookForm.secret} onChange={(event) => setWebhookForm((current) => ({ ...current, secret: event.target.value }))} placeholder="supersecretkey" required /></label><button className="button-secondary" disabled={!selectedWorkspaceId} type="submit">Add Webhook</button></form><div className="list-stack compact-list">{webhooks.length ? webhooks.map((hook) => <article className="card-row slim" key={hook.id}><div><strong>{hook.name}</strong><p>{hook.url}</p><small>{hook.isActive ? 'Active' : 'Inactive'} · {formatDateTime(hook.createdAt)}</small>{webhookLogs[hook.id]?.length ? <div className="table-wrap compact-table"><table><thead><tr><th>Event</th><th>Status</th><th>Attempt</th><th>HTTP</th><th>Last Attempt</th></tr></thead><tbody>{webhookLogs[hook.id].map((log) => <tr key={log.id}><td>{log.eventType}</td><td><span className={`status-chip ${statusTone(log.status)}`}>{log.status}</span></td><td>{log.attemptCount}</td><td>{log.responseCode ?? '-'}</td><td>{formatDateTime(log.lastAttemptAt || log.createdAt)}</td></tr>)}</tbody></table></div> : null}</div><div className="action-row"><button className="mini-button" onClick={() => onLoadLogs(hook.id)} type="button">Logs</button><button className="mini-button accent" onClick={() => onTest(hook.id)} type="button">Test</button></div></article>) : <p className="empty-copy">No webhooks yet.</p>}</div></section>;
}

function BroadcastsPanel({ devices, selectedWorkspaceId, broadcastForm, setBroadcastForm, recentBroadcasts, contactLists, onSubmit, onStart }: { devices: Device[]; selectedWorkspaceId: string; broadcastForm: { deviceId: string; name: string; messageTemplate: string; recipientsText: string; contactListId: string }; setBroadcastForm: Dispatch<SetStateAction<{ deviceId: string; name: string; messageTemplate: string; recipientsText: string; contactListId: string }>>; recentBroadcasts: Broadcast[]; contactLists: ContactList[]; onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>; onStart: (broadcastId: string) => Promise<void>; }) {
  return <section className="panel glass-panel"><SectionHeading title="Broadcast" subtitle="Create and start broadcasts using the available endpoints." /><form className="stack-form compact" onSubmit={onSubmit}><label className="field-block"><span>Device</span><select value={broadcastForm.deviceId} onChange={(event) => setBroadcastForm((current) => ({ ...current, deviceId: event.target.value }))} required><option value="">Select device</option>{devices.map((device) => <option key={device.id} value={device.id}>{device.name}</option>)}</select></label><label className="field-block"><span>Campaign name</span><input value={broadcastForm.name} onChange={(event) => setBroadcastForm((current) => ({ ...current, name: event.target.value }))} placeholder="Friday Promo" required /></label><label className="field-block"><span>Message template</span><textarea rows={3} value={broadcastForm.messageTemplate} onChange={(event) => setBroadcastForm((current) => ({ ...current, messageTemplate: event.target.value }))} placeholder="Hello, we have a new promotion today." required /></label><label className="field-block"><span>Recipients (one number per line)</span><textarea rows={4} value={broadcastForm.recipientsText} onChange={(event) => setBroadcastForm((current) => ({ ...current, recipientsText: event.target.value, contactListId: '' }))} placeholder="6281234567890&#10;6289876543210" /></label>{contactLists.length > 0 ? <label className="field-block"><span>Or select from contact list</span><select value={broadcastForm.contactListId} onChange={(event) => setBroadcastForm((current) => ({ ...current, contactListId: event.target.value, recipientsText: '' }))}><option value="">— select list —</option>{contactLists.map((list) => <option key={list.id} value={list.id}>{list.name} ({list.memberCount} contacts)</option>)}</select></label> : null}<button className="button-secondary" disabled={!selectedWorkspaceId} type="submit">Create Broadcast</button></form><div className="list-stack compact-list">{recentBroadcasts.length ? recentBroadcasts.map((item) => <article className="card-row" key={item.id}><div><strong>{item.name}</strong><p>{item.messageTemplate}</p><small>{item.totalTargets} recipients · {item.successCount ?? 0} sent · {item.failedCount ?? 0} failed · {item.status}</small></div><button className="mini-button accent" onClick={() => onStart(item.id)} disabled={item.status === 'RUNNING' || item.status === 'COMPLETED'} type="button">Start</button></article>) : <p className="empty-copy">No broadcasts created from this console yet.</p>}</div></section>;
}

function AutoRepliesPanel({ devices, selectedWorkspaceId, autoReplyForm, setAutoReplyForm, autoReplies, isRefreshing, onSubmit }: { devices: Device[]; selectedWorkspaceId: string; autoReplyForm: { deviceId: string; name: string; matchType: string; keyword: string; response: string; webhookUrl: string; useWebhook: boolean; priority: string }; setAutoReplyForm: Dispatch<SetStateAction<{ deviceId: string; name: string; matchType: string; keyword: string; response: string; webhookUrl: string; useWebhook: boolean; priority: string }>>; autoReplies: AutoReplyRule[]; isRefreshing: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>; }) {
  return <section className="panel glass-panel"><SectionHeading title="Auto Reply" subtitle="Keyword rules per device — static reply or call your system API." /><form className="form-grid" onSubmit={onSubmit}><label className="field-block"><span>Device</span><select value={autoReplyForm.deviceId} onChange={(event) => setAutoReplyForm((current) => ({ ...current, deviceId: event.target.value }))} required><option value="">Select device</option>{devices.map((device) => <option key={device.id} value={device.id}>{device.name}</option>)}</select></label><label className="field-block"><span>Rule name</span><input value={autoReplyForm.name} onChange={(event) => setAutoReplyForm((current) => ({ ...current, name: event.target.value }))} placeholder="Check Order" required /></label><label className="field-block"><span>Match type</span><select value={autoReplyForm.matchType} onChange={(event) => setAutoReplyForm((current) => ({ ...current, matchType: event.target.value }))}><option value="contains">contains</option><option value="exact">exact</option></select></label><label className="field-block"><span>Priority</span><input value={autoReplyForm.priority} onChange={(event) => setAutoReplyForm((current) => ({ ...current, priority: event.target.value }))} type="number" min="0" max="100" required /></label><label className="field-block span-2"><span>Keyword</span><input value={autoReplyForm.keyword} onChange={(event) => setAutoReplyForm((current) => ({ ...current, keyword: event.target.value }))} placeholder="order" required /></label><label className="field-block span-2" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}><input type="checkbox" checked={autoReplyForm.useWebhook} onChange={(event) => setAutoReplyForm((current) => ({ ...current, useWebhook: event.target.checked }))} style={{ width: 'auto', margin: 0 }} /><span>Use Webhook URL (integrate with your system)</span></label>{autoReplyForm.useWebhook ? <label className="field-block span-2"><span>Webhook URL</span><input type="url" value={autoReplyForm.webhookUrl} onChange={(event) => setAutoReplyForm((current) => ({ ...current, webhookUrl: event.target.value }))} placeholder="https://yourapp.com/api/wa/handler" required={autoReplyForm.useWebhook} /><span className="helper-copy" style={{ marginTop: '4px', display: 'block' }}>Talab will POST &#123; sender, keyword, message &#125; to this URL. The endpoint must return &#123; &quot;reply&quot;: &quot;...&quot; &#125;.</span></label> : <label className="field-block span-2"><span>Response</span><textarea rows={4} value={autoReplyForm.response} onChange={(event) => setAutoReplyForm((current) => ({ ...current, response: event.target.value }))} placeholder="Hi, please send your order number." required={!autoReplyForm.useWebhook} /></label>}<div className="span-2 button-row"><button className="button-primary" disabled={!selectedWorkspaceId} type="submit">Add Rule</button><span className="helper-copy">{isRefreshing ? 'Refreshing workspace...' : 'Workspace data synced.'}</span></div></form><div className="table-wrap compact-table"><table><thead><tr><th>Name</th><th>Device</th><th>Keyword</th><th>Response</th><th>Priority</th><th>Status</th></tr></thead><tbody>{autoReplies.length ? autoReplies.map((rule) => <tr key={rule.id}><td>{rule.name}</td><td>{devices.find((device) => device.id === rule.deviceId)?.name || rule.deviceId}</td><td><code>{rule.keyword}</code></td><td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rule.webhookUrl ? <span className="status-chip status-info" title={rule.webhookUrl}>Webhook</span> : rule.response}</td><td>{rule.priority}</td><td><span className={`status-chip ${rule.isEnabled ? 'status-success' : 'status-danger'}`}>{rule.isEnabled ? 'ENABLED' : 'DISABLED'}</span></td></tr>) : <tr><td colSpan={6} className="empty-table">No auto-reply rules yet.</td></tr>}</tbody></table></div></section>;
}

function LeadsPanel({ selectedWorkspaceId, contacts, contactLists, session, onRefresh, pushFeedback }: { selectedWorkspaceId: string; contacts: Contact[]; contactLists: ContactList[]; session: { accessToken: string }; onRefresh: () => void; pushFeedback: (tone: 'success' | 'error' | 'info', text: string) => void; }) {
  const [tab, setTab] = useState<'contacts' | 'lists'>('contacts');
  const [contactForm, setContactForm] = useState({ phoneNumber: '', name: '', tags: '' });
  const [bulkText, setBulkText] = useState('');
  const [showBulk, setShowBulk] = useState(false);
  const [listForm, setListForm] = useState({ name: '', description: '' });
  const [selectedListId, setSelectedListId] = useState('');
  const [listMembers, setListMembers] = useState<Contact[]>([]);
  const [addMembersText, setAddMembersText] = useState('');
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  async function handleAddContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session.accessToken || !selectedWorkspaceId) return;
    setIsLoadingAction(true);
    try {
      const tags = contactForm.tags.split(',').map((t) => t.trim()).filter(Boolean);
      await apiRequest('/contacts', { method: 'POST', body: JSON.stringify({ workspaceId: selectedWorkspaceId, phoneNumber: contactForm.phoneNumber, name: contactForm.name || undefined, tags: tags.length ? tags : undefined }) }, session.accessToken);
      setContactForm({ phoneNumber: '', name: '', tags: '' });
      pushFeedback('success', 'Contact added.');
      onRefresh();
    } catch (error) {
      pushFeedback('error', error instanceof Error ? error.message : 'Failed to add contact.');
    } finally {
      setIsLoadingAction(false);
    }
  }

  async function handleBulkImport() {
    if (!session.accessToken || !selectedWorkspaceId || !bulkText.trim()) return;
    setIsLoadingAction(true);
    try {
      const entries = bulkText.trim().split('\n').map((line) => {
        const [phoneNumber, name] = line.split(',').map((s) => s.trim());
        return phoneNumber ? { phoneNumber, name: name || undefined } : null;
      }).filter((entry): entry is { phoneNumber: string; name: string | undefined } => entry !== null);
      const result = await apiRequest<{ imported: number; skipped: number }>('/contacts/bulk-import', { method: 'POST', body: JSON.stringify({ workspaceId: selectedWorkspaceId, contacts: entries }) }, session.accessToken);
      setBulkText('');
      setShowBulk(false);
      pushFeedback('success', `Import complete: ${result.imported} imported, ${result.skipped} skipped.`);
      onRefresh();
    } catch (error) {
      pushFeedback('error', error instanceof Error ? error.message : 'Failed to import contacts.');
    } finally {
      setIsLoadingAction(false);
    }
  }

  async function handleDeleteContact(id: string) {
    if (!session.accessToken) return;
    try {
      await apiRequest(`/contacts/${id}`, { method: 'DELETE' }, session.accessToken);
      pushFeedback('success', 'Contact deleted.');
      onRefresh();
    } catch (error) {
      pushFeedback('error', error instanceof Error ? error.message : 'Failed to delete contact.');
    }
  }

  async function handleCreateList(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session.accessToken || !selectedWorkspaceId) return;
    setIsLoadingAction(true);
    try {
      await apiRequest('/contacts/lists', { method: 'POST', body: JSON.stringify({ workspaceId: selectedWorkspaceId, name: listForm.name, description: listForm.description || undefined }) }, session.accessToken);
      setListForm({ name: '', description: '' });
      pushFeedback('success', 'Contact list created.');
      onRefresh();
    } catch (error) {
      pushFeedback('error', error instanceof Error ? error.message : 'Failed to create list.');
    } finally {
      setIsLoadingAction(false);
    }
  }

  async function handleSelectList(listId: string) {
    setSelectedListId(listId);
    if (!session.accessToken || !listId) { setListMembers([]); return; }
    try {
      const members = await apiRequest<Contact[]>(`/contacts/lists/${listId}/members`, undefined, session.accessToken);
      setListMembers(members);
    } catch (error) {
      pushFeedback('error', error instanceof Error ? error.message : 'Failed to load list members.');
    }
  }

  async function handleAddToList() {
    if (!session.accessToken || !selectedListId || !addMembersText.trim()) return;
    setIsLoadingAction(true);
    try {
      const contactIds = addMembersText.trim().split('\n').map((s) => s.trim()).filter(Boolean);
      const result = await apiRequest<{ added: number; skipped: number }>(`/contacts/lists/${selectedListId}/members`, { method: 'POST', body: JSON.stringify({ contactIds }) }, session.accessToken);
      setAddMembersText('');
      pushFeedback('success', `${result.added} contacts added to list.`);
      await handleSelectList(selectedListId);
      onRefresh();
    } catch (error) {
      pushFeedback('error', error instanceof Error ? error.message : 'Failed to add to list.');
    } finally {
      setIsLoadingAction(false);
    }
  }

  async function handleRemoveFromList(contactId: string) {
    if (!session.accessToken || !selectedListId) return;
    try {
      await apiRequest(`/contacts/lists/${selectedListId}/members/${contactId}`, { method: 'DELETE' }, session.accessToken);
      pushFeedback('success', 'Contact removed from list.');
      await handleSelectList(selectedListId);
      onRefresh();
    } catch (error) {
      pushFeedback('error', error instanceof Error ? error.message : 'Failed to remove from list.');
    }
  }

  const selectedList = contactLists.find((l) => l.id === selectedListId);

  return (
    <section className="panel glass-panel">
      <SectionHeading title="Leads / Contacts" subtitle="Manage contact lists and broadcast groups for the active workspace." />
      <div className="auth-switch" style={{ marginBottom: '16px' }}>
        <button className={tab === 'contacts' ? 'pill active' : 'pill'} onClick={() => setTab('contacts')} type="button">Contacts</button>
        <button className={tab === 'lists' ? 'pill active' : 'pill'} onClick={() => setTab('lists')} type="button">Lists</button>
      </div>

      {tab === 'contacts' ? (
        <div>
          <form className="form-grid" onSubmit={handleAddContact}>
            <label className="field-block"><span>Phone (62...)</span><input value={contactForm.phoneNumber} onChange={(e) => setContactForm((c) => ({ ...c, phoneNumber: e.target.value }))} placeholder="6281234567890" required /></label>
            <label className="field-block"><span>Name</span><input value={contactForm.name} onChange={(e) => setContactForm((c) => ({ ...c, name: e.target.value }))} placeholder="John Smith" /></label>
            <label className="field-block"><span>Tags (comma-separated)</span><input value={contactForm.tags} onChange={(e) => setContactForm((c) => ({ ...c, tags: e.target.value }))} placeholder="vip, customer" /></label>
            <div className="button-row">
              <button className="button-secondary" disabled={isLoadingAction || !selectedWorkspaceId} type="submit">Add Contact</button>
              <button className="button-ghost" type="button" onClick={() => setShowBulk((v) => !v)}>Import CSV</button>
            </div>
          </form>
          {showBulk ? (
            <div className="stack-form compact" style={{ marginTop: '12px' }}>
              <label className="field-block"><span>CSV: phone,name (one per line)</span><textarea rows={5} value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder={'6281234567890,John\n6289876543210,Jane'} /></label>
              <button className="button-secondary" disabled={isLoadingAction} type="button" onClick={handleBulkImport}>Import</button>
            </div>
          ) : null}
          <div className="table-wrap" style={{ marginTop: '16px' }}>
            <table>
              <thead><tr><th>Name</th><th>Number</th><th>Tags</th><th>Action</th></tr></thead>
              <tbody>
                {contacts.length ? contacts.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name || '-'}</td>
                    <td>{c.phoneNumber}</td>
                    <td>{Array.isArray(c.tags) ? (c.tags as string[]).join(', ') : '-'}</td>
                    <td><button className="mini-button" style={{ color: 'var(--danger, #e55)' }} type="button" onClick={() => handleDeleteContact(c.id)}>Delete</button></td>
                  </tr>
                )) : <tr><td colSpan={4} className="empty-table">No contacts yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div>
          <form className="stack-form compact" onSubmit={handleCreateList}>
            <label className="field-block"><span>List name</span><input value={listForm.name} onChange={(e) => setListForm((l) => ({ ...l, name: e.target.value }))} placeholder="VIP Customers" required /></label>
            <label className="field-block"><span>Description (optional)</span><input value={listForm.description} onChange={(e) => setListForm((l) => ({ ...l, description: e.target.value }))} placeholder="Top tier customers" /></label>
            <button className="button-secondary" disabled={isLoadingAction || !selectedWorkspaceId} type="submit">Create List</button>
          </form>
          <div className="list-stack compact-list" style={{ marginTop: '16px' }}>
            {contactLists.length ? contactLists.map((list) => (
              <article className={`card-row slim${selectedListId === list.id ? ' active' : ''}`} key={list.id} style={{ cursor: 'pointer' }} onClick={() => handleSelectList(list.id)}>
                <div>
                  <strong>{list.name}</strong>
                  <p>{list.description || 'No description'}</p>
                  <small>{list.memberCount} members</small>
                </div>
              </article>
            )) : <p className="empty-copy">No contact lists yet.</p>}
          </div>
          {selectedList ? (
            <div style={{ marginTop: '20px' }}>
              <h4 style={{ marginBottom: '8px' }}>Members: {selectedList.name}</h4>
              <div className="stack-form compact">
                <label className="field-block"><span>Add contacts (ID per line)</span><textarea rows={3} value={addMembersText} onChange={(e) => setAddMembersText(e.target.value)} placeholder="contact-uuid-1&#10;contact-uuid-2" /></label>
                <button className="button-ghost" disabled={isLoadingAction} type="button" onClick={handleAddToList}>Add to List</button>
              </div>
              <div className="table-wrap" style={{ marginTop: '12px' }}>
                <table>
                  <thead><tr><th>Name</th><th>Number</th><th>Action</th></tr></thead>
                  <tbody>
                    {listMembers.length ? listMembers.map((m) => (
                      <tr key={m.id}>
                        <td>{m.name || '-'}</td>
                        <td>{m.phoneNumber}</td>
                        <td><button className="mini-button" style={{ color: 'var(--danger, #e55)' }} type="button" onClick={() => handleRemoveFromList(m.id)}>Remove</button></td>
                      </tr>
                    )) : <tr><td colSpan={3} className="empty-table">No members yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

const DOW_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function ScheduledMessagesPanel({ devices, selectedWorkspaceId, form, setForm, scheduledMessages, isLoading, onSubmit, onToggle, onDelete }: {
  devices: Device[];
  selectedWorkspaceId: string;
  form: { deviceId: string; name: string; type: string; content: string; recipient: string; repeatType: string; sendHour: string; sendMinute: string; dayOfWeek: string; dayOfMonth: string };
  setForm: Dispatch<SetStateAction<{ deviceId: string; name: string; type: string; content: string; recipient: string; repeatType: string; sendHour: string; sendMinute: string; dayOfWeek: string; dayOfMonth: string }>>;
  scheduledMessages: ScheduledMessage[];
  isLoading: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onToggle: (id: string, isEnabled: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const repeatLabel = (sm: ScheduledMessage) => {
    const t = `${String(sm.sendHour).padStart(2, '0')}:${String(sm.sendMinute).padStart(2, '0')}`;
    if (sm.repeatType === 'DAILY') return `Daily at ${t}`;
    if (sm.repeatType === 'WEEKLY') return `Every ${DOW_LABELS[sm.dayOfWeek ?? 0]} at ${t}`;
    return `Day ${sm.dayOfMonth} of month at ${t}`;
  };

  return (
    <section className="panel glass-panel">
      <SectionHeading title="Recurring Messages" subtitle="Send automated messages on a recurring schedule — daily, weekly, or monthly." />
      <form className="form-grid" onSubmit={onSubmit}>
        <label className="field-block">
          <span>Device</span>
          <select value={form.deviceId} onChange={(e) => setForm((c) => ({ ...c, deviceId: e.target.value }))} required>
            <option value="">Select device</option>
            {devices.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </label>
        <label className="field-block">
          <span>Schedule name</span>
          <input value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} placeholder="Payment reminder" required />
        </label>
        <label className="field-block">
          <span>Message type</span>
          <select value={form.type} onChange={(e) => setForm((c) => ({ ...c, type: e.target.value }))}>
            <option value="TEXT">TEXT</option>
            <option value="IMAGE">IMAGE</option>
            <option value="DOCUMENT">DOCUMENT</option>
          </select>
        </label>
        <label className="field-block">
          <span>Recipient number</span>
          <input value={form.recipient} onChange={(e) => setForm((c) => ({ ...c, recipient: e.target.value }))} placeholder="6281234567890" required />
        </label>
        <label className="field-block span-2">
          <span>Message content</span>
          <textarea rows={3} value={form.content} onChange={(e) => setForm((c) => ({ ...c, content: e.target.value }))} placeholder="Hello, this is your payment reminder." required />
        </label>
        <label className="field-block">
          <span>Repeat</span>
          <select value={form.repeatType} onChange={(e) => setForm((c) => ({ ...c, repeatType: e.target.value }))}>
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
          </select>
        </label>
        <label className="field-block">
          <span>Send hour (0–23)</span>
          <input type="number" min="0" max="23" value={form.sendHour} onChange={(e) => setForm((c) => ({ ...c, sendHour: e.target.value }))} required />
        </label>
        {form.repeatType === 'WEEKLY' ? (
          <label className="field-block">
            <span>Day</span>
            <select value={form.dayOfWeek} onChange={(e) => setForm((c) => ({ ...c, dayOfWeek: e.target.value }))}>
              {DOW_LABELS.map((label, i) => <option key={i} value={String(i)}>{label}</option>)}
            </select>
          </label>
        ) : null}
        {form.repeatType === 'MONTHLY' ? (
          <label className="field-block">
            <span>Day of month (1–31)</span>
            <input type="number" min="1" max="31" value={form.dayOfMonth} onChange={(e) => setForm((c) => ({ ...c, dayOfMonth: e.target.value }))} required />
          </label>
        ) : null}
        <div className="span-2 button-row">
          <button className="button-primary" disabled={!selectedWorkspaceId || isLoading} type="submit">{isLoading ? 'Saving...' : 'Create Schedule'}</button>
        </div>
      </form>
      <div className="table-wrap compact-table" style={{ marginTop: '20px' }}>
        <table>
          <thead><tr><th>Name</th><th>Device</th><th>Recipient</th><th>Schedule</th><th>Next run</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {scheduledMessages.length ? scheduledMessages.map((sm) => (
              <tr key={sm.id}>
                <td>{sm.name}</td>
                <td>{devices.find((d) => d.id === sm.deviceId)?.name || sm.deviceId}</td>
                <td>{sm.recipient}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{repeatLabel(sm)}</td>
                <td>{sm.isEnabled ? formatDateTime(sm.nextRunAt) : '—'}</td>
                <td><span className={`status-chip ${sm.isEnabled ? 'status-success' : 'status-danger'}`}>{sm.isEnabled ? 'ACTIVE' : 'INACTIVE'}</span></td>
                <td>
                  <div className="action-row">
                    <button className="mini-button" type="button" onClick={() => onToggle(sm.id, !sm.isEnabled)}>{sm.isEnabled ? 'Disable' : 'Enable'}</button>
                    <button className="mini-button" style={{ color: 'var(--danger, #e55)' }} type="button" onClick={() => onDelete(sm.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            )) : <tr><td colSpan={7} className="empty-table">No recurring scheduled messages yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

type PlanItem = { id: string; code: string; name: string; price: number; maxDevices: number; monthlyMessageQuota: number; maxMembers: number; lemonSqueezyVariantId: string | null };
type SubInfo = { status: string; plan: { code: string; name: string; price: number; maxDevices: number; monthlyMessageQuota: number; maxMembers: number } | null; renewsAt?: string | null } | null;

function BillingPanel({ subscription, plans, isLoading, onUpgrade, onRefresh }: { subscription: SubInfo; plans: PlanItem[]; isLoading: boolean; onUpgrade: (planCode: string) => void; onRefresh: () => void }) {
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  return (
    <section className="panel glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <SectionHeading title="Billing & Subscription" subtitle="Manage your active plan and upgrade your workspace." />
        <button className="button-ghost" style={{ fontSize: '13px', padding: '6px 12px', marginTop: '2px' }} onClick={onRefresh} type="button">↻ Refresh status</button>
      </div>

      {subscription ? (
        <div className="card-row" style={{ marginBottom: '24px' }}>
          <div>
            <strong>Active plan: {subscription.plan?.name ?? 'Trial'}</strong>
            <p>Status: <span className={`status-chip ${subscription.status === 'ACTIVE' ? 'status-success' : subscription.status === 'TRIAL' ? 'status-warning' : 'status-danger'}`}>{subscription.status}</span></p>
            {subscription.renewsAt ? <small>Renews: {formatDateTime(subscription.renewsAt)}</small> : null}
            {subscription.plan ? (
              <small style={{ display: 'block', marginTop: '4px' }}>
                {subscription.plan.maxDevices} devices · {subscription.plan.monthlyMessageQuota === 0 ? 'Unlimited messages' : `${subscription.plan.monthlyMessageQuota.toLocaleString('en-US')} messages/month`} · {subscription.plan.maxMembers} members
              </small>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="disclaimer-band" style={{ marginBottom: '24px' }}>
          <strong>This workspace has no active subscription.</strong>
          <p style={{ marginTop: '4px', marginBottom: 0 }}>Select a plan below to get started.</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
        {plans.filter((p) => p.code !== 'free').map((plan) => {
          const isCurrent = subscription?.plan?.code === plan.code;
          return (
            <article key={plan.id} className="card-row" style={{ flexDirection: 'column', gap: '12px', padding: '20px', position: 'relative' }}>
              {isCurrent ? <span className="status-chip status-success" style={{ position: 'absolute', top: '12px', right: '12px' }}>Active</span> : null}
              <div>
                <strong style={{ fontSize: '18px' }}>{plan.name}</strong>
                <p style={{ fontSize: '22px', fontWeight: 700, margin: '8px 0 4px' }}>{fmt(plan.price)}<span style={{ fontSize: '13px', fontWeight: 400 }}>/month</span></p>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <li>{plan.maxDevices} WhatsApp devices</li>
                <li>{plan.monthlyMessageQuota === 0 ? 'Unlimited messages' : `${plan.monthlyMessageQuota.toLocaleString('en-US')} messages/month`}</li>
                <li>{plan.maxMembers} team members</li>
              </ul>
              {plan.lemonSqueezyVariantId ? (
                <button
                  className={isCurrent ? 'button-secondary' : 'button-primary'}
                  disabled={isCurrent || isLoading}
                  onClick={() => onUpgrade(plan.code)}
                  type="button"
                  style={{ marginTop: 'auto' }}
                >
                  {isCurrent ? 'Current plan' : 'Upgrade now'}
                </button>
              ) : (
                <button className="button-secondary" disabled type="button" style={{ marginTop: 'auto' }}>Coming soon</button>
              )}
            </article>
          );
        })}
      </div>

      <p className="helper-copy" style={{ marginTop: '16px' }}>
        Payments are processed securely via LemonSqueezy. You&apos;ll be redirected to the LS checkout after clicking upgrade.
      </p>
    </section>
  );
}

function ApiDocsPanel({ accessToken }: { accessToken: string }) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
  const docsUrl = `${apiBase}/docs`;
  return (
    <section className="panel glass-panel api-docs-panel">
      <div className="api-docs-toolbar">
        <SectionHeading title="API Docs" subtitle="Swagger UI — explore and test all endpoints directly." />
        <a className="button-ghost" href={docsUrl} target="_blank" rel="noreferrer" style={{ whiteSpace: 'nowrap' }}>
          Open in tab
        </a>
      </div>
      <div className="api-docs-token-hint">
        <span className="eyebrow">Active bearer token</span>
        <code className="token-preview">{accessToken.slice(0, 40)}…</code>
        <button
          className="mini-button"
          type="button"
          onClick={() => navigator.clipboard.writeText(accessToken)}
        >
          Copy
        </button>
      </div>
      <iframe
        src={docsUrl}
        title="Talab API Docs"
        className="docs-frame"
        allow="clipboard-write"
      />
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="metric-pill"><span>{label}</span><strong>{value}</strong></div>; }
function Feedback({ tone, text }: { tone: 'success' | 'error' | 'info'; text: string }) { return <div className={`feedback-banner ${tone}`}>{text}</div>; }
function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) { return <div className="section-heading"><h3>{title}</h3><p>{subtitle}</p></div>; }
function getErrorMessage(error: unknown) { return error instanceof Error ? error.message : 'An unexpected error occurred.'; }
function statusTone(status: string) { const normalized = status.toUpperCase(); if (['SENT', 'DELIVERED', 'READ', 'CONNECTED', 'RUNNING', 'COMPLETED', 'LIVE'].includes(normalized)) return 'status-success'; if (['PROCESSING', 'PAIRING', 'RECONNECTING', 'QUEUED', 'CONNECTING'].includes(normalized)) return 'status-warning'; return 'status-danger'; }