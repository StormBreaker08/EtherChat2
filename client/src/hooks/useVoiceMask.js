import { useState, useRef, useCallback, useEffect } from "react";

/**
 * Voice Masking Engine using Web Audio API
 * Applies pitch shifting and robot modulation effects
 */
export const useVoiceMask = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterType, setFilterType] = useState("none"); // 'none', 'low-pitch', 'robot'
  const [volume, setVolume] = useState(1.0);

  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const destinationRef = useRef(null);
  const gainNodeRef = useRef(null);
  const biquadFilterRef = useRef(null);
  const oscillatorRef = useRef(null);
  const modulatorGainRef = useRef(null);
  const rawStreamRef = useRef(null);

  // Optional: callback to monitor processed audio
  const audioCallbackRef = useRef(null);

  // Initialize Audio Context
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Set volume in real-time
  const setGain = useCallback((val) => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = val;
    }
    setVolume(val);
  }, []);

  // Process microphone stream with voice masking
  const processStream = useCallback(
    async (micStream = null, filter = "none") => {
      try {
        const audioContext = initAudioContext();

        // Request microphone if none provided
        if (!micStream) {
          micStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
        }

        // Reuse existing stream if already active
        if (!rawStreamRef.current) {
          rawStreamRef.current = micStream;
        }

        // Create source from microphone
        const source = audioContext.createMediaStreamSource(
          rawStreamRef.current
        );
        sourceNodeRef.current = source;

        // Create gain node for volume control
        const gainNode = audioContext.createGain();
        gainNode.gain.value = volume;
        gainNodeRef.current = gainNode;

        // Optional audio monitoring
        if (audioCallbackRef.current) {
          const analyser = audioContext.createAnalyser();
          source.connect(analyser);
          analyser.connect(audioContext.destination);
        }

        // Create destination for output stream
        const destination = audioContext.createMediaStreamDestination();
        destinationRef.current = destination;

        let processingChain = source;

        if (filter === "low-pitch") {
          const lowpassFilter = audioContext.createBiquadFilter();
          lowpassFilter.type = "lowpass";
          lowpassFilter.frequency.value = 800;
          lowpassFilter.Q.value = 0.7;
          biquadFilterRef.current = lowpassFilter;

          const lowpassFilter2 = audioContext.createBiquadFilter();
          lowpassFilter2.type = "lowpass";
          lowpassFilter2.frequency.value = 1200;
          lowpassFilter2.Q.value = 1.0;

          const delayNode = audioContext.createDelay();
          delayNode.delayTime.value = 0.02;

          processingChain.connect(lowpassFilter);
          lowpassFilter.connect(lowpassFilter2);
          lowpassFilter2.connect(delayNode);
          delayNode.connect(gainNode);
        } else if (filter === "robot") {
          const carrierOscillator = audioContext.createOscillator();
          carrierOscillator.type = "sine";
          carrierOscillator.frequency.value = 30;
          oscillatorRef.current = carrierOscillator;

          const modulatorGain = audioContext.createGain();
          modulatorGain.gain.value = 0.5;
          modulatorGainRef.current = modulatorGain;

          const waveshaper = audioContext.createWaveShaper();
          waveshaper.curve = makeDistortionCurve(50);
          waveshaper.oversample = "4x";

          const bandpassFilter = audioContext.createBiquadFilter();
          bandpassFilter.type = "bandpass";
          bandpassFilter.frequency.value = 1000;
          bandpassFilter.Q.value = 2.0;
          biquadFilterRef.current = bandpassFilter;

          processingChain.connect(modulatorGain);
          carrierOscillator.connect(modulatorGain.gain);
          modulatorGain.connect(bandpassFilter);
          bandpassFilter.connect(waveshaper);
          waveshaper.connect(gainNode);

          carrierOscillator.start();
        } else {
          processingChain.connect(gainNode);
        }

        gainNode.connect(destination);

        setIsProcessing(true);
        setFilterType(filter);

        return destination.stream;
      } catch (error) {
        console.error("Error processing audio stream:", error);
        setIsProcessing(false);
        throw error;
      }
    },
    [initAudioContext, volume]
  );

  // Change filter on existing stream
  const changeFilter = useCallback(
    async (newFilter) => {
      if (!rawStreamRef.current) {
        console.warn("No active stream to modify");
        return null;
      }

      // Cleanup existing nodes but keep rawStream for reuse
      cleanup(false);

      return await processStream(rawStreamRef.current, newFilter);
    },
    [processStream]
  );

  // Cleanup audio nodes
  const cleanup = useCallback((stopStream = true) => {
    try {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
        oscillatorRef.current = null;
      }

      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current = null;
      }

      if (biquadFilterRef.current) {
        biquadFilterRef.current.disconnect();
        biquadFilterRef.current = null;
      }

      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect();
        gainNodeRef.current = null;
      }

      if (modulatorGainRef.current) {
        modulatorGainRef.current.disconnect();
        modulatorGainRef.current = null;
      }

      if (destinationRef.current) {
        destinationRef.current = null;
      }

      if (stopStream && rawStreamRef.current) {
        rawStreamRef.current.getTracks().forEach((track) => track.stop());
        rawStreamRef.current = null;
      }

      setIsProcessing(false);
      setFilterType("none");
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  // Optional: set a callback for real-time audio monitoring
  const setAudioCallback = useCallback((callback) => {
    audioCallbackRef.current = callback;
  }, []);

  return {
    processStream,
    changeFilter,
    cleanup,
    isProcessing,
    filterType,
    volume,
    setVolume: setGain,
    setAudioCallback,
    audioContext: audioContextRef.current,
  };
};

// Helper function to create distortion curve for waveshaper
function makeDistortionCurve(amount) {
  const samples = 44100;
  const curve = new Float32Array(samples);
  const deg = Math.PI / 180;

  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
  }

  return curve;
}

export default useVoiceMask;
