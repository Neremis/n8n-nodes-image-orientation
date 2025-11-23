import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { createWorker } from 'tesseract.js';

interface OsdWorker {
	detect: (image: unknown) => Promise<{ data?: unknown }>;
	terminate: () => Promise<void>;
}

export class ImageOrientation implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Image Orientation',
		name: 'imageOrientation',
		icon: 'file:ImageOrientation.svg',
		group: ['transform'],
		version: 1,
		description: 'Detect image text orientation using Tesseract.js OSD',
		defaults: {
			name: 'Image Orientation',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		properties: [
			{
				displayName: 'Binary Property Name',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				description:
					'Name of the binary property that contains the image to analyze (e.g. "data")',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnItems: INodeExecutionData[] = [];

		if (items.length === 0) {
			return [items];
		}

		const createOsdWorker = createWorker as unknown as (
			lang: string,
			oem: number,
			options: IDataObject,
		) => Promise<OsdWorker>;

		const worker = await createOsdWorker('osd', 0, {
			legacyCore: true,
			legacyLang: true,
			logger: (m: unknown) => {
				this.logger.debug('Tesseract OSD', m as IDataObject);
			},
		});

		try {
			for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
				try {
					const binaryPropertyName = this.getNodeParameter(
						'binaryPropertyName',
						itemIndex,
						'data',
					) as string;

					this.helpers.assertBinaryData(itemIndex, binaryPropertyName);

					const buffer = await this.helpers.getBinaryDataBuffer(
						itemIndex,
						binaryPropertyName,
					);

					const detectResult = await worker.detect(buffer);
					const osdData = (detectResult?.data ?? {}) as unknown as IDataObject;

					const orientationDegrees = osdData
						.orientation_degrees as number | null | undefined;
					const orientationConfidence = osdData
						.orientation_confidence as number | null | undefined;

					const textDetected =
						orientationDegrees !== null &&
						orientationDegrees !== undefined &&
						orientationConfidence !== null &&
						orientationConfidence !== undefined;

					const jsonData: IDataObject = {
						...osdData,
						textDetected,
					};

					const newItem: INodeExecutionData = {
						json: jsonData,
						binary: items[itemIndex].binary,
						pairedItem: { item: itemIndex },
					};

					returnItems.push(newItem);
				} catch (error) {
					if (this.continueOnFail()) {
						returnItems.push({
							json: {
								error: (error as Error).message ?? String(error),
							},
							binary: items[itemIndex]?.binary,
							pairedItem: { item: itemIndex },
						});
					} else {
						if (error instanceof NodeOperationError && error.context) {
							error.context.itemIndex = itemIndex;
							throw error;
						}
						throw new NodeOperationError(this.getNode(), error as Error, {
							itemIndex,
						});
					}
				}
			}
		} finally {
			await worker.terminate();
		}

		return [returnItems];
	}
}

