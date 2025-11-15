import { io } from 'socket.io-client';

const socket = io(['https://etherchat1.onrender.com',
  'http://localhost:3001'
], {
      transports: ['websocket', 'polling']
    });

export {socket};