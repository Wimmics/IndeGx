
/**

 Interface describing a test manifest
 @interface Manifest
 @property {string} uri - URI of the manifest
 @property {Array<ManifestEntry>} entries - Array of test entries
 @property {Array<Manifest>} includes - Array of other manifests that are included in this one
 */
export interface Manifest {
    uri: string;
    entries: Array<ManifestEntry>,
    includes: Array<Manifest>;
}

/**

    Interface describing a test entry in a manifest
    @interface ManifestEntry
    @property {string} uri - URI of the test entry
    @property {Test} test - The test object for this entry
    @property {Array<ManifestEntry | Action | Manifest>} actionsSuccess - Actions to perform if the test is successful
    @property {Array<ManifestEntry | Action | Manifest>} actionsFailure - Actions to perform if the test fails
    */
export interface ManifestEntry {
    uri: string;
    test: Test;
    actionsSuccess: Array<ManifestEntry | Action | Manifest>;
    actionsFailure: Array<ManifestEntry | Action | Manifest>;
}

/**

    Interface describing a test object
    @interface Test
    @property {string} uri - URI of the test
    @property {Array<string>} query - SPARQL query strings to execute as part of the test
    @property {Array<string>} description - Descriptions of the test
    @property {Array<string>} title - Titles of the test
    */
export interface Test {
    uri: string;
    query?: Array<string>;
    description?: Array<string>;
    title?: Array<string>;
}

/**

    Interface describing an action to be taken as part of a test
    @interface Action
    @property {string} endpoint - Endpoint to send the action to
    @property {number} timeout - Timeout for the action in seconds
    @property {number} pagination - Pagination parameter for the action
    @property {Array<string>} title - Titles of the action
    @property {Array<string>} action - Array of strings defining the action to take
    */
export interface Action {
    endpoint?: string;
    timeout?: number;
    pagination?: number;
    title?: Array<string>;
    action: Array<string>;
}

/**

    Determines if an object is a ManifestEntry
    @function isManifestEntry
    @param {any} object - The object to test
    @returns {boolean} Whether or not the object is a ManifestEntry
    */
export function isManifestEntry(object: any): boolean { return (object.uri !== undefined && object.test !== undefined && object.actionsSuccess !== undefined && object.actionsFailure !== undefined) }

/**

    Determines if an object is a Manifest
    @function isManifest
    @param {any} object - The object to test
    @returns {boolean} Whether or not the object is a Manifest
    */
export function isManifest(object: any): boolean { return (object.uri !== undefined && object.entries !== undefined && object.includes !== undefined) }

/**

    Determines if an object is a Test
    @function isTest
    @param {any} object - The object to test
    @returns {boolean} Whether or not the object is a Test
    */
export function isTest(object: any): boolean { return (object.uri !== undefined) && !isManifest(object) && !isManifestEntry(object) }

/**

    Determines if an object is a dummy Test
    @function isDummyTest
    @param {any} object - The object to test
    @returns {boolean} Whether or not the object is a dummy Test (i.e. has no query)
    */
export function isDummyTest(object: any): boolean { return isTest(object) && object.query === undefined }

/**

    Determines if an object is an Action
    @function isAction
    @param {any} object - The object to test
    @returns {boolean} Whether or not the object is an Action
    */
export function isAction(object: any): boolean { return (object.action !== undefined) }