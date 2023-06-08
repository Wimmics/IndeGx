import { Asset } from "./RuleTree";
import * as Logger from "./LogUtils.js"


export enum AssetState {
    ONGOING = "ONGOING",
    FINISHED = "FINISHED",
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

    private assetApplicationStateMap: Map<string, Map<string, AssetState>> = new Map<string, Map<string, AssetState>>();
    private assetApplicationMap: Map<string, Map<string, Promise<void>>> = new Map<string, Map<string, Promise<void>>>();
    private assetMap: Map<string, Asset> = new Map<string, Asset>();

    public setAssetState(asset: string, endpointUrl: string, state: AssetState) {
        if(asset === undefined || endpointUrl === undefined || state === undefined) {
            Logger.error("AssetTracker.setAssetState: asset, endpointUrl or state is undefined");
            throw new Error("AssetTracker.setAssetState: asset, endpointUrl or state is undefined");
        }
        if (!this.assetApplicationStateMap.has(endpointUrl)) {
            this.assetApplicationStateMap.set(endpointUrl, new Map<string, AssetState>());
        }
        this.assetApplicationStateMap.get(endpointUrl).set(asset, state);
    }

    public getAssetState(asset: string, endpointUrl: string): AssetState {
        if(asset === undefined || endpointUrl === undefined) {
            Logger.error("AssetTracker.getAssetState: asset or endpointUrl is undefined");
            throw new Error("AssetTracker.getAssetState: asset or endpointUrl is undefined");
        }
        if (!this.assetApplicationStateMap.has(endpointUrl)) {
            this.assetApplicationStateMap.set(endpointUrl, new Map<string, AssetState>());
        }
        return this.assetApplicationStateMap.get(endpointUrl).get(asset);
    }

    public setAssetStateToFinished(asset: string, endpointUrl: string) {
        this.setAssetState(asset, endpointUrl, AssetState.FINISHED);
    }

    public setAssetStateToOngoing(asset: string, endpointUrl: string) {
        this.setAssetState(asset, endpointUrl, AssetState.ONGOING);
    }

    public isFinished(asset: string, endpointUrl: string): boolean {
        return this.assetStateExists(endpointUrl, asset) && this.getAssetState(endpointUrl, asset) === AssetState.FINISHED;
    }

    public isOngoing(asset: string, endpointUrl: string): boolean {
        return this.assetStateExists(endpointUrl, asset) && this.getAssetState(endpointUrl, asset) === AssetState.ONGOING;;
    }

    private assetStateExists(asset: string, endpointUrl: string): boolean {
        if (!this.assetApplicationStateMap.has(endpointUrl)) {
            this.assetApplicationStateMap.set(endpointUrl, new Map<string, AssetState>());
        }
        return this.assetApplicationStateMap.get(endpointUrl).has(asset);
    }

    public setApplicationPromise(asset: string, endpointUrl: string, promise: Promise<void>) {
        if(asset === undefined || endpointUrl === undefined || promise === undefined) {
            Logger.error("AssetTracker.setApplicationPromise: asset, endpointUrl or promise is undefined");
            throw new Error("AssetTracker.setApplicationPromise: asset, endpointUrl or promise is undefined");
        }
        if (!this.assetApplicationMap.has(endpointUrl)) {
            this.assetApplicationMap.set(endpointUrl, new Map<string, Promise<void>>());
        }
        this.assetApplicationMap.get(endpointUrl).set(asset, promise);
    }

    public getApplicationPromise(asset: string, endpointUrl: string): Promise<void> {
        if(asset === undefined || endpointUrl === undefined) {
            Logger.error("AssetTracker.getApplicationPromise: asset or endpointUrl is undefined");
            throw new Error("AssetTracker.getApplicationPromise: asset or endpointUrl is undefined");
        }
        if (!this.assetApplicationMap.has(endpointUrl)) {
            this.assetApplicationMap.set(endpointUrl, new Map<string, Promise<void>>());
        }
        return this.assetApplicationMap.get(endpointUrl).get(asset);
    }

    public hasApplicationPromise(asset: string, endpointUrl: string): boolean {
        if(asset === undefined || endpointUrl === undefined) {
            Logger.error("AssetTracker.hasApplicationPromise: asset or endpointUrl is undefined");
            throw new Error("AssetTracker.hasApplicationPromise: asset or endpointUrl is undefined");
        }
        if (!this.assetApplicationMap.has(endpointUrl)) {
            this.assetApplicationMap.set(endpointUrl, new Map<string, Promise<void>>());
        }
        return this.assetApplicationMap.get(endpointUrl).has(asset);
    }

    public addAsset(asset: Asset): void {
        if(asset === undefined) {
            Logger.error("AssetTracker.addAsset: asset is undefined");
            throw new Error("AssetTracker.addAsset: asset is undefined");
        }
        this.assetMap.set(asset.uri, asset);
    }

    public getAsset(asset: string): Asset {
        if(asset === undefined || asset === null || asset === "") {
            Logger.error("AssetTracker.getAsset: asset '", asset,"' is invalid");
            throw new Error("AssetTracker.getAsset: asset '"+ asset +"' is invalid");
        }
        return this.assetMap.get(asset);
    }

    public hasAsset(asset: string): boolean {
        if(asset === undefined || asset === null || asset === "") {
            Logger.error("AssetTracker.hasAsset: asset '", asset,"' is invalid");
            throw new Error("AssetTracker.hasAsset: asset '"+ asset +"' is invalid");
        }
        return this.assetMap.has(asset);
    }
}