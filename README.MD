# 🔐 EtherChat

**Anonymous WebRTC Voice & Text Communication Platform**

EtherChat is a secure, anonymous real-time communication application that provides end-to-end encrypted voice calls with voice masking capabilities and text messaging. Built with React, Node.js, WebRTC, and Socket.IO.

![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-green.svg)
![React](https://img.shields.io/badge/react-18.2.0-blue.svg)

---

## ✨ Features

### 🎭 **Voice Masking**

- **Original Voice**: No modification applied
- **Deep Voice**: Lower pitch with bass enhancement
- **Robot Voice**: Robotic modulation effect
- Real-time audio processing using Web Audio API

### 🔒 **Security & Privacy**

- ✅ End-to-end encrypted WebRTC connections
- ✅ No data retention on servers
- ✅ Completely anonymous - no registration required
- ✅ Random codename generation
- ✅ Peer-to-peer voice communication

### 💬 **Communication**

- Real-time text messaging
- One-to-one voice calls
- Room-based chat system
- Audio visualization
- Call controls (accept, reject, end)

### 🎨 **User Interface**

- Cyberpunk-themed Matrix-style design
- Responsive layout
- Real-time connection status
- Visual audio feedback
- User presence indicators

---

## 🏗️ Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Client A      │◄────────┤  Signaling       │────────►│   Client B      │
│   (Browser)     │  Socket │  Server          │ Socket  │   (Browser)     │
│                 │   .IO   │  (Node.js)       │  .IO    │                 │
└────────┬────────┘         └──────────────────┘         └────────┬────────┘
         │                                                          │
         │                                                          │
         │              WebRTC P2P Connection                       │
         │         (Voice + Text Data Channels)                    │
         └──────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**

- React 18.2.0
- Vite (Build tool)
- TailwindCSS (Styling)
- Lucide React (Icons)
- Simple-Peer (WebRTC wrapper)
- Socket.IO Client

**Backend:**

- Node.js
- Express.js
- Socket.IO
- HTTP Server

**Audio Processing:**

- Web Audio API
- MediaStream API
- AudioContext

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 16.0.0
- npm or yarn
- Modern web browser with WebRTC support

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/etherchat.git
cd EtherChat
```

2. **Install dependencies**

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. **Environment Configuration**

Create a `.env` file in the `client` directory:

```env
VITE_SERVER_URL=http://localhost:3001
```

For production, update to your deployed server URL:

```env
VITE_SERVER_URL=https://your-server-url.com
```

4. **Start the application**

**Development Mode:**

Terminal 1 (Server):

```bash
cd server
npm run dev
```

Terminal 2 (Client):

```bash
cd client
npm run dev
```

**Production Mode:**

```bash
# Build client
cd client
npm run build

# Start server
cd ../server
npm start
```

5. **Access the application**

Open your browser and navigate to:

```
http://localhost:5173
```

---

## 📖 Usage Guide

### Joining a Room

1. Enter your desired room name
2. Your anonymous codename is generated automatically (can be regenerated)
3. Click "ENTER ROOM" to join

### Text Chat

1. Navigate to the "TEXT CHAT" tab
2. Type your message in the input field
3. Press Enter or click "SEND"
4. Messages are encrypted and ephemeral

### Voice Calls

1. Navigate to the "VOICE CALL" tab
2. Enable your microphone
3. Select a voice filter (optional):
   - **Original Voice**: No masking
   - **Deep Voice**: Lower pitch effect
   - **Robot Voice**: Robotic modulation
4. Click "CALL" next to a user's name
5. The recipient can accept or reject the call
6. Use "END CALL" to terminate the connection

### Voice Filters

⚠️ **Important**: Voice filters cannot be changed during an active call. End the call first to switch filters.

---

## 🔧 Configuration

### Server Configuration

Edit [`server/index.js`](server/index.js):

```javascript
const PORT = process.env.PORT || 3001;
```

### Client Proxy Configuration

Edit [`client/vite.config.js`](client/vite.config.js):

```javascript
server: {
  port: 5173,
  proxy: {
    '/socket.io': {
      target: 'http://localhost:3001',
      ws: true,
      changeOrigin: true
    }
  }
}
```

### CORS Configuration

Edit [`server/index.js`](server/index.js):

```javascript
const io = socketIo(server, {
  cors: {
    origin: "*", // Update for production
    methods: ["GET", "POST"],
  },
});
```

---

## 📁 Project Structure

```
EtherChat/
├── client/                    # Frontend application
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── chatBox.jsx   # Text chat interface
│   │   │   ├── voiceControls.jsx  # Voice call controls
│   │   │   └── Visualizer.jsx     # Audio visualizer
│   │   ├── hooks/            # Custom React hooks
│   │   │   ├── useWebRTC.js  # WebRTC connection logic
│   │   │   └── useVoiceMask.js    # Voice masking engine
│   │   ├── sockets/          # Socket.IO configuration
│   │   ├── App.jsx           # Main application component
│   │   ├── main.jsx          # Application entry point
│   │   └── index.css         # Global styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js        # Vite configuration
│   └── tailwind.config.js    # Tailwind CSS config
├── server/                    # Backend server
│   ├── index.js              # Express & Socket.IO server
│   └── package.json
├── .gitignore
└── README.md
```

---

## 🔌 API Reference

### Socket.IO Events

#### Client → Server

| Event           | Payload                         | Description           |
| --------------- | ------------------------------- | --------------------- |
| `join-room`     | `{ roomId, codename }`          | Join a chat room      |
| `initiate-call` | `{ to, from, codename }`        | Initiate voice call   |
| `signal`        | `{ to, signal, from }`          | WebRTC signaling data |
| `text-message`  | `{ roomId, message, codename }` | Send text message     |
| `call-accepted` | `{ to, from }`                  | Accept incoming call  |
| `call-rejected` | `{ to, from }`                  | Reject incoming call  |
| `end-call`      | `{ to }`                        | End active call       |

#### Server → Client

| Event           | Payload                                  | Description                |
| --------------- | ---------------------------------------- | -------------------------- |
| `room-users`    | `[{ id, codename }]`                     | List of users in room      |
| `user-joined`   | `{ userId, codename, users }`            | User joined room           |
| `user-left`     | `{ userId, codename, users }`            | User left room             |
| `call-incoming` | `{ from, codename }`                     | Incoming call notification |
| `call-accepted` | `{ from }`                               | Call accepted by peer      |
| `call-rejected` | `{ from }`                               | Call rejected by peer      |
| `call-ended`    | -                                        | Call ended by peer         |
| `signal`        | `{ signal, from }`                       | WebRTC signaling data      |
| `text-message`  | `{ from, codename, message, timestamp }` | New text message           |

---

## 🎨 Customization

### Theming

Edit [`client/tailwind.config.js`](client/tailwind.config.js):

```javascript
colors: {
  matrix: {
    500: '#00ff00',  // Primary color
    700: '#009900',  // Secondary color
    // ... customize colors
  },
  cyber: {
    dark: '#0a0e0f',      // Background
    darker: '#050708',     // Darker background
    gray: '#1a2328',       // Component background
    light: '#2d3a42'       // Lighter elements
  }
}
```

### Voice Filter Parameters

Edit [`client/src/hooks/useVoiceMask.js`](client/src/hooks/useVoiceMask.js):

```javascript
// Deep Voice Filter
lowpassFilter.frequency.value = 800; // Adjust frequency
lowpassFilter.Q.value = 0.7; // Adjust resonance

// Robot Voice Filter
carrierOscillator.frequency.value = 30; // Modulation frequency
modulatorGain.gain.value = 0.5; // Effect intensity
```

---

## 🐛 Troubleshooting

### Microphone Access Denied

**Issue**: Browser blocks microphone access

**Solution**:

1. Check browser permissions
2. Ensure HTTPS in production (HTTP works on localhost)
3. Grant microphone permissions when prompted

### Call Disconnects When Changing Filter

**Issue**: Call drops when switching voice filters

**Solution**: This is expected behavior. End the call before changing filters, or the application will prevent filter changes during active calls.

### No Audio Received

**Issue**: Can't hear remote user

**Solution**:

1. Check browser audio settings
2. Verify remote user has microphone enabled
3. Check firewall/network settings
4. Ensure WebRTC ICE servers are accessible

### Connection Issues

**Issue**: Cannot connect to signaling server

**Solution**:

1. Verify server is running (`npm run dev` in server directory)
2. Check `VITE_SERVER_URL` in `.env`
3. Verify port 3001 is not blocked
4. Check browser console for errors

---

## 🚢 Deployment

### Server Deployment (Railway/Heroku/VPS)

1. Update environment variables
2. Configure CORS for production domain
3. Use production Socket.IO configuration

```javascript
const io = socketIo(server, {
  cors: {
    origin: "https://your-frontend-domain.com",
    methods: ["GET", "POST"],
  },
});
```

### Client Deployment (Vercel/Netlify)

1. Build the client:

```bash
cd client
npm run build
```

2. Update `.env`:

```env
VITE_SERVER_URL=https://your-backend-domain.com
```

3. Deploy `dist` folder

### STUN/TURN Server Configuration

For production, consider using TURN servers for better connectivity:

```javascript
config: {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: "turn:your-turn-server.com:3478",
      username: "username",
      credential: "password",
    },
  ];
}
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 🙏 Acknowledgments

- WebRTC for peer-to-peer communication
- Socket.IO for real-time signaling
- Simple-Peer for simplified WebRTC implementation
- Web Audio API for voice processing
- Tailwind CSS for styling
- Lucide React for icons

---

## 🔮 Future Enhancements

- [ ] Group voice calls (multi-peer)
- [ ] File sharing
- [ ] Screen sharing
- [ ] More voice filters (pitch shifter, echo, reverb)
- [ ] Recording capability
- [ ] Mobile app (React Native)
- [ ] Persistent rooms with passwords
- [ ] User authentication (optional)
- [ ] End-to-end encryption for text messages
- [ ] Video calling

---

**Made with 💚 by Kishan N Kishore, Keerthan Sanil, Arshith, Poorvi S Karkera

⚡ End-to-End Encrypted | 🔒 No Data Retention | 👻 Completely Anonymous
