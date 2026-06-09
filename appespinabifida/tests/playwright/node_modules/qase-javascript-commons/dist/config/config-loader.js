"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigLoader = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const lodash_merge_1 = __importDefault(require("lodash.merge"));
const qase_error_1 = require("../utils/qase-error");
const validate_json_1 = require("../utils/validate-json");
const config_validation_schema_1 = require("./config-validation-schema");
class ConfigLoader {
    paths;
    validationSchema;
    constructor(validationSchema, paths = ['qase.config.json', '.qaserc']) {
        this.paths = paths;
        this.validationSchema = (0, lodash_merge_1.default)({}, config_validation_schema_1.configValidationSchema, validationSchema);
    }
    read() {
        for (const path of this.paths) {
            const filePath = (0, path_1.join)(process.cwd(), path);
            try {
                return (0, fs_1.readFileSync)(filePath, 'utf8');
            }
            catch (error) {
                const isNotFound = error instanceof Error &&
                    'code' in error &&
                    (error.code === 'ENOENT' || error.code === 'EISDIR');
                if (!isNotFound) {
                    throw new qase_error_1.QaseError('Cannot read config file', { cause: error });
                }
            }
        }
        return null;
    }
    load() {
        try {
            const data = this.read();
            if (data) {
                const json = JSON.parse(data);
                (0, validate_json_1.validateJson)(this.validationSchema, json);
                return json;
            }
        }
        catch (error) {
            if (error instanceof validate_json_1.JsonValidationError) {
                const [validationError] = error.validationErrors;
                const { instancePath = '', message = '' } = validationError ?? {};
                const configPath = instancePath
                    ? `\`${instancePath.substring(1).replace('/', '.')}\``
                    : 'it';
                throw new Error(`Invalid config: "${configPath}" ${message}`);
            }
            throw error;
        }
        return null;
    }
}
exports.ConfigLoader = ConfigLoader;
