import { z } from 'zod';
import os from 'os';

// Define the schema for our configuration
const configSchema = z.object({
	// RabbitMQ Configuration
	RABBITMQ_URL: z.string().url(),
	RABBITMQ_REQUEST_EXCHANGE: z.string().default('ai-request'),
	RABBITMQ_RESULT_EXCHANGE: z.string().default('ai-result'),
	RABBITMQ_QUEUE: z.string().default('workflow-queue-local'),
	RABBITMQ_QUEUE_ONETIME: z.string().default(`workflow-${os.hostname()}`),

	// Video Lite Configuration
	VIDEO_LITE_TARGET_SERVICE: z.string().default('ai-core-video-lite'),
	VIDEO_LITE_TARGET_FEATURE: z.string().default('video-lite'),
	VIDEO_LITE_TTL_MS: z.number().default(1000 * 60 * 10), // 10 minutes

	// Image2Image Premium Configuration
	IMAGE2IMAGE_TARGET_SERVICE: z.string().default('ai-core-art-premium'),
	IMAGE2IMAGE_TARGET_FEATURE: z.string().default('image2image'),
	IMAGE2IMAGE_TTL_MS: z.number().default(1000 * 60 * 5), // 5 minutes

	// Combine Image Configuration
	COMBINE_IMAGE_TARGET_SERVICE: z.string().default('ai-core-outpainting'),
	COMBINE_IMAGE_TARGET_FEATURE: z.string().default('combineImages'),
	COMBINE_IMAGE_TTL_MS: z.number().default(1000 * 60), // 1 minute
});

// Parse and validate environment variables
const parseConfig = () => {
	console.log('process.env.RABBITMQ_URL', process.env.RABBITMQ_URL);
	console.log('process.env.RABBITMQ_REQUEST_EXCHANGE', process.env.RABBITMQ_REQUEST_EXCHANGE);
	console.log('process.env.RABBITMQ_RESULT_EXCHANGE', process.env.RABBITMQ_RESULT_EXCHANGE);
	console.log('process.env.RABBITMQ_QUEUE', process.env.RABBITMQ_QUEUE);
	console.log('process.env.RABBITMQ_QUEUE_ONETIME', process.env.RABBITMQ_QUEUE_ONETIME);
	console.log('process.env.VIDEO_LITE_TARGET_SERVICE', process.env.VIDEO_LITE_TARGET_SERVICE);
	console.log('process.env.VIDEO_LITE_TARGET_FEATURE', process.env.VIDEO_LITE_TARGET_FEATURE);
	console.log('process.env.VIDEO_LITE_TTL_MS', process.env.VIDEO_LITE_TTL_MS);

	try {
		return configSchema.parse({
			RABBITMQ_URL: process.env.RABBITMQ_URL,
			RABBITMQ_REQUEST_EXCHANGE: process.env.RABBITMQ_REQUEST_EXCHANGE,
			RABBITMQ_RESULT_EXCHANGE: process.env.RABBITMQ_RESULT_EXCHANGE,
			RABBITMQ_QUEUE: process.env.RABBITMQ_QUEUE,
			RABBITMQ_QUEUE_ONETIME: process.env.RABBITMQ_QUEUE_ONETIME,
			VIDEO_LITE_TARGET_SERVICE: process.env.VIDEO_LITE_TARGET_SERVICE,
			VIDEO_LITE_TARGET_FEATURE: process.env.VIDEO_LITE_TARGET_FEATURE,
			VIDEO_LITE_TTL_MS: process.env.VIDEO_LITE_TTL_MS ? parseInt(process.env.VIDEO_LITE_TTL_MS) : undefined,
			IMAGE2IMAGE_TARGET_SERVICE: process.env.IMAGE2IMAGE_TARGET_SERVICE,
			IMAGE2IMAGE_TARGET_FEATURE: process.env.IMAGE2IMAGE_TARGET_FEATURE,
			IMAGE2IMAGE_TTL_MS: process.env.IMAGE2IMAGE_TTL_MS ? parseInt(process.env.IMAGE2IMAGE_TTL_MS) : undefined,
			COMBINE_IMAGE_TARGET_SERVICE: process.env.COMBINE_IMAGE_TARGET_SERVICE,
			COMBINE_IMAGE_TARGET_FEATURE: process.env.COMBINE_IMAGE_TARGET_FEATURE,
			COMBINE_IMAGE_TTL_MS: process.env.COMBINE_IMAGE_TTL_MS ? parseInt(process.env.COMBINE_IMAGE_TTL_MS) : undefined,
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			console.error('Configuration validation failed:', error.errors);
		}
		throw error;
	}
};

// Export the validated configuration
export const config = parseConfig();

// Export specific configurations for different services
export const rabbitMQConfig = {
	url: config.RABBITMQ_URL,
	requestExchange: config.RABBITMQ_REQUEST_EXCHANGE,
	resultExchange: config.RABBITMQ_RESULT_EXCHANGE,
	queue: config.RABBITMQ_QUEUE,
	queueOneTime: config.RABBITMQ_QUEUE_ONETIME,
};

export const videoLiteConfig = {
	targetService: config.VIDEO_LITE_TARGET_SERVICE,
	targetFeature: config.VIDEO_LITE_TARGET_FEATURE,
	ttlMessage: config.VIDEO_LITE_TTL_MS,
};

export const image2ImageConfig = {
	targetService: config.IMAGE2IMAGE_TARGET_SERVICE,
	targetFeature: config.IMAGE2IMAGE_TARGET_FEATURE,
	ttlMessage: config.IMAGE2IMAGE_TTL_MS,
};

export const combineImageConfig = {
	targetService: config.COMBINE_IMAGE_TARGET_SERVICE,
	targetFeature: config.COMBINE_IMAGE_TARGET_FEATURE,
	ttlMessage: config.COMBINE_IMAGE_TTL_MS,
};
