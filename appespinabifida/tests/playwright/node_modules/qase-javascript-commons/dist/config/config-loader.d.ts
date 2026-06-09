import { JSONSchemaType } from 'ajv';
import { ConfigLoaderInterface } from './config-loader-interface';
import { ConfigType } from './config-type';
export declare class ConfigLoader<T extends Partial<ConfigType> & Record<string, unknown>> implements ConfigLoaderInterface<T> {
    private paths;
    private validationSchema;
    constructor(validationSchema?: JSONSchemaType<T>, paths?: string[]);
    private read;
    load(): (T & ConfigType) | null;
}
