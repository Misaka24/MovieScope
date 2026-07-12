CREATE TABLE IF NOT EXISTS user_review_likes (
  review_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (review_id, user_id),
  KEY idx_review_likes_user (user_id, created_at),
  CONSTRAINT fk_review_likes_review FOREIGN KEY (review_id) REFERENCES user_media_entries(id) ON DELETE CASCADE,
  CONSTRAINT fk_review_likes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
