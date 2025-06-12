import {
	IDataObject,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import { v4 as uuidv4 } from 'uuid';
import { makeOutputDirPath } from '../utils/helper';
import { RabbitMQClient } from '../services/rabbitmq';
import { JsonAIMessageHandler, JsonRpcMessageHandler } from '../utils/message-handler';
import { JsonAIResponse } from '../types/jsonai';
import { EventEmitter } from 'events';

export interface BaseNodeConfig {
	targetService: string;
	targetFeature: string;
	ttlMessage: number;
}

export abstract class BaseNode implements INodeType {
	public abstract readonly description: INodeTypeDescription;
	protected abstract readonly config: BaseNodeConfig;
	protected abstract readonly emitter: EventEmitter;

	protected async processItem<T extends IDataObject>(
		executeFunctions: IExecuteFunctions,
		item: T,
	): Promise<string> {
		return new Promise(async (resolve, reject) => {
			const correlationId = uuidv4();
			const input = { ...item };

			await RabbitMQClient.getInstance().consumeQueue(
				'queueOneTime',
				async (message) => {
					if (message) {
						const response = (await JsonAIMessageHandler.parseAndValidateMessage(
							message.content as Buffer,
						)) as JsonAIResponse;
						const correlationId = message.properties.correlationId;
						this.emitter.emit(correlationId, response);
					}
				},
			);

			const message = JsonRpcMessageHandler.compressMessage({
				...input,
				targetFeature: this.config.targetFeature,
				expectOutputPath: makeOutputDirPath({
					fileInput: item.file as string,
					targetService: this.config.targetService,
					targetFeature: this.config.targetFeature,
					correlationId,
				}),
			});

			const success = await RabbitMQClient.getInstance().publish(
				message,
				'requestExchange',
				this.config.targetService,
				{
					replyTo: 'queueOneTime',
					correlationId,
				},
			);

			if (!success) {
				throw new NodeOperationError(executeFunctions.getNode(), 'Failed to publish message to RabbitMQ');
			}

			const timeout = setTimeout(() => {
				executeFunctions.logger.error(`${this.constructor.name} timeout`);
				reject(new Error(`${this.constructor.name} timeout`));
			}, this.config.ttlMessage);

			const handleResponse = (response: JsonAIResponse) => {
				console.log(`${this.constructor.name} response received`, {
					response,
				});
				if (response.errorMessage) {
					reject(new Error(response.errorMessage));
					this.emitter.off(correlationId, handleResponse);
					return;
				}
				if (response.resultFile) {
					clearTimeout(timeout);
					this.emitter.off(correlationId, handleResponse);
					resolve(response?.resultFile?.[0] || '');
				}
			};

			this.emitter.on(correlationId, handleResponse);
		});
	}

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const item = this.getInputData()[i].json as IDataObject;
			const response = await (this as unknown as BaseNode).processItem(this, item);

			returnData.push({
				json: {
					response: { result: response } as IDataObject,
				},
			});
		}

		return [returnData];
	}
} 