
// Stub out blockchain functionality for now, to be implemented later
const web3Stub = {
  connect: () => console.log('Blockchain connection stubbed'),
  getBalance: () => Promise.resolve('0'),
  isValidAddress: (address) => typeof address === 'string' && address.startsWith('0x'),
  verifyQuest: () => Promise.resolve(true),
  completeQuest: () => Promise.resolve('0xtransactionhash'),
  mintBadge: () => Promise.resolve(1),
  getTransactionStatus: () => Promise.resolve('success')
};

// Export using default ES module syntax
export default web3Stub;
