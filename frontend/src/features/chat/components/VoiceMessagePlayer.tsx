import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveCssColor, formatAudioDuration } from "../utils/waveColors";

type VoiceMessagePlayerProps = {
  url: string;
  durationSec?: number;
  isOwn: boolean;
};

const VoiceMessagePlayer = ({ url, durationSec, isOwn }: VoiceMessagePlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(durationSec ?? 0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const waveColor = resolveCssColor(
      isOwn ? "--primary-foreground" : "--muted-foreground",
      isOwn ? "#ffffff" : "#888888",
      containerRef.current,
    );
    const progressColor = resolveCssColor(
      isOwn ? "--background" : "--primary",
      isOwn ? "#e5e5e5" : "#a855f7",
      containerRef.current,
    );

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      url,
      height: 28,
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      cursorWidth: 0,
      waveColor,
      progressColor,
    });
    wavesurferRef.current = wavesurfer;

    wavesurfer.on("ready", (dur) => setDuration(dur));
    wavesurfer.on("audioprocess", (time) => setCurrentTime(time));
    wavesurfer.on("play", () => setIsPlaying(true));
    wavesurfer.on("pause", () => setIsPlaying(false));
    wavesurfer.on("finish", () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    return () => {
      wavesurfer.destroy();
      wavesurferRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, isOwn]);

  const togglePlay = () => {
    wavesurferRef.current?.playPause();
  };

  return (
    <div
      data-slot="voice-message-player"
      className="flex w-56 items-center gap-2 rounded-2xl px-1 py-1"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={togglePlay}
        aria-label={isPlaying ? "Pause voice message" : "Play voice message"}
      >
        {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
      </Button>
      <div ref={containerRef} className="min-w-0 flex-1" />
      <span className="w-9 shrink-0 text-right text-xs opacity-80">
        {formatAudioDuration(isPlaying || currentTime > 0 ? currentTime : duration)}
      </span>
    </div>
  );
};

export default VoiceMessagePlayer;
