"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompoundError = void 0;
class CompoundError {
    message;
    stacktrace;
    constructor() {
        this.message = 'CompoundError: One or more errors occurred. ---\n';
    }
    addMessage(message) {
        this.message += `${message}\n--- End of error message ---\n`;
    }
    addStacktrace(stacktrace) {
        if (!this.stacktrace) {
            this.stacktrace = `${indentAll(stacktrace)}\n--- End of stack trace ---\n`;
            return;
        }
        this.stacktrace += `${indentAll(stacktrace)}\n--- End of stack trace ---\n`;
    }
}
exports.CompoundError = CompoundError;
function indentAll(lines) {
    return lines.split('\n').map(x => '    ' + x).join('\n');
}
