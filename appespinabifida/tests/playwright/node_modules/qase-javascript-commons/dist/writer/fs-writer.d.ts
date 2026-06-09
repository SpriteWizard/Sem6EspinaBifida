import { WriterInterface } from './writer-interface';
import { TestResultType, Attachment, Report } from '../models';
import { FormatEnum } from './driver-enum';
export interface FsWriterOptionsType {
    path?: string | undefined;
    format?: FormatEnum | undefined;
}
/**
 * @class FsWriter
 * @implements WriterInterface
 */
export declare class FsWriter implements WriterInterface {
    private readonly path;
    private readonly format;
    private formatter;
    /**
     * @param {FsWriterOptionsType | undefined} options
     */
    constructor(options: FsWriterOptionsType | undefined);
    /**
     * @returns {void}
     */
    clearPreviousResults(): void;
    /**
     * @param {Attachment[]} attachments
     * @returns {Attachment[]}
     */
    writeAttachment(attachments: Attachment[]): Attachment[];
    /**
     * @param {TestResultType[]} results
     * @returns {Promise<string>}
     */
    writeReport(results: Report): Promise<string>;
    /**
     * @returns {Promise<void>}
     * @param {TestResultType} result
     */
    writeTestResult(result: TestResultType): Promise<void>;
    private deleteFolderRecursive;
}
