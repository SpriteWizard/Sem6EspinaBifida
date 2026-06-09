"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QaseError = void 0;
/**
 * @class QaseError
 * @extends Error
 * @implements QaseErrorInterface
 */
class QaseError extends Error {
    /**
     * @type {unknown}
     */
    cause;
    constructor(message, options) {
        super(message);
        this.cause = options?.cause;
    }
}
exports.QaseError = QaseError;
