
import { useState, useEffect, useRef, useCallback } from 'react';
import { AUDIO_SOURCES } from '../constants';

export const useAudio = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.3); // Default to 30% volume for background ambience
  const [isPlaying, setIsPlaying] = useState(false);

  // Initialize Audio Element
  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  // Handle Volume/Mute changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [isMuted, volume]);

  const playTrack = useCallback((trackKey: keyof typeof AUDIO_SOURCES) => {
    if (!audioRef.current) return;

    const src = AUDIO_SOURCES[trackKey];
    
    // Don't restart if already playing this track
    if (audioRef.current.src.includes(src) && !audioRef.current.paused) return;

    audioRef.current.src = src;
    
    // We catch the promise to handle the "User must interact first" error gracefully
    audioRef.current.play().then(() => {
      setIsPlaying(true);
    }).catch(e => {
      console.warn("Audio play blocked until user interaction:", e);
      setIsPlaying(false);
    });
  }, []);

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
