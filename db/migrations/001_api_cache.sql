CREATE TABLE IF NOT EXISTS api_cache (
  cache_key TEXT PRIMARY KEY,
  provider VARCHAR(32) NOT NULL,
  payload JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS api_cache_provider_expires_idx
  ON api_cache (provider, expires_at);

CREATE TABLE IF NOT EXISTS provider_sync_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  provider VARCHAR(32) NOT NULL,
  operation TEXT NOT NULL,
  cache_key TEXT,
  status VARCHAR(16) NOT NULL,
  duration_ms INTEGER NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS provider_sync_logs_created_idx
  ON provider_sync_logs (provider, created_at DESC);