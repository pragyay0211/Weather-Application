const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

const subscriptions = new Map(); // Map to store city subscriptions

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.action === 'subscribe' && data.city) {
        console.log(`Subscribing client to notifications for ${data.city}`);
        subscriptions.set(ws, data.city);
      } else if (data.action === 'unsubscribe') {
        console.log('Unsubscribing client');
        subscriptions.delete(ws);
      }
    } catch (error) {
      console.error('Error parsing message:', error.message);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    subscriptions.delete(ws);
  });
});

function sendNotification(city, message) {
  subscriptions.forEach((value, client) => {
    if (value === city && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ city, message }));
    }
  });
}

module.exports = { sendNotification };
