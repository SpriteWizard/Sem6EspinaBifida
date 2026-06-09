"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAxiosError = void 0;
/**
 * @param error
 * @returns {error is AxiosError}
 */
const isAxiosError = (error) => error instanceof Error
    && 'isAxiosError' in error
    && Boolean(error.isAxiosError);
exports.isAxiosError = isAxiosError;
