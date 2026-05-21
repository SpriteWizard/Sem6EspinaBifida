export interface ErrorOptionsType {
    cause?: unknown;
}
export interface QaseErrorInterface extends Error {
    cause?: unknown;
}
/**
 * @class QaseError
 * @extends Error
 * @implements QaseErrorInterface
 */
export declare class QaseError extends Error implements QaseErrorInterface {
    /**
     * @type {unknown}
     */
    cause?: unknown;
    constructor(message?: string, options?: ErrorOptionsType);
}
