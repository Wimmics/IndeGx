import { Asset } from "./RuleTree";


export enum AssetState {
    ONGOING,
    SUCCESS,
    FAILED
}

export class AssetTracker {
    private static instance: AssetTracker;
    private constructor() { }
    static getInstance() {
        if (!AssetTracker.instance) {
            AssetTracker.instance = new AssetTracker();
        }
        return AssetTracker.instance;
    }

    private assetStateMap: Map<string, Map<string, AssetState>> = new Map<string, Map<string, AssetState>>();
    private assetIndexMap: Map<string, Asset> = new Map<string, Asset>();
    private assetApplicationMap: Map<string, Map<string, Promise<void>>> = new Map<string, Map<string, Promise<void>>>();

    public setAssetState(asset: string, endpointUrl: string, state: AssetState) {
        if(!this.assetStateMap.has(endpointUrl)) {
            this.assetStateMap.set(endpointUrl, new Map<string, AssetState>());
        }
        this.assetStateMap.get(endpointUrl).set(asset, state);
    }

    public getAssetState(asset: string, endpointUrl: string): AssetState {
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

    public isFinished(asset: string, endpointUrl: string): boolean {
        return this.assetStateExists(endpointUrl, asset) && this.getAssetState(endpointUrl, asset) !== AssetState.ONGOING;
    }

    public isFailed(asset: string, endpointUrl: string): boolean {
        return this.assetStateExists(endpointUrl, asset) && this.getAssetState(endpointUrl, asset) === AssetState.FAILED;
    }

    public isSuccessful(asset: string, endpointUrl: string): boolean {
        return this.assetStateExists(endpointUrl, asset) && this.getAssetState(endpointUrl, asset) === AssetState.SUCCESS;
    }

    public isStarted(asset: string, endpointUrl: string): boolean {
        return this.assetStateExists(endpointUrl, asset);
    }

    private assetStateExists(asset: string, endpointUrl: string): boolean {
        if(!this.assetStateMap.has(endpointUrl)) {
            this.assetStateMap.set(endpointUrl, new Map<string, AssetState>());
        }
        return this.assetStateMap.get(endpointUrl).has(asset);
    }

    public addAsset(asset: Asset) {
        this.assetIndexMap.set(asset.uri, asset);
    }

    public getAsset(uri: string): Asset {
        return this.assetIndexMap.get(uri);
    }

    public removeAsset(uri: string) {
        this.assetIndexMap.delete(uri);
    }

    public hasAsset(uri: string): boolean {
        return this.assetIndexMap.has(uri);
    }
        
    public setApplicationPromise(asset: string, endpointUrl: string, promise: Promise<void>) {
        if(!this.assetApplicationMap.has(endpointUrl)) {
            this.assetApplicationMap.set(endpointUrl, new Map<string, Promise<void>>());
        }
        this.assetApplicationMap.get(endpointUrl).set(asset, promise);
    }

    public getApplicationPromise(asset: string, endpointUrl: string): Promise<void> {
        if(!this.assetApplicationMap.has(endpointUrl)) {
            this.assetApplicationMap.set(endpointUrl, new Map<string, Promise<void>>());
        }
        return this.assetApplicationMap.get(endpointUrl).get(asset);
    }

    public hasApplicationPromise(asset: string, endpointUrl: string): boolean {
        if(!this.assetApplicationMap.has(endpointUrl)) {
            this.assetApplicationMap.set(endpointUrl, new Map<string, Promise<void>>());
        }
        return this.assetApplicationMap.get(endpointUrl).has(asset);
    }
}