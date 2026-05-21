import { JSONSchemaType } from 'ajv';
import { FrameworkOptionsType } from 'qase-javascript-commons';
import { ReporterOptionsType } from './options';
export declare const configSchema: JSONSchemaType<FrameworkOptionsType<'playwright', ReporterOptionsType>>;
