// node_modules imports
import React, { useRef, useState, useEffect } from "react";
import { kea } from "kea";
import { useValues, useActions } from "kea";
// Local imports
import totemLogic from "../artwork/logic.totem.js";
// Style imports
import "@sass/components/AudioPlayer.sass";

const playerLogic = kea({
  actions: {
    setAudioSource: (sample) => ({ sample }),
    setCurrentTime: (time) => ({ time }),
    setDuration: (duration) => ({ duration }),
    setIsPlaying: (audio) => ({ audio }),
  },

  reducers: {
    audio: [
      new Audio(),
      {
        setAudioSource: (audio, { sample }) => {
          audio.pause();
          audio.src = `/assets/audio/samples/${sample}`;
          audio.loop = true;
          return audio;
        },
      },
    ],

    isPlaying: [
      false,
      {
        setIsPlaying: (_, { audio }) => {
          return !audio.paused && !audio.ended;
        },
      },
    ],

    currentTime: [
      0,
      {
        setCurrentTime: (_, { time }) => time,
      },
    ],

    duration: [
      0,
      {
        setDuration: (_, { duration }) => duration,
      },
    ],
  },
});

const AudioPlayer = ({}) => {
  const { audio, isPlaying, currentTime, duration } = useValues(playerLogic);
  const {
    setAudioSource,
    setIsPlaying,
    setCurrentTime,
    setDuration,
  } = useActions(playerLogic);

  const { currentMapping } = useValues(totemLogic);

  const updatePlaying = () => setIsPlaying(audio);
  const onTimeupdate = () => setCurrentTime(audio.currentTime);
  const onCanPlayThrough = () => {
    setDuration(audio.duration);
    setIsPlaying(audio);
  };

  useEffect(() => {
    if (!audio.src.includes(currentMapping.sample)) {
      audio.pause();
      setAudioSource(currentMapping.sample);
    }
    return () => {};
  }, [currentMapping]);

  useEffect(() => {
    audio.onplay = updatePlaying;
    audio.onpause = updatePlaying;
    audio.onchange = updatePlaying;
    audio.oncanplaythrough = onCanPlayThrough;
    audio.ontimeupdate = onTimeupdate;
  }, [audio]);

  const cx = 0;
  const cy = 0;
  const r = 50;
  const range = currentTime / duration;
  const startX = cx + r;
  const startY = cy;
  const endX = cx + r + r * Math.sin(range * Math.PI * 2.0);
  const endY = cy + r - r * Math.cos(range * Math.PI * 2.0);
  const way = range >= 0.5 ? 1 : 0;
  const sweep = range > 0 || range === 1.0 ? 1 : 0;
  const left = currentTime / duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="audio-player">
      <svg width={140} height={140}>
        <g
          stroke="var(--color-curacao)"
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          transform="translate(20, 20)"
        >
          <circle
            cx={cx + r}
            cy={cy + r}
            r={r}
            fill="none"
            strokeWidth="2"
            stroke="var(--color-snow)"
          />
          <path
            d={`M ${startX} ${startY} A ${r} ${r} 0 ${way} ${sweep} ${endX} ${endY}`}
          />
          <polygon
            className="play"
            style={{ cursor: "pointer" }}
            transform={`translate(${cx + r / 2},${cy + r / 2})`}
            points={
              isPlaying
                ? "12.5,12.5 37.5,12.5 37.5,37.5 12.5,37.5"
                : "14.5,5 45,25 45,25 14.5,45"
            }
            fill="var(--color-curacao)"
            stroke="none"
            onClick={(e) => {
              audio.paused ? audio.play() : audio.pause();
            }}
          />
        </g>
      </svg>
    </div>
  );
};

export default AudioPlayer;
export { playerLogic };
