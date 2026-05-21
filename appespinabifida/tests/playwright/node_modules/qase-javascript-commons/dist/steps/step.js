"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QaseStep = void 0;
const uuid_1 = require("uuid");
const path_1 = __importDefault(require("path"));
const models_1 = require("../models");
class QaseStep {
    name = '';
    attachments = [];
    steps = [];
    constructor(name) {
        this.name = name;
    }
    attach(attach) {
        if (attach.paths) {
            const files = Array.isArray(attach.paths) ? attach.paths : [attach.paths];
            for (const file of files) {
                const attachmentName = path_1.default.basename(file);
                const contentType = 'application/octet-stream';
                this.attachments.push({
                    id: (0, uuid_1.v4)(),
                    file_name: attachmentName,
                    mime_type: contentType,
                    content: '',
                    file_path: file,
                    size: 0,
                });
            }
            return;
        }
        if (attach.content) {
            const attachmentName = attach.name ?? 'attachment';
            const contentType = attach.type ?? 'application/octet-stream';
            this.attachments.push({
                id: (0, uuid_1.v4)(),
                file_name: attachmentName,
                mime_type: contentType,
                content: attach.content,
                file_path: null,
                size: attach.content.length,
            });
        }
    }
    async step(name, body) {
        const childStep = new QaseStep(name);
        // eslint-disable-next-line @typescript-eslint/require-await
        await childStep.run(body, async (step) => {
            this.steps.push(step);
        });
    }
    async run(body, messageEmitter) {
        const startDate = new Date().getTime();
        const step = new models_1.TestStepType();
        step.data = {
            action: this.name,
            expected_result: null,
            data: null,
        };
        try {
            await body.call(this, this);
            step.execution = {
                start_time: startDate,
                end_time: new Date().getTime(),
                status: models_1.StepStatusEnum.passed,
                duration: null,
            };
            step.attachments = this.attachments;
            step.steps = this.steps;
            await messageEmitter(step);
        }
        catch (error) {
            step.execution = {
                start_time: startDate,
                end_time: new Date().getTime(),
                status: models_1.StepStatusEnum.failed,
                duration: null,
            };
            step.attachments = this.attachments;
            step.steps = this.steps;
            await messageEmitter(step);
            throw error;
        }
    }
}
exports.QaseStep = QaseStep;
