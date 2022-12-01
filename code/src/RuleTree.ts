
export interface Manifest {
    uri: string;
    entries: Array<ManifestEntry>,
    includes: Array<Manifest>;
}

export interface ManifestEntry {
    uri: string;
    test: Test;
    actionsSuccess: Array<ManifestEntry | Action>;
    actionsFailure: Array<ManifestEntry | Action>;
}

export interface Test {
    uri: string;
    query?: Array<string> | undefined;
    description?: Array<string> | undefined;
    title?: Array<string> | undefined;
}

export interface Action {
    endpoint?: string | undefined;
    timeout?: number | undefined;
    pagination?: number;
    action: Array<string>;
}

export function isManifestEntry(object: any): boolean { return ( object.uri !== undefined && object.test !== undefined && object.actionsSuccess !== undefined && object.actionsFailure !== undefined) }
export function isManifest(object: any): boolean { return ( object.uri !== undefined && object.entries !== undefined && object.includes !== undefined) }
export function isTest(object: any): boolean { return ( object.uri !== undefined) && ! isManifest(object) && ! isManifestEntry(object) }
export function isDummyTest(object: any): boolean { return isTest(object) && object.query === undefined }
export function isAction(object: any): boolean { return ( object.action !== undefined) }