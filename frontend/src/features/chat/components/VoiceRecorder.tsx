import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import RecordPlugin from "wavesurfer.js/plugins/record";
import { Pause, Play, SendHorizontal, Square, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveCssColor, formatAudioDuration } from "../utils/waveColors";

const MAX_RECORDING_SEC = 120;

type VoiceRecorderProps = {
  onCancel: () => void;
  onSend: (audio: Blob, durationSec: number) => void;
  isSending: boolean;
};

const VoiceRecorder = ({ onCancel, onSend, isSending }: VoiceRecorderProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const recordRef = useRef<RecordPlugin | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const waveColor = resolveCssColor("--muted-foreground", "#888888", containerRef.current);
    const progressColor = resolveCssColor("--primary", "#a855f7", containerRef.current);

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      height: 28,
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      cursorWidth: 0,
      waveColor,
      progressColor,
    });
    const record = wavesurfer.registerPlugin(
      RecordPlugin.create({ scrollingWaveform: true }),
    );
    wavesurferRef.current = wavesurfer;
    recordRef.current = record;

    record.on("record-progress", (ms) => {
      const sec = ms / 1000;
      setElapsedSec(sec);
      if (sec >= MAX_RECORDING_SEC) record.stopRecording();
    });
    record.on("record-end", (blob) => {
      setRecordedBlob(blob);
      setIsRecording(false);
    });
    wavesurfer.on("play", () => setIsPlaying(true));
    wavesurfer.on("pause", () => setIsPlaying(false));
    wavesurfer.on("finish", () => setIsPlaying(false));

    record
      .startRecording()
      .then(() => setIsRecording(true))
      .catch(() => {
        setPermissionError("Microphone access is needed to record a voice message");
      });

    return () => {
      record.stopRecording();
      wavesurfer.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStop = () => {
    recordRef.current?.stopRecording();
  };

  const handleTogglePlay = () => {
    wavesurferRef.current?.playPause();
  };

  const handleSend = () => {
    if (!recordedBlob) return;
    onSend(recordedBlob, Math.round(elapsedSec));
  };

  if (permissionError) {
    return (
      <div className="flex items-center gap-2 py-1 text-sm text-muted-foreground">
        <span className="flex-1">{permissionError}</span>
        <Button type="button" variant="ghost" size="icon" aria-label="Cancel" onClick={onCancel}>
          <X />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Discard recording"
        onClick={onCancel}
        disabled={isSending}
      >
        <Trash2 />
      </Button>

      <div className="flex flex-1 items-center gap-2 rounded-full bg-muted px-3 py-1.5">
        {isRecording ? (
          <span className="size-2.5 shrink-0 animate-pulse rounded-full bg-destructive" />
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={isPlaying ? "Pause preview" : "Play preview"}
            onClick={handleTogglePlay}
          >
            {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
          </Button>
        )}
        <div ref={containerRef} className="min-w-0 flex-1" />
        <span className="w-9 shrink-0 text-right text-xs text-muted-foreground">
          {formatAudioDuration(elapsedSec)}
        </span>
      </div>

      {isRecording ? (
        <Button type="button" size="icon" aria-label="Stop recording" onClick={handleStop}>
          <Square className="size-4" />
        </Button>
      ) : (
        <Button
          type="button"
          size="icon"
          aria-label="Send voice message"
          onClick={handleSend}
          disabled={isSending || !recordedBlob}
        >
          <SendHorizontal />
        </Button>
      )}
    </div>
  );
};

export default VoiceRecorder;
