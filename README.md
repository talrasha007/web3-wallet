# web3-wallet
Wrap web3 (promisify function) for easier use.

## Usage
```js
  const wallet = Web3Wallet.wallet.fromPrivateKey('your private key');
  const web3 = Web3Wallet.create(wallet, url);
  
  console.log(await web3.eth.getBalance('address'));
  
  const yourContract = web3.eth.loadContract(contractAbi, contractAddr);
  console.log(yourContract.someFunction(...));
```
