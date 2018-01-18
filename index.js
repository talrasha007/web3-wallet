//Provider Engine sub-modules
const ProviderEngine = require('web3-provider-engine');
const CacheSubprovider = require('web3-provider-engine/subproviders/cache.js');
const FixtureSubprovider = require('web3-provider-engine/subproviders/fixture.js');
const FilterSubprovider = require('web3-provider-engine/subproviders/filters.js');
const VmSubprovider = require('web3-provider-engine/subproviders/vm.js');
const NonceSubprovider = require('web3-provider-engine/subproviders/nonce-tracker.js');
const RpcSubprovider = require('web3-provider-engine/subproviders/rpc.js');

//EthereumJS Wallet Sub-Provider
const WalletSubprovider = require('ethereumjs-wallet/provider-engine');
const walletFactory = require('ethereumjs-wallet');

//Web3 Module
const Web3 = require('web3');

function Web3Wallet(privateKey, rpcUrl) {
    //Wallet Initialization
    const privateKeyBuffer = new Buffer(privateKey, "hex");
    const myWallet = walletFactory.fromPrivateKey(privateKeyBuffer);

    //Engine initialization & sub-provider attachment
    const engine = new ProviderEngine();

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
    engine.addProvider(new VmSubprovider());

    // Here the URL can be your localhost for TestRPC or the Infura URL
    engine.addProvider(new RpcSubprovider({ rpcUrl }));

    // Wallet Attachment
    engine.addProvider(new WalletSubprovider(myWallet, {}));

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

module.exports = Web3Wallet;