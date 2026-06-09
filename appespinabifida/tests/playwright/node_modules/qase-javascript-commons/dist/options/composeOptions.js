"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.composeOptions = void 0;
const lodash_mergewith_1 = __importDefault(require("lodash.mergewith"));
const skipUndef = (value, src) => (src === undefined ? value : undefined);
const composeOptions = (...args) => {
    return (0, lodash_mergewith_1.default)({}, ...args, skipUndef);
};
exports.composeOptions = composeOptions;
