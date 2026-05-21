export declare class CompoundError {
    message: string | undefined;
    stacktrace: string | undefined;
    constructor();
    addMessage(message: string): void;
    addStacktrace(stacktrace: string): void;
}
