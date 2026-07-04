// Simple in-memory background worker for lightweight async tasks
// NOTE: This is a minimal worker — for production use a resilient queue (Bull, RabbitMQ, etc.)
const { sendMail } = require('./email');

const queue = [];
let running = false;

function enqueue(task) {
  queue.push(task);
  if (!running) processQueue();
}

async function processQueue() {
  running = true;
  while (queue.length > 0) {
    const task = queue.shift();
    try {
      switch (task.type) {
        case 'sendEmail':
          await sendMail(task.payload);
          break;
        default:
          console.warn('Unknown task type', task.type);
      }
    } catch (err) {
      console.error('Background task failed', err);
    }
  }
  running = false;
}

module.exports = { enqueue };
