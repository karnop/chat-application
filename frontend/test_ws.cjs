const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:8080/ws');

ws.on('open', function open() {
  ws.send(JSON.stringify({ type: 'join', room: 'General', user: 'TestBot' }));
  setTimeout(() => {
    ws.send(JSON.stringify({ type: 'chat', room: 'General', user: 'TestBot', content: 'Hello world' }));
  }, 500);
});

ws.on('message', function incoming(data) {
  console.log('Received:', data.toString());
});

setTimeout(() => process.exit(0), 1500);
