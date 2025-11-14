import { useState, useRef, useCallback, useEffect } from 'react';
import SimplePeer from 'simple-peer';
import {socket} from '../sockets';

export const useWebRTC = (codename) => {
  const [roomId, setRoomId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [peers, setPeers] = useState(new Map());
  const [roomUsers, setRoomUsers] = useState([]);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callState, setCallState] = useState('idle'); // idle, calling, in-call
  const [messages, setMessages] = useState([]);

  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peersMapRef = useRef(new Map());

  // Initialize Socket.io connection
  const connectToServer = useCallback(() => {
    

    socket.on('connect', () => {
      console.log('Connected to signaling server:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from signaling server');
      setIsConnected(false);
    });

    socket.on('room-users', (users) => {
      console.log('Room users:', users);
      setRoomUsers(users);
    });

    socket.on('user-joined', ({ userId, codename, users }) => {
      console.log(`User joined: ${codename}`);
      setRoomUsers(users);
      addMessage({
        type: 'system',
        content: `${codename} joined the room`,
        timestamp: Date.now()
      });
    });

    socket.on('user-left', ({ userId, codename, users }) => {
      console.log(`User left: ${codename}`);
      setRoomUsers(users);
      addMessage({
        type: 'system',
        content: `${codename} left the room`,
        timestamp: Date.now()
      });
      
      // Clean up peer connection
      const peer = peersMapRef.current.get(userId);
      if (peer) {
        peer.destroy();
        peersMapRef.current.delete(userId);
        setPeers(new Map(peersMapRef.current));
      }
    });

    socket.on('call-incoming', ({ from, codename: callerName }) => {
      console.log(`Incoming call from: ${callerName}`);
      setIncomingCall({ from, codename: callerName });
    });

    socket.on('call-accepted', ({ from }) => {
      console.log(`Call accepted by: ${from}`);
      setCallState('in-call');
    });

    socket.on('call-rejected', ({ from }) => {
      console.log(`Call rejected by: ${from}`);
      setCallState('idle');
      addMessage({
        type: 'system',
        content: 'Call was rejected',
        timestamp: Date.now()
      });
    });

    socket.on('call-ended', () => {
      console.log('Call ended by remote peer');
      endCall();
    });

    socket.on('text-message', ({ from, codename: senderName, message, timestamp }) => {
      addMessage({
        type: 'user',
        from,
        codename: senderName,
        content: message,
        timestamp
      });
    });

    socket.connect();
    return socket;
  }, []);

  // Join a room
  const joinRoom = useCallback((room) => {
    
    setRoomId(room);
    socket.emit('join-room', { roomId: room, codename });
    console.log(`Joined room: ${room}`);
  }, [socket, codename]);

  // Add message to chat
  const addMessage = useCallback((message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  // Send text message
  const sendMessage = useCallback((message) => {
    if (!socket || !roomId) return;
    
    socket.emit('text-message', {
      roomId,
      message,
      codename
    });
  }, [socket, roomId, codename]);

  // Create peer connection
  const createPeer = useCallback((targetUserId, initiator = false) => {
    if (!localStreamRef.current) {
      console.error('No local stream available');
      return null;
    }

    const peer = new SimplePeer({
      initiator,
      trickle: false,
      stream: localStreamRef.current,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    peer.on('signal', (signal) => {
      socket.emit('signal', {
        to: targetUserId,
        from: socket.id,
        signal
      });
    });

    peer.on('stream', (stream) => {
      console.log('Received remote stream');
      remoteStreamRef.current = stream;
      setCallState('in-call');
    });

    peer.on('error', (err) => {
      console.error('Peer connection error:', err);
    });

    peer.on('close', () => {
      console.log('Peer connection closed');
      setCallState('idle');
    });

    peersMapRef.current.set(targetUserId, peer);
    setPeers(new Map(peersMapRef.current));

    return peer;
  }, [socket]);

  // Initiate call to another user
  const initiateCall = useCallback((targetUserId) => {
    if (!socket || !localStreamRef.current) {
      console.error('Cannot initiate call: missing socket or stream');
      return;
    }

    setCallState('calling');
    
    socket.emit('initiate-call', {
      to: targetUserId,
      from: socket.id,
      codename
    });

    createPeer(targetUserId, true);
  }, [socket, codename, createPeer]);

  // Accept incoming call
  const acceptCall = useCallback(() => {
    if (!incomingCall) return;

    const { from } = incomingCall;
    socket.emit('call-accepted', { to: from, from: socket.id });
    
    createPeer(from, false);
    setIncomingCall(null);
    setCallState('in-call');
  }, [incomingCall, socket, createPeer]);

  // Reject incoming call
  const rejectCall = useCallback(() => {
    if (!incomingCall) return;

    socket.emit('call-rejected', {
      to: incomingCall.from,
      from: socket.id
    });
    
    setIncomingCall(null);
  }, [incomingCall, socket]);

  // End active call
  const endCall = useCallback(() => {
    peersMapRef.current.forEach((peer, userId) => {
      socket?.emit('end-call', { to: userId });
      peer.destroy();
    });

    peersMapRef.current.clear();
    setPeers(new Map());
    remoteStreamRef.current = null;
    setCallState('idle');
  }, [socket]);

  // Handle incoming signals
  useEffect(() => {
    if (!socket) return;

    const handleSignal = ({ signal, from }) => {
      let peer = peersMapRef.current.get(from);
      
      if (!peer) {
        peer = createPeer(from, false);
      }

      if (peer && signal) {
        peer.signal(signal);
      }
    };

    socket.on('signal', handleSignal);

    return () => {
      socket.off('signal', handleSignal);
    };
  }, [socket, createPeer]);

  // Set local stream (processed stream from voice mask)
  const setLocalStream = useCallback((stream) => {
    localStreamRef.current = stream;
  }, []);

  // Get remote stream
  const getRemoteStream = useCallback(() => {
    return remoteStreamRef.current;
  }, []);

  // Cleanup
  const cleanup = useCallback(() => {
    peersMapRef.current.forEach(peer => peer.destroy());
    peersMapRef.current.clear();
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (socket) {
      socket.disconnect();
    }
  }, [socket]);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return {
    socket,
    roomId,
    isConnected,
    peers,
    roomUsers,
    incomingCall,
    callState,
    messages,
    connectToServer,
    joinRoom,
    setLocalStream,
    getRemoteStream,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    sendMessage,
    cleanup
  };
};

export default useWebRTC;