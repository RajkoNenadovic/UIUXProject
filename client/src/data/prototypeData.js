export const jargonTerms = {
  forbearance: {
    term: 'forbearance',
    definition: 'Choosing not to enforce a right, such as letting someone pay late without punishing them.',
    sentence: 'Any prior forbearance by the Landlord',
    partOfSpeech: 'noun'
  },
  remit: {
    term: 'remit',
    definition: 'To send or pay money that is owed.',
    sentence: 'Remit the Rent in advance',
    partOfSpeech: 'verb'
  },
  discretion: {
    term: 'sole discretion',
    definition: 'The right to decide something without needing another person’s approval.',
    sentence: 'At its sole discretion',
    partOfSpeech: 'phrase'
  },
  deemed: {
    term: 'deemed',
    definition: 'Treated as or considered to be something, even if it is not stated directly.',
    sentence: 'The tenancy shall be deemed renewed',
    partOfSpeech: 'verb'
  }
};

export const actionItems = [
  { id: 1, kind: 'must', title: 'Pay your rent', deadline: 'The 5th of every month', consequence: 'The landlord can add a 5% fee if you pay late.', sourceRef: '§7.1', done: false },
  { id: 2, kind: 'must', title: 'Tell the landlord in writing if you want to leave', deadline: '60 days before the lease ends', consequence: 'The lease renews for 12 more months if you do not give notice.', sourceRef: '§7.2', done: false },
  { id: 3, kind: 'must', title: 'Let the landlord in to inspect or repair', deadline: 'When reasonable notice is given', consequence: 'The contract does not say how much notice is needed.', sourceRef: '§9.1', done: false },
  { id: 4, kind: 'can', title: 'Leave when the lease ends', deadline: 'When the lease ends', consequence: 'You do not have to stay if you give notice in time.', sourceRef: '§7.2', done: false }
];

export const questionAnswers = [
  { match: ['rent', 'pay', 'payment'], answer: 'Pay your rent by the 5th of every month. A late payment can result in a 5% fee.', sourceRef: '§7.1' },
  { match: ['leave', 'renew', 'renewal'], answer: 'Give the landlord written notice at least 60 days before the lease ends if you do not want to renew.', sourceRef: '§7.2' },
  { match: ['enter', 'home', 'inspection'], answer: 'The landlord may enter for inspection or repairs after reasonable notice.', sourceRef: '§9.1' }
];

export const exportFormats = ['pdf', 'word', 'text', 'share'];
