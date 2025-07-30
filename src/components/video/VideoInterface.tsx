import React, { useState, useRef, useCallback } from 'react';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Play, 
  Square, 
  Download
} from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { HolographicButton } from '../ui/HolographicButton';

interface VideoInterfaceProps {
  onVideoGenerated?: (videoBlob: Blob) => void;
}

export const VideoInterface: React.FC<VideoInterfaceProps> = ({ 
  onVideoGenerated
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [hasVideo, setHasVideo] = useState(false);
  const [hasAudio, setHasAudio] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: hasVideo,
        audio: hasAudio,
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setRecordedBlob(blob);
        onVideoGenerated?.(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }, [hasVideo, hasAudio, onVideoGenerated]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [isRecording]);

  const downloadRecording = useCallback(() => {
    if (recordedBlob) {
      const url = URL.createObjectURL(recordedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recording-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [recordedBlob]);

  return (
    <GlassCard variant="medium" className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Video Interface</h3>
        <div className="flex items-center space-x-2">
          <HolographicButton
            variant="secondary"
            size="sm"
            onClick={() => setHasVideo(!hasVideo)}
          >
            {hasVideo ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          </HolographicButton>
          <HolographicButton
            variant="secondary"
            size="sm"
            onClick={() => setHasAudio(!hasAudio)}
          >
            {hasAudio ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </HolographicButton>
        </div>
      </div>

      <div className="mb-6">
        <video
          ref={videoRef}
          className="w-full h-64 bg-black rounded-lg"
          autoPlay
          muted
          playsInline
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <HolographicButton
            variant={isRecording ? "secondary" : "primary"}
            onClick={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? (
              <>
                <Square className="w-4 h-4 mr-2" />
                Stop Recording
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Recording
              </>
            )}
          </HolographicButton>
        </div>

        {recordedBlob && (
          <div className="flex items-center space-x-2">
            <HolographicButton
              variant="secondary"
              onClick={downloadRecording}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </HolographicButton>
          </div>
        )}
      </div>
    </GlassCard>
  );
};