export const sampleDocument = {
  title: 'Lease_Agreement_2026.pdf',
  page: 2,
  pageCount: 14,
  readingLevel: 6,
  sentences: [
    {
      id: 1,
      position: 1,
      sectionRef: '§7.1',
      originalText: 'The Tenant shall, notwithstanding any prior forbearance by the Landlord, remit the Rent in advance on or before the fifth (5th) day of each calendar month, failing which the Landlord may, at its sole discretion, levy a late charge of five percent (5%) of the amount outstanding.',
      plainText: 'Pay your rent by the 5th of every month. If you pay late, the landlord can add a 5% fee to what you owe.',
      plainTextByLevel: { 6: 'Pay your rent by the 5th of every month. If you pay late, the landlord can add a 5% fee to what you owe.', 8: 'Rent must be paid by the 5th each month. A late payment may add a 5% charge.', 10: 'The tenant must remit rent by the fifth calendar day each month; late payment may incur a 5% charge.' },
      confidence: 0.98,
      status: 'match',
      category: 'obligationDeadline',
      jargonTerms: [{ key: 'forbearance', label: 'forbearance' }, { key: 'remit', label: 'remit' }, { key: 'discretion', label: 'sole discretion' }]
    },
    {
      id: 2,
      position: 2,
      sectionRef: '§7.2',
      originalText: "The Tenant shall give not less than sixty (60) days' written notice prior to the expiration of the term of its intention not to renew; absent such notice, the tenancy shall be deemed renewed for a further term of twelve (12) months.",
      plainText: 'If you want to leave when the lease ends, tell the landlord in writing at least 60 days before. If you do not, the lease renews by itself for another 12 months.',
      plainTextByLevel: { 6: 'If you want to leave when the lease ends, tell the landlord in writing at least 60 days before. If you do not, the lease renews by itself for another 12 months.', 8: 'Give the landlord written notice at least 60 days before the lease ends if you do not want another 12-month term.', 10: 'The tenant must provide written non-renewal notice no fewer than 60 days before expiration, or the tenancy renews for 12 months.' },
      confidence: 0.96,
      status: 'match',
      category: 'obligationDeadline',
      jargonTerms: [{ key: 'deemed', label: 'deemed' }]
    },
    {
      id: 3,
      position: 3,
      sectionRef: '§9.1',
      originalText: 'The Landlord may enter the Premises upon reasonable notice for inspection, repair or other purposes deemed appropriate.',
      plainText: 'The landlord can come into your home to inspect or fix things, after giving you “reasonable notice”.',
      plainTextByLevel: { 6: 'The landlord can come into your home to inspect or fix things, after giving you “reasonable notice”.', 8: 'The landlord may enter to inspect or repair the home after giving notice, but the contract does not define how much notice is reasonable.', 10: 'The landlord may enter for inspection or repair following reasonable notice, although the agreement leaves that timing undefined.' },
      confidence: 0.61,
      status: 'uncertain',
      category: 'uncertain',
      uncertainReason: 'The contract does not say how many hours or days “reasonable” means, and “other purposes” is open-ended.'
    }
  ]
};
