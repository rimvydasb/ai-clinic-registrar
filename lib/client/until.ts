export function isValidArray(object: any, label: string = null) {
    if (object === null || !Array.isArray(object)) {
        console.error("ERROR: Wrong " + label + ":", object);
        return false;
    }
    return true;
}
