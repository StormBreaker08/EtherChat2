import { useState, useEffect, useRef } from 'react';
import { Shield, Radio, Users, MessageCircle, Phone, PhoneOff } from 'lucide-react';
import ChatBox from './components/chatBox';
import VoiceControls from './components/voiceControls';
import Visualizer from './components/Visualizer';
import { useWebRTC } from './hooks/useWebRTC';
import { useVoiceMask } from './hooks/useVoiceMask';

function App() {
  const [codename, setCodename] = useState('');
  const [joined, setJoined] = useState(false);
  const [roomInput, setRoomInput] = useState('');
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'voice'
  const [micEnabled, setMicEnabled] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  const audioRef = useRef(null);

  const webrtc = useWebRTC(codename);
  const voiceMask = useVoiceMask();

  // Generate random codename
  const generateCodename = () => {
    const adjectives = ['Shadow', 'Phantom', 'Ghost', 'Cipher', 'Nexus', 'Void', 'Echo', 'Rogue', 'Stealth', 'Crypto'];
    const numbers = Math.floor(Math.random() * 999);
    return `${adjectives[Math.floor(Math.random() * adjectives.length)]}-${numbers}`;
  };

  useEffect(() => {
    setCodename(generateCodename());
  }, []);

  // Initialize connection
  const handleJoinRoom = async () => {
    if (!roomInput.trim()) return;
    
    setIsInitializing(true);
    try {
      webrtc.connectToServer();
      setTimeout(() => {
        webrtc.joinRoom(roomInput.trim());
        setJoined(true);
        setIsInitializing(false);
      }, 500);
    } catch (error) {
      console.error('Error joining room:', error);
      setIsInitializing(false);
    }
  };

  // Initialize microphone with voice masking
  const initializeMicrophone = async (filterType = 'none') => {
    try {
      const micStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }, 
        video: false 
      });

      const processedStream = await voiceMask.processStream(micStream, filterType);
      webrtc.setLocalStream(processedStream);
      setMicEnabled(true);
      
      return processedStream;
    } catch (error) {
      console.error('Microphone access error:', error);
      alert('Could not access microphone. Please check permissions.');
      throw error;
    }
  };

  // Toggle microphone
  const toggleMicrophone = async () => {
    if (micEnabled) {
      voiceMask.cleanup();
      setMicEnabled(false);
    } else {
      await initializeMicrophone();
    }
  };

  // Handle filter change
  const handleFilterChange = async (newFilter) => {
    if (micEnabled) {
      const newStream = await voiceMask.changeFilter(newFilter);
      if (newStream) {
        webrtc.setLocalStream(newStream);
      }
    }
  };

  // Play remote audio
  useEffect(() => {
    const remoteStream = webrtc.getRemoteStream();
    if (remoteStream && audioRef.current) {
      audioRef.current.srcObject = remoteStream;
      audioRef.current.play().catch(e => console.error('Audio play error:', e));
    }
  }, [webrtc.callState, webrtc]);

  // Landing screen
  if (!joined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyber-darker via-cyber-dark to-black flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-cyber-gray border-2 border-matrix-700 rounded-lg p-8 shadow-2xl">
            <div className="flex items-center justify-center mb-6">
              <Shield className="w-16 h-16 text-matrix-500 animate-pulse-slow" />
            </div>
            
            <h1 className="text-4xl font-bold text-matrix-500 text-center mb-2 font-mono tracking-wider">
              ETHERCHAT
            </h1>
            <p className="text-matrix-700 text-center mb-8 text-sm">Anonymous WebRTC Voice & Text</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-matrix-500 text-sm mb-2 font-mono">Your Codename</label>
                <div className="bg-cyber-dark border border-matrix-800 rounded px-4 py-3 text-matrix-400 font-mono flex items-center justify-between">
                  <span>{codename}</span>
                  <button 
                    onClick={() => setCodename(generateCodename())}
                    className="text-matrix-500 hover:text-matrix-400 text-xs"
                  >
                    Regenerate
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-matrix-500 text-sm mb-2 font-mono">Room ID</label>
                <input
                  type="text"
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value)}
                  placeholder="Enter room name..."
                  className="w-full bg-cyber-dark border border-matrix-800 rounded px-4 py-3 text-matrix-400 font-mono focus:outline-none focus:border-matrix-500 transition-colors"
                  onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
                />
              </div>
              
              <button
                onClick={handleJoinRoom}
                disabled={!roomInput.trim() || isInitializing}
                className="w-full bg-matrix-700 hover:bg-matrix-600 disabled:bg-cyber-light disabled:cursor-not-allowed text-black font-bold py-3 rounded font-mono transition-all duration-200 hover:shadow-lg hover:shadow-matrix-700/50"
              >
                {isInitializing ? 'CONNECTING...' : 'ENTER ROOM'}
              </button>
            </div>
            
            <div className="mt-6 text-center text-xs text-matrix-800 font-mono">
              <p>⚡ End-to-End Encrypted</p>
              <p>🔒 No Data Retention</p>
              <p>👻 Completely Anonymous</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main application interface
  return (
    <div className="min-h-screen bg-cyber-darker text-matrix-400">
      {/* Header */}
      <header className="bg-cyber-gray border-b border-matrix-900 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Shield className="w-6 h-6 text-matrix-500" />
            <div>
              <h1 className="text-xl font-bold text-matrix-500 font-mono">ETHERCHAT</h1>
              <p className="text-xs text-matrix-800">Room: {webrtc.roomId}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-cyber-dark px-3 py-2 rounded border border-matrix-900">
              <Radio className="w-4 h-4 text-matrix-600" />
              <span className="text-sm font-mono">{codename}</span>
            </div>
            
            <div className="flex items-center space-x-2 bg-cyber-dark px-3 py-2 rounded border border-matrix-900">
              <Users className="w-4 h-4 text-matrix-600" />
              <span className="text-sm font-mono">{webrtc.roomUsers.length}</span>
            </div>
            
            <div className={`w-2 h-2 rounded-full ${webrtc.isConnected ? 'bg-matrix-500' : 'bg-red-500'}`} />
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-cyber-gray border-b border-matrix-900 px-6">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-3 font-mono text-sm transition-colors ${
              activeTab === 'chat' 
                ? 'text-matrix-500 border-b-2 border-matrix-500' 
                : 'text-matrix-800 hover:text-matrix-600'
            }`}
          >
            <MessageCircle className="w-4 h-4 inline mr-2" />
            TEXT CHAT
          </button>
          
          <button
            onClick={() => setActiveTab('voice')}
            className={`px-4 py-3 font-mono text-sm transition-colors ${
              activeTab === 'voice' 
                ? 'text-matrix-500 border-b-2 border-matrix-500' 
                : 'text-matrix-800 hover:text-matrix-600'
            }`}
          >
            <Phone className="w-4 h-4 inline mr-2" />
            VOICE CALL
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6">
        {activeTab === 'chat' ? (
          <ChatBox
            messages={webrtc.messages}
            onSendMessage={webrtc.sendMessage}
            currentUserId={webrtc.socket?.id}
          />
        ) : (
          <div className="space-y-6">
            <VoiceControls
              micEnabled={micEnabled}
              onToggleMic={toggleMicrophone}
              filterType={voiceMask.filterType}
              onFilterChange={handleFilterChange}
              isProcessing={voiceMask.isProcessing}
            />
            
            {voiceMask.isProcessing && (
              <Visualizer audioContext={voiceMask.audioContext} />
            )}
            
            {/* Call Controls */}
            <div className="bg-cyber-gray border border-matrix-900 rounded-lg p-6">
              <h3 className="text-matrix-500 font-mono mb-4">Active Users</h3>
              
              <div className="space-y-2">
                {webrtc.roomUsers
                  .filter(user => user.id !== webrtc.socket?.id)
                  .map(user => (
                    <div key={user.id} className="flex items-center justify-between bg-cyber-dark border border-matrix-900 rounded p-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-matrix-500 rounded-full animate-pulse" />
                        <span className="font-mono text-sm">{user.codename}</span>
                      </div>
                      
                      <button
                        onClick={() => webrtc.initiateCall(user.id)}
                        disabled={webrtc.callState !== 'idle'}
                        className="bg-matrix-700 hover:bg-matrix-600 disabled:bg-cyber-light disabled:cursor-not-allowed text-black px-4 py-2 rounded font-mono text-sm transition-colors flex items-center space-x-2"
                      >
                        <Phone className="w-4 h-4" />
                        <span>CALL</span>
                      </button>
                    </div>
                  ))}
                
                {webrtc.roomUsers.length <= 1 && (
                  <div className="text-center text-matrix-800 py-8 font-mono text-sm">
                    No other users in room
                  </div>
                )}
              </div>

              {/* Active Call Indicator */}
              {webrtc.callState === 'in-call' && (
                <div className="mt-4 bg-matrix-900 border border-matrix-700 rounded p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-matrix-500 rounded-full animate-pulse" />
                      <span className="text-matrix-500 font-mono text-sm">CALL IN PROGRESS</span>
                    </div>
                    
                    <button
                      onClick={webrtc.endCall}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-mono text-sm transition-colors flex items-center space-x-2"
                    >
                      <PhoneOff className="w-4 h-4" />
                      <span>END CALL</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Incoming Call Modal */}
      {webrtc.incomingCall && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-cyber-gray border-2 border-matrix-500 rounded-lg p-8 max-w-md w-full animate-pulse-slow">
            <div className="text-center">
              <Phone className="w-16 h-16 text-matrix-500 mx-auto mb-4 animate-bounce" />
              <h3 className="text-2xl font-bold text-matrix-500 font-mono mb-2">INCOMING CALL</h3>
              <p className="text-matrix-700 font-mono mb-6">
                From: {webrtc.incomingCall.codename}
              </p>
              
              <div className="flex space-x-4">
                <button
                  onClick={webrtc.acceptCall}
                  className="flex-1 bg-matrix-700 hover:bg-matrix-600 text-black font-bold py-3 rounded font-mono transition-all"
                >
                  ACCEPT
                </button>
                
                <button
                  onClick={webrtc.rejectCall}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded font-mono transition-all"
                >
                  REJECT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden audio element for remote stream */}
      <audio ref={audioRef} autoPlay />
    </div>
  );
}

export default App;