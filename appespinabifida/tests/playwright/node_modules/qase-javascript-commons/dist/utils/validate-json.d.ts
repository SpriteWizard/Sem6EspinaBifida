import { ErrorObject, JSONSchemaType } from 'ajv';
/**
 * @class JsonValidationError
 * @extends Error
 */
export declare class JsonValidationError extends Error {
    validationErrors: ErrorObject[];
    /**
     * @param {ErrorObject[]} validationErrors
     * @param {string} message
     */
    constructor(validationErrors: ErrorObject[], message?: string);
}
/**
 * @template T
 * @param {JSONSchemaType<T>} schema
 * @param json
 * @returns {asserts json is T}
 */
export declare function validateJson<T>(schema: JSONSchemaType<T>, json: unknown): asserts json is T;
