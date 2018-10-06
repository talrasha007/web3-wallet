const ProviderEngine = require('web3-provider-engine');
const CacheSubprovider = require('web3-provider-engine/subproviders/cache.js');
const FixtureSubprovider = require('web3-provider-engine/subproviders/fixture.js');
const FilterSubprovider = require('web3-provider-engine/subproviders/filters.js');
const walletFactory = require('ethereumjs-wallet');
const HookedWalletEthTxSubprovider = require('web3-provider-engine/subproviders/hooked-wallet-ethtx.js');
const NonceSubprovider = require('web3-provider-engine/subproviders/nonce-tracker.js');
const RpcSubprovider = require('web3-provider-engine/subproviders/rpc.js');

//Web3 Module
const Web3 = require('web3');

function promisify(fn) {
    const ret = function (...args) {
        const me = this;

        if (typeof args[args.length - 1] === 'function') {
            return fn.apply(me, args);
        } else {
          return new Promise(function (resolve, reject) {
            fn.apply(me, [...args, function (err, res) {
              if (err) reject(err);
              else resolve(res);
            }]);
          });
        }
    };

    if (fn.estimateGas) {
        ret.estimateGas = promisify(fn.estimateGas);
    }

    return ret;
}

function fromPrivateKey(privateKey) {
    //Wallet Initialization
    const privateKeyBuffer = new Buffer(privateKey, 'hex');
    return walletFactory.fromPrivateKey(privateKeyBuffer);
}

function fromV3(v3, password) {
    return walletFactory.fromV3(v3, password);
}

function generate() {
    return walletFactory.generate();
}

function create(myWallet, rpcUrl, opts = { cache: true }) {
    //Engine initialization & sub-provider attachment
    const engine = new ProviderEngine();

    // static results
    engine.addProvider(new FixtureSubprovider({
        web3_clientVersion: 'ProviderEngine/v0.0.0/javascript',
        net_listening: true,
        eth_hashrate: '0x00',
        eth_mining: false,
        eth_syncing: true,
    }));

    // cache layer
    opts.cache && engine.addProvider(new CacheSubprovider());

    // filters
    engine.addProvider(new FilterSubprovider());

    // pending nonce
    engine.addProvider(new NonceSubprovider());

    // vm
    // engine.addProvider(new VmSubprovider());

    // id mgmt
    myWallet && engine.addProvider(new HookedWalletEthTxSubprovider({
        getAccounts: function(cb){ cb(null, [ myWallet.getAddressString() ]) },
        getPrivateKey: function(address, cb){ cb(null, myWallet.getPrivateKey()) }
    }));

    // Here the URL can be your localhost for TestRPC or the Infura URL
    engine.addProvider(new RpcSubprovider({ rpcUrl }));

    // network connectivity error
    engine.on('error', function(err){
        // report connectivity errors
        console.error(err.stack)
    });

    // start polling for blocks
    engine.start();

    //Actual Initialization of the web3 module
    const web3 = new Web3(engine);

    if (myWallet) web3.eth.defaultAccount = myWallet.getAddressString();

    web3.eth.getAccounts = promisify(web3.eth.getAccounts);
    web3.eth.getBalance = promisify(web3.eth.getBalance);
    web3.eth.getBlockNumber = promisify(web3.eth.getBlockNumber);
    web3.eth.getBlock = promisify(web3.eth.getBlock);
    web3.eth.sendTransaction = promisify(web3.eth.sendTransaction);
    web3.eth.sendRawTransaction = promisify(web3.eth.sendRawTransaction);
    web3.eth.signTransaction = promisify(web3.eth.signTransaction);
    web3.eth.getTransactionCount = promisify(web3.eth.getTransactionCount);
    web3.eth.getGasPrice = promisify(web3.eth.getGasPrice);
    web3.eth.getTransactionReceipt = promisify(web3.eth.getTransactionReceipt);

    web3.loadContract = web3.eth.loadContract = function (abi, address) {
      const instance = web3.eth.contract(abi).at(address);

      abi.forEach(api => {
        if (api.type === 'function') {
          instance[api.name] = promisify(instance[api.name]);
        }
      });

      return instance;
    };

    return web3;
}

module.exports = {
    create,
    wallet: {
        fromPrivateKey,
        fromV3,
        generate
    }
};
