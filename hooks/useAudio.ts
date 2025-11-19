
import { useState, useEffect, useRef, useCallback } from 'react';
import { AUDIO_SOURCES } from '../constants';

export const useAudio = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [volume] = useState(0.3); // Default to 30% volume for background ambience
  const [isPlaying, setIsPlaying] = useState(false);

  // Helper to safely get or create the audio instance
  const getAudioInstance = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.loop = true;
      audio.volume = isMuted ? 0 : volume;
      
      // Debugging listeners
      audio.addEventListener('error', (e) => {
        console.error("Audio Error: Failed to load resource.", audio.error);
        console.error("Attempted Source:", audio.src);
      });
      
      audioRef.current = audio;
    }
    return audioRef.current;
  }, [isMuted, volume]);

  // Handle Volume/Mute changes dynamically
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = isMuted ? 0 : volume;
    }
  }, [isMuted, volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const playTrack = useCallback((trackKey: keyof typeof AUDIO_SOURCES) => {
    const audio = getAudioInstance();
    const src = AUDIO_SOURCES[trackKey];
    
    console.log(`[Audio System] Attempting to play: ${src}`);

    // If already playing this track, just ensure it's playing
    if (audio.src.includes(src) && !audio.paused) return;

    // If changing tracks or starting fresh
    if (!audio.src.includes(src)) {
        audio.src = src;
        audio.load(); // Ensure it reloads the new source
    }
    
    const playPromise = audio.play();

    if (playPromise !== undefined) {
        playPromise
        .then(() => {
            console.log("[Audio System] Playback started successfully.");
            setIsPlaying(true);
        })
        .catch(error => {
            // Differentiate between Autoplay blocks and loading errors
            if (error.name === 'NotAllowedError') {
                console.warn("[Audio System] Autoplay prevented. Waiting for user interaction.");
            } else if (error.name === 'NotSupportedError') {
                console.error("[Audio System] Audio source not supported or file missing.");
            } else {
                console.error("[Audio System] Playback error:", error);
            }
            setIsPlaying(false);
        });
    }
  }, [getAudioInstance]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  return {
    playTrack,
    stop,
    toggleMute,
    isMuted,
    isPlaying
  };
};
