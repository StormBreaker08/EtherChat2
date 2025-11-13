import { useEffect, useRef } from 'react';
import { Activity } from 'lucide-react';

const Visualizer = ({ audioContext }) => {
  const canvasRef = useRef(null);
  const animationIdRef = useRef(null);
  const analyserRef = useRef(null);

  useEffect(() => {
    if (!audioContext || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Create analyser if audio context is available
    try {
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      // Try to connect to the audio context destination
      if (audioContext.destination) {
        try {
          const source = audioContext.createMediaStreamSource(
            audioContext.createMediaStreamDestination().stream
          );
          source.connect(analyser);
        } catch (e) {
          console.log('Could not connect to audio source for visualization');
        }
      }
      
      analyserRef.current = analyser;

      const draw = () => {
        animationIdRef.current = requestAnimationFrame(draw);

        if (!ctx || !canvas) return;

        const width = canvas.offsetWidth;
        const height = canvas.offsetHeight;

        analyser.getByteFrequencyData(dataArray);

        // Clear canvas with fade effect
        ctx.fillStyle = 'rgba(10, 14, 15, 0.2)';
        ctx.fillRect(0, 0, width, height);

        const barWidth = (width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * height * 0.8;

          // Create gradient for bars
          const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
          gradient.addColorStop(0, '#00ff00');
          gradient.addColorStop(0.5, '#00cc00');
          gradient.addColorStop(1, '#009900');

          ctx.fillStyle = gradient;
          ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);

          // Add glow effect
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#00ff00';

          x += barWidth + 1;
        }

        // Draw center line
        ctx.strokeStyle = '#00ff0033';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
      };

      draw();

    } catch (error) {
      console.error('Error setting up visualizer:', error);
    }

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (analyserRef.current) {
        try {
          analyserRef.current.disconnect();
        } catch (e) {
          // Ignore disconnect errors
        }
      }
    };
  }, [audioContext]);

  return (
    <div className="bg-cyber-gray border border-matrix-900 rounded-lg p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Activity className="w-4 h-4 text-matrix-500" />
        <h4 className="text-matrix-500 font-mono text-sm">Audio Visualizer</h4>
      </div>
      
      <div className="bg-cyber-dark border border-matrix-900 rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-32"
          style={{ display: 'block' }}
        />
      </div>
      
      <div className="mt-3 text-matrix-800 text-xs font-mono">
        Real-time frequency spectrum analysis
      </div>
    </div>
  );
};

export default Visualizer;