import { useEffect, useRef, useState } from 'react';

const MUSIC_TRACKS = [
  'https://actions.google.com/sounds/v1/music/ambient_music.ogg',
  'https://actions.google.com/sounds/v1/music/relaxing_music.ogg',
  'https://actions.google.com/sounds/v1/music/upbeat_music.ogg',
  'https://actions.google.com/sounds/v1/music/electronic_music.ogg',
  'https://actions.google.com/sounds/v1/music/calm_music.ogg',
  'https://actions.google.com/sounds/v1/music/focus_music.ogg',
  'https://actions.google.com/sounds/v1/music/energy_music.ogg',
];

export const useAudio = () => {
  const clickSound = useRef(new Audio('https://actions.google.com/sounds/v1/ui/click.ogg'));
  const typingSound = useRef(new Audio('https://actions.google.com/sounds/v1/ui/typing.ogg'));
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const bgMusic = useRef(new Audio(MUSIC_TRACKS[0]));

  useEffect(() => {
    bgMusic.current.src = MUSIC_TRACKS[currentTrackIndex];
    bgMusic.current.loop = true;
    bgMusic.current.volume = 0.07;
  }, [currentTrackIndex]);

  const playClick = () => {
    clickSound.current.currentTime = 0;
    clickSound.current.play().catch(() => {});
  };

  const playTyping = () => {
    typingSound.current.currentTime = 0;
    typingSound.current.play().catch(() => {});
  };

  const toggleMusic = (on: boolean) => {
    if (on) {
      bgMusic.current.play().catch(() => {});
    } else {
      bgMusic.current.pause();
    }
  };

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % MUSIC_TRACKS.length);
    bgMusic.current.play().catch(() => {});
  };

  return { playClick, playTyping, toggleMusic, nextTrack };
};
