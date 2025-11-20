
import { useState, useEffect, useRef, useCallback } from 'react';
import { AUDIO_SOURCES } from '../constants';

const STORAGE_KEY_MUTE = 'ethershift_audio_pref';

export const useAudio = () => {
  const musicRef = useRef<HTMLAudioElement | null>(null);
  
  // Initialize mute state from local storage
  const [isMuted, setIsMuted] = useState(() => {
      const saved = localStorage.getItem(STORAGE_KEY_MUTE);
      return saved ? JSON.parse(saved) : false;
  });
  
  const [volume] = useState(0.3); 
  const [isPlaying, setIsPlaying] = useState(false);

  // Initialize Music Player (Background)
  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audio.volume = isMuted ? 0 : volume;
    musicRef.current = audio;

    return () => {
      audio.pause();
      musicRef.current = null;
    };
  }, []); // Run once on mount

  // Handle Volume/Mute changes & Persistence
  useEffect(() => {
    if (musicRef.current) {
      musicRef.current.volume = isMuted ? 0 : volume;
    }
    localStorage.setItem(STORAGE_KEY_MUTE, JSON.stringify(isMuted));
  }, [isMuted, volume]);

  const playTrack = useCallback((trackKey: keyof typeof AUDIO_SOURCES) => {
    const audio = musicRef.current;
    if (!audio) return;

    const src = AUDIO_SOURCES[trackKey];
    
    // Only change source if it's different
    if (!audio.src.includes(src)) {
        audio.src = src;
        audio.load();
    }
    
    // Prevent double-play
    if (isPlaying && !audio.paused) return;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
        playPromise
        .then(() => setIsPlaying(true))
        .catch(error => {
            console.warn("[Audio] Autoplay prevented or source missing.", error);
            setIsPlaying(false);
        });
    }
  }, [isPlaying]);

  const playSfx = useCallback((sfxKey: keyof typeof AUDIO_SOURCES) => {
      if (isMuted) return;
      
      // Create a new Audio instance for every SFX to allow overlapping
      const sfx = new Audio(AUDIO_SOURCES[sfxKey]);
      sfx.volume = 0.4; // Slightly louder than bg
      sfx.play().catch(() => {
          // Ignore SFX errors (usually interaction requirement)
      });
  }, [isMuted]);

  const stop = useCallback(() => {
    if (musicRef.current) {
      musicRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev: boolean) => !prev);
  }, []);

  return {
    playTrack,
    playSfx,
    stop,
    toggleMute,
    isMuted,
    isPlaying
  };
};
