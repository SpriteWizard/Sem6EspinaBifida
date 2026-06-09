import { FormatterInterface } from './formatter-interface';
export interface JsonFormatterOptionsType {
    space?: number | undefined;
}
/**
 * @class JsonFormatter
 * @implements FormatterInterface
 */
export declare class JsonFormatter implements FormatterInterface {
    private space;
    constructor(options?: JsonFormatterOptionsType);
    format(object: unknown): Promise<string>;
}
