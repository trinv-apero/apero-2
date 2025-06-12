import {
	type INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';
import { EventEmitter } from 'events';
import { BaseNode } from '../BaseNode';
import { videoLiteConfig } from '../../config';
import { AgentEmitter } from '../../events/eventEmitter';

export enum VideoStatus {
	QUEUEING = 'queueing',
	PROCESSING = 'processing',
	RENDERING = 'rendering',
	COMPLETED = 'completed',
	FAILED = 'failed',
}

export interface VideoLiteRequest {
	videoId?: string;
	videoStatus?: VideoStatus;
	file?: string;
	file2?: string;
	mode?: string;
	morphFiles?: string[];
	positivePrompt?: string;
	negativePrompt?: string;
	backgroundPrompt?: string;
	frameNumber?: number;
	frameRate?: number;
	width?: number;
	height?: number;
	guidanceScale?: number;
	steps?: number;
	imageSize?: number;
	useImageCaption?: boolean;
	useFrameInterpolation?: boolean;
	enableSwapface?: boolean;
	enableInpaint?: boolean;
	upscalerXTimes?: number;
	loraName?: string;
	additionalOptions?: string[];
	enableAssistant?: boolean;
	seed?: number;
}

export class VideoLite extends BaseNode {
	public readonly description: INodeTypeDescription = {
		displayName: 'VideoLite',
		name: 'videoLite',
		icon: 'file:video-lite.svg',
		group: ['transform'],
		version: 1,
		defaults: {
			name: 'VideoLite',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		description: 'Video generation with lite features',
		properties: [
			{
				displayName: 'Image 01',
				name: 'file',
				type: 'string',
				default: '',
				description: 'The input video file to transform',
				required: true,
			},
			{
				displayName: 'Image 02',
				name: 'file2',
				type: 'string',
				default: '',
				description: 'Second input file (optional)',
			},
			{
				displayName: 'Mode',
				name: 'mode',
				type: 'options',
				options: [
					{
						name: 'Fusion',
						value: 'fusion',
					},
					{
						name: 'Hugging',
						value: 'hugging',
					},
					{
						name: 'Image to Video',
						value: 'i2v',
					},
					{
						name: 'Image to Video Premium',
						value: 'i2vp',
					},
					{
						name: 'Kissing',
						value: 'kissing',
					},
					{
						name: 'Muscle',
						value: 'muscle',
					},
					{
						name: 'Passionate Kissing',
						value: 'passionateKissing',
					},
					{
						name: 'Text to GIF',
						value: 't2g',
					},
				],
				default: 'i2v',
				description: 'The transformation mode',
				required: true,
			},
			{
				displayName: 'Morph Files',
				name: 'morphFiles',
				type: 'string',
				default: '',
				description: 'Files for morphing',
			},
			{
				displayName: 'Positive Prompt',
				name: 'positivePrompt',
				type: 'string',
				default: '',
				description: 'Positive prompt to guide the transformation',
			},
			{
				displayName: 'Negative Prompt',
				name: 'negativePrompt',
				type: 'string',
				default: '',
				description: 'Negative prompt to guide the transformation',
			},
			{
				displayName: 'Background Prompt',
				name: 'backgroundPrompt',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Frame Number',
				name: 'frameNumber',
				type: 'number',
				default: 30,
				description: 'Number of frames',
			},
			{
				displayName: 'Frame Rate',
				name: 'frameRate',
				type: 'number',
				default: 30,
			},
			{
				displayName: 'Width',
				name: 'width',
				type: 'number',
				default: 512,
				description: 'Width of output',
			},
			{
				displayName: 'Height',
				name: 'height',
				type: 'number',
				default: 512,
				description: 'Height of output',
			},
			{
				displayName: 'Guidance Scale',
				name: 'guidanceScale',
				type: 'number',
				default: 7.5,
				description: 'Guidance scale for generation',
			},
			{
				displayName: 'Steps',
				name: 'steps',
				type: 'number',
				default: 20,
				description: 'Number of inference steps',
			},
			{
				displayName: 'Image Size',
				name: 'imageSize',
				type: 'number',
				default: 512,
				description: 'Size of generated images',
			},
			{
				displayName: 'Use Image Caption',
				name: 'useImageCaption',
				type: 'boolean',
				default: false,
				description: 'Whether to use image captioning',
			},
			{
				displayName: 'Use Frame Interpolation',
				name: 'useFrameInterpolation',
				type: 'boolean',
				default: false,
				description: 'Whether to use frame interpolation',
			},
			{
				displayName: 'Enable Swapface',
				name: 'enableSwapface',
				type: 'boolean',
				default: false,
				description: 'Whether to enable face swapping',
			},
			{
				displayName: 'Enable Inpaint',
				name: 'enableInpaint',
				type: 'boolean',
				default: false,
				description: 'Whether to enable inpainting',
			},
			{
				displayName: 'Upscaler X Times',
				name: 'upscalerXTimes',
				type: 'number',
				default: 1,
				description: 'Upscaling factor',
			},
			{
				displayName: 'Lora Name',
				name: 'loraName',
				type: 'string',
				default: '',
				description: 'Name of LoRA model to use',
			},
			{
				displayName: 'Additional Options',
				name: 'additionalOptions',
				type: 'string',
				default: '',
				description: 'Additional processing options',
			},
		],
	};

	protected readonly config = videoLiteConfig;
	protected readonly emitter = AgentEmitter as unknown as EventEmitter;
}
