import { EnvType } from './env-type';
import { ConfigType } from '../config';
/**
 * @param {EnvType} env
 * @returns {ConfigType}
 */
export declare const envToConfig: (env: EnvType) => ConfigType;
