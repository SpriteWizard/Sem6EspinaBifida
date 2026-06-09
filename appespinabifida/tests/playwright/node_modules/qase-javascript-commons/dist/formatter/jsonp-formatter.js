"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonpFormatter = void 0;
const strip_ansi_1 = __importDefault(require("strip-ansi"));
/**
 * @class JsonFormatter
 * @implements FormatterInterface
 */
class JsonpFormatter {
    space;
    constructor(options = {}) {
        const { space = 4 } = options;
        this.space = space;
    }
    // eslint-disable-next-line @typescript-eslint/require-await
    async format(object) {
        const json = JSON.stringify(object, (key, value) => {
            if (key === 'error' && value instanceof Error) {
                return (0, strip_ansi_1.default)(String(value));
            }
            return value;
        }, this.space);
        return `qaseJsonp(${json});`;
    }
}
exports.JsonpFormatter = JsonpFormatter;
