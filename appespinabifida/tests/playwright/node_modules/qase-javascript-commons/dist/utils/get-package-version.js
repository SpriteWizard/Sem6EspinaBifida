"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPackageVersion = void 0;
const fs_1 = require("fs");
/**
 * @param {string} name
 * @returns {undefined | string}
 */
const getPackageVersion = (name) => {
    try {
        const pathToPackageJson = require.resolve(`${name}/package.json`, {
            paths: [process.cwd()],
        });
        const packageString = (0, fs_1.readFileSync)(pathToPackageJson, 'utf8');
        const packageObject = JSON.parse(packageString);
        if (typeof packageObject === 'object' &&
            packageObject &&
            'version' in packageObject) {
            return String(packageObject.version);
        }
    }
    catch { /* ignore */ }
    return undefined;
};
exports.getPackageVersion = getPackageVersion;
