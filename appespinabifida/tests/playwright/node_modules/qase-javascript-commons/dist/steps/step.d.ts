import { Attachment, TestStepType } from '../models';
export type StepFunction<T = unknown> = (this: QaseStep, step: QaseStep) => T | Promise<T>;
export declare class QaseStep {
    name: string;
    attachments: Attachment[];
    steps: TestStepType[];
    constructor(name: string);
    attach(attach: {
        name?: string;
        type?: string;
        content?: string;
        paths?: string[] | string;
    }): void;
    step(name: string, body: StepFunction): Promise<void>;
    run(body: StepFunction, messageEmitter: (step: TestStepType) => Promise<void>): Promise<void>;
}
