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

function fromPrivateKey(privateKey) {
    //Wallet Initialization
    const privateKeyBuffer = new Buffer(privateKey, 'hex');
    return walletFactory.fromPrivateKey(privateKeyBuffer);
}

function generate() {
    return walletFactory.generate();
}

function create(myWallet, rpcUrl) {
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
    engine.addProvider(new CacheSubprovider());

    // filters
    engine.addProvider(new FilterSubprovider());

    // pending nonce
    engine.addProvider(new NonceSubprovider());

    // vm
    // engine.addProvider(new VmSubprovider());

    // id mgmt
    engine.addProvider(new HookedWalletEthTxSubprovider({
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
    return new Web3(engine);
}

module.exports = {
    create,
    wallet: {
        fromPrivateKey,
        generate
    }
};