"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateManager = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
class StateManager {
    static statePath = path_1.default.resolve(__dirname, 'reporterState.json');
    static getState() {
        let state = {
            RunId: undefined,
            Mode: undefined,
            IsModeChanged: undefined,
        };
        if (!this.isStateExists()) {
            return state;
        }
        try {
            const data = (0, fs_1.readFileSync)(this.statePath, 'utf8');
            state = JSON.parse(data);
        }
        catch (err) {
            console.error('Error reading state file:', err);
        }
        return state;
    }
    static setRunId(runId) {
        const state = this.getState();
        state.RunId = runId;
        this.setState(state);
    }
    static setMode(mode) {
        const state = this.getState();
        state.Mode = mode;
        state.IsModeChanged = true;
        this.setState(state);
    }
    static setIsModeChanged(isModeChanged) {
        const state = this.getState();
        state.IsModeChanged = isModeChanged;
        this.setState(state);
    }
    static setState(state) {
        try {
            const data = JSON.stringify(state);
            (0, fs_1.writeFileSync)(this.statePath, data);
        }
        catch (err) {
            console.error('Error writing state file:', err);
        }
    }
    static clearState() {
        if (!this.isStateExists()) {
            return;
        }
        try {
            (0, fs_1.unlinkSync)(this.statePath);
        }
        catch (err) {
            console.error('Error clearing state file:', err);
        }
    }
    static isStateExists() {
        return (0, fs_1.existsSync)(this.statePath);
    }
}
exports.StateManager = StateManager;
