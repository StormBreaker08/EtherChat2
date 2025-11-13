import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Voice Masking Engine using Web Audio API
 * Applies pitch shifting and robot modulation effects
 */
export const useVoiceMask = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterType, setFilterType] = useState('none'); // 'none', 'low-pitch', 'robot'
  
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const destinationRef = useRef(null);
  const gainNodeRef = useRef(null);
  const biquadFilterRef = useRef(null);
  const oscillatorRef = useRef(null);
  const modulatorGainRef = useRef(null);
  const rawStreamRef = useRef(null);

  // Initialize Audio Context
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Process microphone stream with voice masking
  const processStream = useCallback(async (micStream, filter = 'none') => {
    try {
      const audioContext = initAudioContext();
      rawStreamRef.current = micStream;

      // Create source from microphone
      const source = audioContext.createMediaStreamSource(micStream);
      sourceNodeRef.current = source;

      // Create gain node for volume control
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 1.0;
      gainNodeRef.current = gainNode;

      // Create destination for output stream
      const destination = audioContext.createMediaStreamDestination();
      destinationRef.current = destination;

      let processingChain = source;

      if (filter === 'low-pitch') {
        // LOW PITCH FILTER
        // Use BiquadFilter to reduce high frequencies and enhance bass
        const lowpassFilter = audioContext.createBiquadFilter();
        lowpassFilter.type = 'lowpass';
        lowpassFilter.frequency.value = 800; // Cut frequencies above 800Hz
        lowpassFilter.Q.value = 0.7;
        biquadFilterRef.current = lowpassFilter;

        // Create a second lowpass for more aggressive filtering
        const lowpassFilter2 = audioContext.createBiquadFilter();
        lowpassFilter2.type = 'lowpass';
        lowpassFilter2.frequency.value = 1200;
        lowpassFilter2.Q.value = 1.0;

        // Pitch shift simulation using delay and feedback
        const delayNode = audioContext.createDelay();
        delayNode.delayTime.value = 0.02; // 20ms delay for slight pitch effect
        
        // Connect processing chain
        processingChain.connect(lowpassFilter);
        lowpassFilter.connect(lowpassFilter2);
        lowpassFilter2.connect(delayNode);
        delayNode.connect(gainNode);

      } else if (filter === 'robot') {
        // ROBOT FILTER (Ring Modulator)
        // Create carrier oscillator for modulation
        const carrierOscillator = audioContext.createOscillator();
        carrierOscillator.type = 'sine';
        carrierOscillator.frequency.value = 30; // 30Hz modulation
        oscillatorRef.current = carrierOscillator;

        // Create modulator gain (acts as ring modulator)
        const modulatorGain = audioContext.createGain();
        modulatorGain.gain.value = 0.5;
        modulatorGainRef.current = modulatorGain;

        // Create a distortion/waveshaper for robotic effect
        const waveshaper = audioContext.createWaveShaper();
        waveshaper.curve = makeDistortionCurve(50);
        waveshaper.oversample = '4x';

        // Bandpass filter for robotic frequency range
        const bandpassFilter = audioContext.createBiquadFilter();
        bandpassFilter.type = 'bandpass';
        bandpassFilter.frequency.value = 1000; // Center at 1kHz
        bandpassFilter.Q.value = 2.0;
        biquadFilterRef.current = bandpassFilter;

        // Connect ring modulator chain
        processingChain.connect(modulatorGain);
        carrierOscillator.connect(modulatorGain.gain);
        modulatorGain.connect(bandpassFilter);
        bandpassFilter.connect(waveshaper);
        waveshaper.connect(gainNode);

        // Start oscillator
        carrierOscillator.start();

      } else {
        // NO FILTER - Direct connection
        processingChain.connect(gainNode);
      }

      // Final connection to destination
      gainNode.connect(destination);

      setIsProcessing(true);
      setFilterType(filter);

      // Return the processed stream
      return destination.stream;

    } catch (error) {
      console.error('Error processing audio stream:', error);
      setIsProcessing(false);
      throw error;
    }
  }, [initAudioContext]);

  // Change filter on existing stream
  const changeFilter = useCallback(async (newFilter) => {
    if (!rawStreamRef.current) {
      console.warn('No active stream to modify');
      return null;
    }

    // Cleanup existing processing
    cleanup();

    // Reprocess with new filter
    return await processStream(rawStreamRef.current, newFilter);
  }, [processStream]);

  // Cleanup audio nodes
  const cleanup = useCallback(() => {
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

      if (rawStreamRef.current) {
        rawStreamRef.current.getTracks().forEach(track => track.stop());
        rawStreamRef.current = null;
      }

      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      setIsProcessing(false);
      setFilterType('none');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return {
    processStream,
    changeFilter,
    cleanup,
    isProcessing,
    filterType,
    audioContext: audioContextRef.current
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