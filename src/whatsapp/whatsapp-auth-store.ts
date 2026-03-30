import { initAuthCreds, proto } from '@whiskeysockets/baileys';
import { AuthenticationCreds, AuthenticationState, SignalDataSet, SignalDataTypeMap, SignalKeyStore } from '@whiskeysockets/baileys';
import { PrismaService } from 'src/database/prisma/prisma.service';

function serializeBuffer(value: unknown): unknown {
  if (value instanceof Uint8Array || Buffer.isBuffer(value)) {
    return { _type: 'Buffer', data: Buffer.from(value).toString('base64') };
  }
  if (Array.isArray(value)) return value.map(serializeBuffer);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = serializeBuffer(v);
    }
    return out;
  }
  return value;
}

function deserializeBuffer(value: unknown): unknown {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    if (obj['_type'] === 'Buffer' && typeof obj['data'] === 'string') {
      return Buffer.from(obj['data'] as string, 'base64');
    }
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = deserializeBuffer(v);
    }
    return out;
  }
  if (Array.isArray(value)) return value.map(deserializeBuffer);
  return value;
}

type SessionBlob = {
  creds: AuthenticationCreds;
  keys: Record<string, Record<string, unknown>>;
};

export async function usePrismaAuthState(
  deviceId: string,
  prisma: PrismaService,
): Promise<{ state: AuthenticationState; saveCreds: () => Promise<void> }> {
  const row = await prisma.deviceSession.findUnique({ where: { deviceId } });

  let blob: SessionBlob;
  if (row) {
    blob = deserializeBuffer(JSON.parse(row.sessionBlobEncrypted)) as SessionBlob;
  } else {
    blob = { creds: initAuthCreds(), keys: {} };
  }

  const keys: SignalKeyStore = {
    get<T extends keyof SignalDataTypeMap>(type: T, ids: string[]) {
      const typeMap = blob.keys[type] ?? {};
      const result: Record<string, SignalDataTypeMap[T]> = {};
      for (const id of ids) {
        if (typeMap[id] !== undefined) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let val = typeMap[id] as any;
          if (type === 'app-state-sync-key' && val) {
            val = proto.Message.AppStateSyncKeyData.fromObject(val);
          }
          result[id] = val;
        }
      }
      return result;
    },

    set(data: SignalDataSet) {
      for (const [type, entries] of Object.entries(data)) {
        if (!entries) continue;
        if (!blob.keys[type]) blob.keys[type] = {};
        for (const [id, value] of Object.entries(entries)) {
          if (value != null) {
            blob.keys[type][id] = value;
          } else {
            delete blob.keys[type][id];
          }
        }
      }
    },

    clear() {
      blob.keys = {};
    },
  };

  const saveCreds = async () => {
    const serialized = JSON.stringify(serializeBuffer(blob));
    await prisma.deviceSession.upsert({
      where: { deviceId },
      update: { sessionBlobEncrypted: serialized, sessionVersion: { increment: 1 } },
      create: { deviceId, sessionBlobEncrypted: serialized },
    });
  };

  return { state: { creds: blob.creds, keys }, saveCreds };
}
