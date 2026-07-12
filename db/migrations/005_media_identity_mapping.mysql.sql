CREATE TABLE IF NOT EXISTS media_identity_mappings (
  imdb_id VARCHAR(32) NOT NULL,
  media_type ENUM('movie','tv') NOT NULL,
  tmdb_id BIGINT UNSIGNED NULL,
  douban_id VARCHAR(32) NULL,
  douban_url VARCHAR(500) NULL,
  match_method VARCHAR(64) NOT NULL DEFAULT 'douban-search-verified',
  match_confidence DECIMAL(5,4) NOT NULL DEFAULT 0,
  verified_imdb_id VARCHAR(32) NULL,
  status ENUM('verified','unmatched','error') NOT NULL DEFAULT 'unmatched',
  detail_json JSON NULL,
  error_message VARCHAR(1000) NULL,
  verified_at DATETIME(3) NULL,
  retry_after DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (imdb_id, media_type),
  KEY idx_media_identity_douban (douban_id),
  KEY idx_media_identity_retry (status, retry_after)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DELETE FROM api_provider_configs WHERE provider_key = 'imdbapi-dev';
