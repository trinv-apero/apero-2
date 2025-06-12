import amqp from 'amqplib';
import { rabbitMQConfig } from '../config';

export class RabbitMQClient {
	private static instance: RabbitMQClient | null = null;
	private connection: amqp.ChannelModel | null = null;
	private channel: amqp.Channel | null = null;
	private reconnectAttempts = 0;
	private readonly maxReconnectAttempts = 5;
	private readonly reconnectInterval = 5000; // 5 seconds
	private consumers: Map<string, (msg: amqp.ConsumeMessage | null) => Promise<void>> = new Map();

	private constructor() {
		this.handleDisconnect = this.handleDisconnect.bind(this);
	}

	public static getInstance(): RabbitMQClient {
		if (!RabbitMQClient.instance) {
			RabbitMQClient.instance = new RabbitMQClient();
		}
		return RabbitMQClient.instance;
	}

	public async connect(): Promise<void> {
		try {
			this.connection = await amqp.connect(rabbitMQConfig.url);
			this.channel = await this.connection.createChannel();
			await this.setupQueues();

			this.connection.on('close', this.handleDisconnect);
			this.connection.on('error', this.handleDisconnect);

			this.reconnectAttempts = 0;
		} catch (error) {
			console.error('Failed to connect to RabbitMQ:', error);
			this.handleDisconnect();
		}
	}

	private handleDisconnect(): void {
		if (this.reconnectAttempts < this.maxReconnectAttempts) {
			this.reconnectAttempts++;
			setTimeout(() => {
				this.connect();
			}, this.reconnectInterval);
		} else {
			console.error('Max reconnection attempts reached');
		}
	}

	private async setupQueues(): Promise<void> {
		if (!this.channel) {
			throw new Error('Channel not initialized');
		}

		// Assert exchanges
		await this.channel.assertExchange(rabbitMQConfig.requestExchange, 'direct', {
			durable: false,
		});

		await this.channel.assertExchange(rabbitMQConfig.resultExchange, 'direct', {
			durable: false,
		});

		// Setup queue
		await this.channel.assertQueue(rabbitMQConfig.queue, {
			durable: true,
			autoDelete: false,
		});

		await this.channel.bindQueue(
			rabbitMQConfig.queue,
			rabbitMQConfig.requestExchange,
			rabbitMQConfig.queue,
		);

		// Setup queue onetime
		await this.channel.assertQueue(rabbitMQConfig.queueOneTime, {
			durable: true,
			autoDelete: true,
		});

		await this.channel.bindQueue(
			rabbitMQConfig.queueOneTime,
			rabbitMQConfig.resultExchange,
			rabbitMQConfig.queueOneTime,
		);
	}

	public async publish(
		message: Buffer,
		exchange: string,
		routingKey: string,
		options?: amqp.Options.Publish,
	): Promise<boolean> {
		if (!this.channel) {
			throw new Error('Channel not initialized');
		}

		try {
			return this.channel.publish(exchange, routingKey, message, options);
		} catch (error) {
			console.error('Failed to publish message:', error);
			return false;
		}
	}

	public async consumeQueue(
		queue: string,
		callback: (msg: amqp.ConsumeMessage | null) => Promise<void>,
	): Promise<void> {
		if (!this.channel) {
			throw new Error('Channel not initialized');
		}

		if (this.consumers.has(queue)) {
			return;
		}

		this.consumers.set(queue, callback);
		await this.channel.consume(queue, callback);
	}

	public async close(): Promise<void> {
		if (this.channel) {
			await this.channel.close();
		}
		if (this.connection) {
			await this.connection.close();
		}
	}
}
