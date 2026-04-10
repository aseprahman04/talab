-- Add per-device daily message limit to Plan
-- Default 200: conservative safe limit that protects WA numbers from being banned
-- Set to 0 for unlimited (Enterprise/custom plans)
ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "dailyDeviceLimit" INTEGER NOT NULL DEFAULT 200;
