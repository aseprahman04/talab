/**
 * Devices pairing e2e
 *
 * Three levels of testing:
 *   1. API: pair returns 201 with PAIRING status (always runs)
 *   2. Socket: device.status.updated event fires via socket.io (always runs)
 *   3. QR code: Baileys emits QR (TEST_QR_AVAILABLE=1, needs WA server reachable)
 *   4. Connected: device reaches CONNECTED after QR scan (TEST_WA_AVAILABLE=1, manual scan)
 */
import { io, Socket } from 'socket.io-client';
import { apiPost, apiGet, BASE_URL, setupTestUser } from '../helpers/api';

const SOCKET_ORIGIN = BASE_URL.replace(/\/api$/, '');

let accessToken: string;
let workspaceId: string;
let deviceId: string;

beforeAll(async () => {
  ({ accessToken, workspaceId } = await setupTestUser('pairing'));

  const { data } = await apiPost<{ id: string }>(
    '/devices',
    { workspaceId, name: 'Pairing E2E Device' },
    accessToken,
  );
  deviceId = data.id;
});

describe('Device pairing e2e', () => {
  describe('POST /devices/:id/pair', () => {
    it('returns 201 with PAIRING status', async () => {
      const { status, data } = await apiPost<{ success: boolean; status: string }>(
        `/devices/${deviceId}/pair`,
        {},
        accessToken,
      );
      expect([200, 201]).toContain(status);
      expect(data.success).toBe(true);
      expect(data.status).toBe('PAIRING');
    });

    it('device status is PAIRING in DB after pair call', async () => {
      const { data } = await apiGet<Array<{ id: string; status: string }>>(
        `/devices?workspaceId=${workspaceId}`,
        accessToken,
      );
      const device = data.find((d) => d.id === deviceId);
      expect(device).toBeDefined();
      // PAIRING or CONNECTED (if previous valid session) or DISCONNECTED (if WA rejected)
      expect(['PAIRING', 'CONNECTED', 'DISCONNECTED']).toContain(device?.status);
    });
  });

  describe('socket.io device.status.updated event', () => {
    it('emits device.status.updated within 8 s of pair call', (done) => {
      // Create a fresh device for this isolated socket test
      let freshDeviceId: string;

      const socket: Socket = io(SOCKET_ORIGIN, {
        transports: ['websocket'],
        query: { workspaceId },
      });

      const finish = (err?: Error) => {
        clearTimeout(timeout);
        socket.disconnect();
        done(err);
      };

      const timeout = setTimeout(() => {
        finish(new Error('No device.status.updated received within 8 s'));
      }, 8000);

      socket.on('connect', async () => {
        const { data } = await apiPost<{ id: string }>(
          '/devices',
          { workspaceId, name: 'Socket Test Device' },
          accessToken,
        );
        freshDeviceId = data.id;
        await apiPost(`/devices/${freshDeviceId}/pair`, {}, accessToken);
      });

      socket.on('device.status.updated', (payload: { deviceId: string; status: string; qrCode?: string }) => {
        if (payload.deviceId !== freshDeviceId) return;
        // Any status update means the realtime pipeline is working
        expect(typeof payload.deviceId).toBe('string');
        expect(typeof payload.status).toBe('string');
        finish();
      });
    }, 12000);
  });

  describe('QR code emission (TEST_QR_AVAILABLE=1)', () => {
    const qrAvailable = process.env.TEST_QR_AVAILABLE === '1';
    const maybeIt = qrAvailable ? it : it.skip;

    maybeIt(
      'device.status.updated contains qrCode string when WA server reachable',
      (done) => {
        const socket: Socket = io(SOCKET_ORIGIN, {
          transports: ['websocket'],
          query: { workspaceId },
        });

        const finish = (err?: Error) => {
          clearTimeout(timeout);
          socket.disconnect();
          done(err);
        };

        const timeout = setTimeout(() => {
          finish(new Error('No QR code emitted within 20 s'));
        }, 20000);

        socket.on('connect', async () => {
          const { data } = await apiPost<{ id: string }>(
            '/devices',
            { workspaceId, name: 'QR Test Device' },
            accessToken,
          );
          await apiPost(`/devices/${data.id}/pair`, {}, accessToken);

          socket.on('device.status.updated', (payload: { deviceId: string; status: string; qrCode?: string }) => {
            if (payload.deviceId !== data.id) return;
            if (payload.qrCode) {
              expect(payload.status).toBe('PAIRING');
              expect(payload.qrCode.length).toBeGreaterThan(10);
              finish();
            }
          });
        });
      },
      25000,
    );
  });

  describe('Device reaches CONNECTED (TEST_WA_AVAILABLE=1, manual scan)', () => {
    const waAvailable = process.env.TEST_WA_AVAILABLE === '1';
    const maybeIt = waAvailable ? it : it.skip;

    maybeIt(
      'device status becomes CONNECTED within 60 s after QR scan',
      async () => {
        const deadline = Date.now() + 60_000;
        while (Date.now() < deadline) {
          const { data } = await apiGet<Array<{ id: string; status: string }>>(
            `/devices?workspaceId=${workspaceId}`,
            accessToken,
          );
          const device = data.find((d) => d.id === deviceId);
          if (device?.status === 'CONNECTED') return;
          await new Promise((r) => setTimeout(r, 3000));
        }
        throw new Error('Device did not reach CONNECTED within 60 s');
      },
      65000,
    );
  });
});
