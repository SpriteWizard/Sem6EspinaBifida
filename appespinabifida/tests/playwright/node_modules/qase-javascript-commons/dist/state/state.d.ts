import { ModeEnum } from '../options';
export interface StateModel {
    RunId: number | undefined;
    Mode: ModeEnum | undefined;
    IsModeChanged: boolean | undefined;
}
export declare class StateManager {
    static statePath: string;
    static getState(): StateModel;
    static setRunId(runId: number): void;
    static setMode(mode: ModeEnum): void;
    static setIsModeChanged(isModeChanged: boolean): void;
    static setState(state: StateModel): void;
    static clearState(): void;
    static isStateExists(): boolean;
}
