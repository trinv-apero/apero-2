import {
	type INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';
import { BaseNode } from '../BaseNode';
import { combineImageConfig } from '../../config';
import { AgentEmitter } from '../../events/eventEmitter';
import { EventEmitter } from 'events';

export class CombineImage extends BaseNode {
	public readonly description: INodeTypeDescription = {
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

	protected readonly config = combineImageConfig;
	protected readonly emitter = AgentEmitter as unknown as EventEmitter;
}
