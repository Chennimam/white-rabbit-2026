-- Counters only: no questions, contact information, raw IPs or conversation history.
CREATE TABLE IF NOT EXISTS escalation_limits (
  bucket TEXT PRIMARY KEY,
  hits INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS escalation_limits_expiry ON escalation_limits(expires_at);
