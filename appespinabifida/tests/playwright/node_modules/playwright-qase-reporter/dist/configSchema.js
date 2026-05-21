"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configSchema = void 0;
exports.configSchema = {
    type: 'object',
    nullable: true,
    properties: {
        framework: {
            type: 'object',
            nullable: true,
            properties: {
                playwright: {
                    type: 'object',
                    nullable: true,
                    properties: {
                        browser: {
                            type: 'object',
                            nullable: true,
                            properties: {
                                addAsParameter: {
                                    type: 'boolean',
                                    nullable: true,
                                },
                                parameterName: {
                                    type: 'string',
                                    nullable: true,
                                },
                            }
                        },
                        markAsFlaky: {
                            type: 'boolean',
                            nullable: true,
                        },
                    }
                }
            }
        }
    }
};
