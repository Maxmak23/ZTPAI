const amqp = require('amqplib');

class CinemaQueue {
    constructor() {
        this.connection = null;
        this.channel = null;
    }

    async connect() {
        this.connection = await amqp.connect('amqp://localhost');
        this.channel = await this.connection.createChannel();
        await this.channel.assertQueue('cinema_tasks', { durable: true });
        console.log('Connected to RabbitMQ');
    }

    async enqueue(task) {
        if (!this.channel) await this.connect();
        this.channel.sendToQueue(
            'cinema_tasks',
            Buffer.from(JSON.stringify(task)),
            { persistent: true }
        );
        console.log(`Task queued: ${task.type}`);
    }
}

// Singleton instance
const queue = new CinemaQueue();
queue.connect(); // Initialize connection
module.exports = queue;