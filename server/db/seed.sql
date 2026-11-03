INSERT OR IGNORE INTO settings (id, reading_level, dyslexia_friendly, font_size, spacing, theme, locale)
VALUES (1, 6, 0, 'medium', 'comfortable', 'light', 'en');

INSERT OR IGNORE INTO documents (id, title, doc_type, page_count, original_text, reading_level, status)
VALUES (
  1,
  'Lease_Agreement_2026',
  'Lease agreement',
  14,
  'The Tenant shall, notwithstanding any prior forbearance by the Landlord, remit the Rent in advance on or before the fifth (5th) day of each calendar month, failing which the Landlord may, at its sole discretion, levy a late charge of five percent (5%) of the amount outstanding. The Tenant shall give not less than sixty (60) days'' written notice prior to the expiration of the term of its intention not to renew; absent such notice, the tenancy shall be deemed renewed for a further term of twelve (12) months. The Landlord may enter the Premises upon reasonable notice for inspection, repair or other purposes deemed appropriate.',
  6,
  'ready'
);

INSERT OR IGNORE INTO sentences (id, document_id, position, section_ref, original_text, plain_text, confidence, status, uncertain_reason)
VALUES
  (1, 1, 1, '§7.1', 'The Tenant shall, notwithstanding any prior forbearance by the Landlord, remit the Rent in advance on or before the fifth (5th) day of each calendar month, failing which the Landlord may, at its sole discretion, levy a late charge of five percent (5%) of the amount outstanding.', 'Pay your rent by the 5th of every month. If you pay late, the landlord can add a 5% fee to what you owe.', 0.98, 'match', NULL),
  (2, 1, 2, '§7.2', 'The Tenant shall give not less than sixty (60) days'' written notice prior to the expiration of the term of its intention not to renew; absent such notice, the tenancy shall be deemed renewed for a further term of twelve (12) months.', 'If you want to leave when the lease ends, tell the landlord in writing at least 60 days before. If you do not, the lease renews by itself for another 12 months.', 0.96, 'match', NULL),
  (3, 1, 3, '§9.1', 'The Landlord may enter the Premises upon reasonable notice for inspection, repair or other purposes deemed appropriate.', 'The landlord can come into your home to inspect or fix things, after giving you “reasonable notice”.', 0.61, 'uncertain', 'The contract does not define how many hours or days “reasonable” means, and “other purposes” is open-ended.');

INSERT OR IGNORE INTO action_items (id, document_id, kind, title, deadline, consequence, source_ref, done)
VALUES
  (1, 1, 'must', 'Pay your rent', 'The 5th of every month', 'The landlord can add a 5% fee if you pay late.', '§7.1', 0),
  (2, 1, 'must', 'Tell the landlord in writing if you want to leave', '60 days before the lease ends', 'The lease renews for 12 more months if you do not give notice.', '§7.2', 0),
  (3, 1, 'must', 'Let the landlord in to inspect or repair', NULL, 'The contract does not say how much notice is needed.', '§9.1', 0),
  (4, 1, 'can', 'Get your deposit back', 'Within 30 days after moving out', 'The landlord may keep money for damage beyond normal wear.', '§11.3', 0),
  (5, 1, 'can', 'Leave when the lease ends', 'When the lease ends', 'You do not have to stay if you give notice in time.', '§7.2', 0);

INSERT OR IGNORE INTO saved_terms (id, term, definition, example_in_context, source_document_id)
VALUES
  (1, 'forbearance', 'Choosing not to enforce a right, such as letting someone pay late without punishing them.', 'Any prior forbearance by the Landlord', 1),
  (2, 'remit', 'To send or pay money that is owed.', 'Remit the Rent in advance', 1),
  (3, 'sole discretion', 'The right to decide something without needing another person’s approval.', 'At its sole discretion', 1),
  (4, 'deemed', 'Treated as or considered to be something, even if it is not stated directly.', 'The tenancy shall be deemed renewed', 1);
