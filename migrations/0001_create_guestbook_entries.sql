CREATE TABLE guestbook_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO guestbook_entries (name, message, created_at) VALUES
  ('trace', 'great site!!! love the background. keep up the good work :)', '1999-02-14 12:00:00'),
  ('anonymous', 'intelligence agencies sign guestbooks too, apparently. hi.', '1999-03-03 12:00:00'),
  ('mico (the dog)', 'woof.', '1999-04-01 12:00:00');
