/**
 * Deterministic shard assignment for a device ID.
 *
 * Uses a djb2-variant hash so it works for both UUID strings
 * (e.g. "f47ac10b-58cc-4372-a567-0e02b2c3d479") and legacy slug
 * device IDs (e.g. "seed-device-01").
 *
 * @returns 0 when totalShards <= 1 (single-worker mode, no sharding).
 */
export function shardForDevice(deviceId: string, totalShards: number): number {
  if (totalShards <= 1) return 0;
  let hash = 5381;
  for (let i = 0; i < deviceId.length; i++) {
    hash = ((hash << 5) + hash + deviceId.charCodeAt(i)) >>> 0; // keep 32-bit uint
  }
  return hash % totalShards;
}

/** Read shard config from env — defaults to single-worker mode (shard 0 of 1). */
export function readShardConfig(): { shardId: number; totalShards: number } {
  return {
    shardId: Number(process.env.SHARD_ID ?? '0'),
    totalShards: Number(process.env.TOTAL_SHARDS ?? '1'),
  };
}
