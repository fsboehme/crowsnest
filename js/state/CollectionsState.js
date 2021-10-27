import { AbstractStateComponent } from './AbstractStateComponent.js';
import { AccountState } from './AccountState.js';

function hideForAccount (address, collection) {
    const key = `hidden_collections_${address}`;
    const hidden = new Set();

    const hiddenCollectionsStorage = localStorage[key];

    if (hiddenCollectionsStorage) {
        hidden.add(...JSON.parse(hiddenCollectionsStorage));
    }

    hidden.add(collection);

    localStorage[key] = JSON.stringify(Array.from(hidden));
}

function getHiddenCollections (address) {
    const key = `hidden_collections_${address}`;

    const hiddenCollectionsStorage = localStorage[key];

    if (hiddenCollectionsStorage) {
        return JSON.parse(hiddenCollectionsStorage);
    }
    else {
        return new Set();
    }
}

export class CollectionsStateComponent extends AbstractStateComponent {
    state = [];

    constructor (account) {
        super();
        this.account = account;
    }

    async set (state) {
        const resolvedState = await state;
        const address = this.account.get().address;
        const hiddenCollections = getHiddenCollections(address);

        if (hiddenCollections) {
            for (let collection of hiddenCollections) {
                const stateCollection = resolvedState.find(c => c.slug === collection);
                if (stateCollection)
                    stateCollection.hidden = true;
            }
        }

        super.set(state);
    }

    getCollection (collection) {
        return this.state.find(c => c.slug === collection);
    }

    getVisible () {
        return this.get().filter(c => c.hidden !== true);
    }

    isVisible (collection) {
        return !this.getCollection(collection)?.hidden;
    }

    async hide (collection) {
        const address = this.account.get().address;
        this.getCollection(collection).hidden = true;
        hideForAccount(address, collection);
        await this.emitUpdate();
    }

    async unhide (collection) {
        this.getCollection(collection).hidden = false;
        await this.emitUpdate();
    }
}

export const CollectionsState = new CollectionsStateComponent(AccountState);