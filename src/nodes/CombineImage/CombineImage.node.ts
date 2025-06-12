import {
	IDataObject,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
	NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';
import { v4 as uuidv4 } from 'uuid';
import { makeOutputDirPath } from '../../utils/helper';
import { RabbitMQClient } from '../../services/rabbitmq';
import { JsonAIMessageHandler, JsonRpcMessageHandler } from '../../utils/message-handler';
import { JsonAIResponse } from '../../types/jsonai';
import { combineImageEmitter } from '../../events/eventEmitter';
import { combineImageConfig, rabbitMQConfig } from '../../config';

const rabbitMQClient = RabbitMQClient.getInstance();
rabbitMQClient.connect();

export class CombineImage implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'CombineImage',
		name: 'combineImage',
		icon: 'file:combineImage.svg',
		group: ['transform'],
		version: 1,
		defaults: {
			name: 'CombineImage',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		description: 'CombineImage',
		properties: [
			{
				displayName: 'File',
				name: 'file',
				type: 'string',
				default: '',
				description: 'The input image file',
				required: true,
			},
			{
				displayName: 'Another File',
				name: 'anotherFile',
				type: 'string',
				default: '',
				description: 'The second input image file',
				required: true,
			},
			{
				displayName: 'Style Combine Background',
				name: 'styleCombineBackground',
				type: 'string',
				default: '',
				description: 'The style to combine with the background',
				required: true,
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				description: 'The prompt to guide the image transformation',
				required: true,
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const processItem = (item: {
			file: string;
			anotherFile: string;
			styleCombineBackground: string;
			prompt: string;
		}) => {
			return new Promise(async (resolve, reject) => {
				const correlationId = uuidv4();
				const input = {
					file: item.file,
					anotherFile: item.anotherFile,
					styleCombineBackground: item.styleCombineBackground,
					prompt: item.prompt,
				};

				await rabbitMQClient.consumeQueue(rabbitMQConfig.queueOneTime, async (message) => {
					if (message) {
						const response = (await JsonAIMessageHandler.parseAndValidateMessage(
							message.content as Buffer,
						)) as JsonAIResponse;
						const correlationId = message.properties.correlationId;
						combineImageEmitter.emit(correlationId, response);
					}
				});

				const message = JsonRpcMessageHandler.compressMessage({
					...input,
					targetFeature: combineImageConfig.targetFeature,
					expectOutputPath: makeOutputDirPath({
						fileInput: item.file,
						targetService: combineImageConfig.targetService,
						targetFeature: combineImageConfig.targetFeature,
						correlationId,
					}),
				});

				const success = await rabbitMQClient.publish(
					message,
					rabbitMQConfig.requestExchange,
					combineImageConfig.targetService,
					{
						replyTo: rabbitMQConfig.queueOneTime,
						correlationId,
					},
				);

				if (!success) {
					throw new NodeOperationError(this.getNode(), 'Failed to publish message to RabbitMQ');
				}

				const timeout = setTimeout(() => {
					this.logger.error(`${CombineImage.name} timeout`);
					reject(new Error(`${CombineImage.name} timeout`));
				}, combineImageConfig.ttlMessage);

				const handleResponse = (response: JsonAIResponse) => {
					console.log(`${CombineImage.name} response received`, {
						response,
					});
					if (response.errorMessage) {
						reject(new Error(response.errorMessage));
						combineImageEmitter.off(correlationId, handleResponse);
						return;
					}
					if (response.resultFile) {
						clearTimeout(timeout);
						combineImageEmitter.off(correlationId, handleResponse);
						resolve(response?.resultFile?.[0] || '');
					}
				};

				combineImageEmitter.on(correlationId, handleResponse);
			});
		};

		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const fileInput = this.getNodeParameter('file', i) as string;
			const anotherFile = this.getNodeParameter('anotherFile', i) as string;
			const styleCombineBackground = this.getNodeParameter('styleCombineBackground', i) as string;
			const prompt = this.getNodeParameter('prompt', i) as string;

			const response = await processItem({
				file: fileInput,
				anotherFile: anotherFile,
				styleCombineBackground: styleCombineBackground,
				prompt: prompt,
			});

			returnData.push({
				json: {
					response: response as IDataObject,
				},
			});
		}

		return [returnData];
	}
}
