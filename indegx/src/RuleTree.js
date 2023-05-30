/**

    Determines if an object is a ManifestEntry
    @function isManifestEntry
    @param {any} object - The object to test
    @returns {boolean} Whether or not the object is a ManifestEntry
    */
export function isManifestEntry(object) { return (object.uri !== undefined && object.test !== undefined && object.actionsSuccess !== undefined && object.actionsFailure !== undefined); }
/**

    Determines if an object is a Manifest
    @function isManifest
    @param {any} object - The object to test
    @returns {boolean} Whether or not the object is a Manifest
    */
export function isManifest(object) { return (object.uri !== undefined && object.entries !== undefined && object.includes !== undefined); }
/**

    Determines if an object is a Test
    @function isTest
    @param {any} object - The object to test
    @returns {boolean} Whether or not the object is a Test
    */
export function isTest(object) { return (object.uri !== undefined) && !isManifest(object) && !isManifestEntry(object); }
/**

    Determines if an object is a dummy Test
    @function isDummyTest
    @param {any} object - The object to test
    @returns {boolean} Whether or not the object is a dummy Test (i.e. has no query)
    */
export function isDummyTest(object) { return isTest(object) && object.query === undefined; }
/**

    Determines if an object is an Action
    @function isAction
    @param {any} object - The object to test
    @returns {boolean} Whether or not the object is an Action
    */
export function isAction(object) { return (object.action !== undefined); }
