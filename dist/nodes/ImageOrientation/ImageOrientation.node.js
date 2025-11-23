"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageOrientation = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const tesseract_js_1 = require("tesseract.js");
class ImageOrientation {
    constructor() {
        this.description = {
            displayName: 'Image Orientation',
            name: 'imageOrientation',
            icon: 'file:ImageOrientation.svg',
            group: ['transform'],
            version: 1,
            description: 'Detect image text orientation using Tesseract.js OSD',
            defaults: {
                name: 'Image Orientation',
            },
            inputs: [n8n_workflow_1.NodeConnectionTypes.Main],
            outputs: [n8n_workflow_1.NodeConnectionTypes.Main],
            usableAsTool: true,
            properties: [
                {
                    displayName: 'Binary Property Name',
                    name: 'binaryPropertyName',
                    type: 'string',
                    default: 'data',
                    description: 'Name of the binary property that contains the image to analyze (e.g. "data")',
                },
            ],
        };
    }
    async execute() {
        var _a, _b, _c;
        const items = this.getInputData();
        const returnItems = [];
        if (items.length === 0) {
            return [items];
        }
        const createOsdWorker = tesseract_js_1.createWorker;
        const worker = await createOsdWorker('osd', 0, {
            legacyCore: true,
            legacyLang: true,
            logger: (m) => {
                this.logger.debug('Tesseract OSD', m);
            },
        });
        try {
            for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
                try {
                    const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex, 'data');
                    this.helpers.assertBinaryData(itemIndex, binaryPropertyName);
                    const buffer = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);
                    const detectResult = await worker.detect(buffer);
                    const osdData = ((_a = detectResult === null || detectResult === void 0 ? void 0 : detectResult.data) !== null && _a !== void 0 ? _a : {});
                    const orientationDegrees = osdData
                        .orientation_degrees;
                    const orientationConfidence = osdData
                        .orientation_confidence;
                    const textDetected = orientationDegrees !== null &&
                        orientationDegrees !== undefined &&
                        orientationConfidence !== null &&
                        orientationConfidence !== undefined;
                    const jsonData = {
                        ...osdData,
                        textDetected,
                    };
                    const newItem = {
                        json: jsonData,
                        binary: items[itemIndex].binary,
                        pairedItem: { item: itemIndex },
                    };
                    returnItems.push(newItem);
                }
                catch (error) {
                    if (this.continueOnFail()) {
                        returnItems.push({
                            json: {
                                error: (_b = error.message) !== null && _b !== void 0 ? _b : String(error),
                            },
                            binary: (_c = items[itemIndex]) === null || _c === void 0 ? void 0 : _c.binary,
                            pairedItem: { item: itemIndex },
                        });
                    }
                    else {
                        if (error instanceof n8n_workflow_1.NodeOperationError && error.context) {
                            error.context.itemIndex = itemIndex;
                            throw error;
                        }
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), error, {
                            itemIndex,
                        });
                    }
                }
            }
        }
        finally {
            await worker.terminate();
        }
        return [returnItems];
    }
}
exports.ImageOrientation = ImageOrientation;
//# sourceMappingURL=ImageOrientation.node.js.map