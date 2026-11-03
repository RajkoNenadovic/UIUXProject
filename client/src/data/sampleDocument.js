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
      confidence: 0.98,
      status: 'match',
      category: 'obligationDeadline'
    },
    {
      id: 2,
      position: 2,
      sectionRef: '§7.2',
      originalText: "The Tenant shall give not less than sixty (60) days' written notice prior to the expiration of the term of its intention not to renew; absent such notice, the tenancy shall be deemed renewed for a further term of twelve (12) months.",
      plainText: 'If you want to leave when the lease ends, tell the landlord in writing at least 60 days before. If you do not, the lease renews by itself for another 12 months.',
      confidence: 0.96,
      status: 'match',
      category: 'obligationDeadline'
    },
    {
      id: 3,
      position: 3,
      sectionRef: '§9.1',
      originalText: 'The Landlord may enter the Premises upon reasonable notice for inspection, repair or other purposes deemed appropriate.',
      plainText: 'The landlord can come into your home to inspect or fix things, after giving you “reasonable notice”.',
      confidence: 0.61,
      status: 'uncertain',
      category: 'uncertain',
      uncertainReason: 'The contract does not say how many hours or days “reasonable” means, and “other purposes” is open-ended.'
    }
  ]
};
