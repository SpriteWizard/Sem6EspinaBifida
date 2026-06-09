import { FormatterInterface } from './formatter-interface';
export interface JsonpFormatterOptionsType {
    space?: number | undefined;
}
/**
 * @class JsonFormatter
 * @implements FormatterInterface
 */
export declare class JsonpFormatter implements FormatterInterface {
    private space;
    constructor(options?: JsonpFormatterOptionsType);
    format(object: unknown): Promise<string>;
}
