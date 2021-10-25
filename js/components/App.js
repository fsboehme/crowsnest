import { ethers, providers, BigNumber } from '../../node_modules/ethers/dist/ethers.esm.js';
import { PortfolioStats } from './PortfolioStats.js';
import { CollectionsTable } from './CollectionsTable.js';
import { Controls } from './Controls.js';
import * as Trades from '../data/Trades.js';
import * as opensea from '../opensea.js';
import * as analytics from '../analytics.js';
import { CollectionsState } from '../state/CollectionsState.js';
import { InvestmentsState } from '../state/InvestmentsState.js';

const { Web3Provider, WebSocketProvider } = providers;

export class App {
    provider = null;
    statsComponent = new PortfolioStats(window.stats);
    tableComponent = new CollectionsTable(window.collectionList);
    controlsComponent = new Controls(window.controls);

    constructor () {
        this.controlsComponent.onWalletConnected(() => {
            history.pushState(null, '', './');
            this.init();
        });

        this.controlsComponent.onCustomAddress(customAddress => {
            const newUrl = `?address=${customAddress}`;
            history.pushState({ customAddress }, '', newUrl);
            this.init(customAddress);
        });

        this.controlsComponent.render();
    }

    start () {
        if (window.ethereum) analytics.walletExists();

        window.addEventListener('popstate', e => {
            const address = e.state && e.state.customAddress;
            this.init(address);
        });

        const searchParams = new URLSearchParams(location.search);

        this.init(searchParams.get('address'));
    }

    init (address) {
        if (address) {
            this.controlsComponent.setCustomAddressValue(address)
            this.initWithAddress(address);
            analytics.initFromQueryParam(customAddress);
        }
        else if (window.ethereum) {
            this.controlsComponent.setCustomAddressValue('')
            this.initWithEthereum();
        }
    }

    async initWithEthereum() {
        window.stats.classList.add('hidden');
        window.collectionList.classList.add('hidden');

        if (!this.provider) {
            this.provider = new Web3Provider(window.ethereum);
        }

        const signer = this.provider.getSigner();

        try {
            const address = await signer.getAddress();
            this.initWithAddress(address);
            analytics.walletConnected(address);
        }
        catch (e) {
            analytics.walletExistsNotConnected();
        }
    }

    async initWithAddress(address) {
        window.stats.classList.add('hidden');
        window.collectionList.classList.add('hidden');

        if (!this.provider) {
            if (window.ethereum) {
                this.provider = new Web3Provider(window.ethereum);
            }
            else {
                this.provider = new WebSocketProvider(
                    'wss://mainnet.infura.io/ws/v3/f43414318fcc4cbc9b4f12c26fa11055'
                );
            }
        }

        const collectionsRequest = opensea.getCollections(address);
        const investmentsRequest = Trades.getInvestmentStats(address, this.provider);

        CollectionsState.set(collectionsRequest);
        InvestmentsState.set(investmentsRequest);

        window.stats.classList.remove('hidden');
        window.collectionList.classList.remove('hidden');
    }
};
