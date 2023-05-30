

export enum AssetState {
    ONGOING,
    SUCCESS,
    FAILED
}

export class RuleTracker {
    private static instance: RuleTracker;
    private constructor() { }
    static getInstance() {
        if (!RuleTracker.instance) {
            RuleTracker.instance = new RuleTracker();
        }
        return RuleTracker.instance;
    }

    private assetStateMap: Map<string, Map<string, AssetState>> = new Map<string, Map<string, AssetState>>();

    public setAssetState(asset: string, endpointUrl: string, state: AssetState) {
        if(!this.assetStateMap.has(endpointUrl)) {
            this.assetStateMap.set(endpointUrl, new Map<string, AssetState>());
        }
        this.assetStateMap.get(endpointUrl).set(asset, state);
    }

    public getAssetState(endpointUrl: string, asset: string): AssetState {
        if(!this.assetStateMap.has(endpointUrl)) {
            this.assetStateMap.set(endpointUrl, new Map<string, AssetState>());
        }
        return this.assetStateMap.get(endpointUrl).get(asset);
    }

    public setAssetStateToFailed(asset: string, endpointUrl: string) {
        this.setAssetState(asset, endpointUrl, AssetState.FAILED);
    }

    public setAssetStateToSuccess(asset: string, endpointUrl: string) {
        this.setAssetState(asset, endpointUrl, AssetState.SUCCESS);
    }

    public setAssetStateToOngoing(asset: string, endpointUrl: string) {
        this.setAssetState(asset, endpointUrl, AssetState.ONGOING);
    }

    public isFinished(endpointUrl: string, asset: string): boolean {
        if(!this.assetStateMap.has(endpointUrl)) {
            this.assetStateMap.set(endpointUrl, new Map<string, AssetState>());
        }
        return this.assetStateMap.get(endpointUrl).has(asset) && this.getAssetState(endpointUrl, asset) !== AssetState.ONGOING;
    }

    public isFailed(endpointUrl: string, asset: string): boolean {
        if(!this.assetStateMap.has(endpointUrl)) {
            this.assetStateMap.set(endpointUrl, new Map<string, AssetState>());
        }
        return this.assetStateMap.get(endpointUrl).has(asset) && this.getAssetState(endpointUrl, asset) === AssetState.FAILED;
    }

    public isSuccessful(endpointUrl: string, asset: string): boolean {
        if(!this.assetStateMap.has(endpointUrl)) {
            this.assetStateMap.set(endpointUrl, new Map<string, AssetState>());
        }
        return this.assetStateMap.get(endpointUrl).has(asset) && this.getAssetState(endpointUrl, asset) === AssetState.SUCCESS;
    }

    public isStarted(endpointUrl: string, asset: string): boolean {
        if(!this.assetStateMap.has(endpointUrl)) {
            this.assetStateMap.set(endpointUrl, new Map<string, AssetState>());
        }
        return this.assetStateMap.get(endpointUrl).has(asset);
    }
        
}