import { Mic, MicOff, Volume2, VolumeX, Zap, Bot } from 'lucide-react';

const VoiceControls = ({ 
  micEnabled, 
  onToggleMic, 
  filterType, 
  onFilterChange,
  isProcessing,
  callState // Add this prop
}) => {
  const filters = [
    { 
      id: 'none', 
      name: 'Original Voice', 
      icon: Volume2,
      description: 'No voice masking applied',
      color: 'matrix-700'
    },
    { 
      id: 'low-pitch', 
      name: 'Deep Voice', 
      icon: Zap,
      description: 'Lower pitch with bass enhancement',
      color: 'blue-600'
    },
    { 
      id: 'robot', 
      name: 'Robot Voice', 
      icon: Bot,
      description: 'Robotic modulation effect',
      color: 'purple-600'
    }
  ];

  return (
    <div className="bg-cyber-gray border border-matrix-900 rounded-lg p-6">
      {/* Microphone Control */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-matrix-500 font-mono text-lg mb-1">Microphone Control</h3>
          <p className="text-matrix-800 text-sm font-mono">
            {micEnabled ? 'Microphone active' : 'Microphone disabled'}
          </p>
        </div>
        
        <button
          onClick={onToggleMic}
          className={`p-4 rounded-full transition-all duration-300 ${
            micEnabled 
              ? 'bg-matrix-700 hover:bg-matrix-600 text-black' 
              : 'bg-cyber-dark hover:bg-cyber-light text-matrix-800 border border-matrix-900'
          }`}
        >
          {micEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </button>
      </div>

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="mb-6 bg-cyber-dark border border-matrix-900 rounded p-3 flex items-center space-x-3">
          <div className="w-2 h-2 bg-matrix-500 rounded-full animate-pulse" />
          <span className="text-matrix-500 font-mono text-sm">Audio processing active</span>
        </div>
      )}

      {/* Voice Filter Selection */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 mb-3">
          <Zap className="w-4 h-4 text-matrix-500" />
          <h4 className="text-matrix-500 font-mono text-sm">Voice Masking Filters</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {filters.map((filter) => {
            const Icon = filter.icon;
            const isActive = filterType === filter.id;
            
            return (
              <button
                key={filter.id}
                onClick={() => onFilterChange(filter.id)}
                disabled={!micEnabled && filter.id !== 'none' || callState === 'in-call'} // Add callState check
                className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                  isActive
                    ? `border-${filter.color} bg-${filter.color}/10`
                    : 'border-matrix-900 bg-cyber-dark hover:border-matrix-800'
                } ${(!micEnabled && filter.id !== 'none' || callState === 'in-call') ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`p-2 rounded ${isActive ? `bg-${filter.color}` : 'bg-cyber-dark'}`}>
                    <Icon className={`w-5 h-5 ${isActive ? 'text-black' : 'text-matrix-700'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="font-mono text-sm text-matrix-400">{filter.name}</div>
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 bg-matrix-500 rounded-full animate-pulse" />
                  )}
                </div>
                
                <p className="text-xs text-matrix-800 font-mono leading-relaxed">
                  {filter.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Information Box */}
      <div className="mt-6 bg-cyber-dark border border-matrix-900 rounded p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-matrix-900 rounded flex items-center justify-center">
              <Zap className="w-4 h-4 text-matrix-500" />
            </div>
          </div>
          <div className="flex-1">
            <h5 className="text-matrix-500 font-mono text-sm mb-2">How Voice Masking Works</h5>
            <ul className="text-matrix-800 text-xs font-mono space-y-1">
              <li>• Filters are applied in real-time using Web Audio API</li>
              <li>• Processed audio is sent through WebRTC connection</li>
              <li>• Original voice is never transmitted</li>
              <li>• Enable microphone to test filters</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Warning */}
      {!micEnabled && (
        <div className="mt-4 bg-yellow-900/20 border border-yellow-700/50 rounded p-3">
          <p className="text-yellow-500 text-xs font-mono">
            ⚠️ Enable microphone to use voice filters and make calls
          </p>
        </div>
      )}
    </div>
  );
};

export default VoiceControls;