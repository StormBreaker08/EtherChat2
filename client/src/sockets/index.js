import { io } from 'socket.io-client';
const server_url = import.meta.env.VITE_SERVER_URL;


const socket = io(server_url,
    {
      transports: ['websocket', 'polling']
    });

export {socket};