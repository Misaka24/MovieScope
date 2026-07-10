CREATE TABLE IF NOT EXISTS api_cache (
  cache_key VARCHAR(768) PRIMARY KEY,
  provider VARCHAR(32) NOT NULL,
  payload JSON NOT NULL,
  fetched_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  expires_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX api_cache_provider_expires_idx (provider, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS provider_sync_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  provider VARCHAR(32) NOT NULL,
  operation VARCHAR(255) NOT NULL,
  cache_key VARCHAR(768) NULL,
  status VARCHAR(16) NOT NULL,
  duration_ms INT NOT NULL,
  error_message TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX provider_sync_logs_created_idx (provider, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
