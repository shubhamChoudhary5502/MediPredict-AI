import React, { useState } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";

const VoiceAssistant = () => {
  const [loading, setLoading] = useState(false);
  const [responseAudio, setResponseAudio] = useState(null);
  const [backendTextResponse, setBackendTextResponse] = useState("");

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  const handleStart = () => {
    setResponseAudio(null);
    setBackendTextResponse("");
    resetTranscript();
    SpeechRecognition.startListening({ continuous: false });
  };

  const handleStop = async () => {
    SpeechRecognition.stopListening();

    if (transcript.trim().length === 0) return;

    try {
      setLoading(true);
      const res = await fetch("http://localhost:5030/text-predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: transcript }),
      });

      if (!res.ok) throw new Error("API failed");

      // If response is audio (optional)
      const blob = await res.blob();
      const audioURL = URL.createObjectURL(blob);
      setResponseAudio(audioURL);

      // Optional: Play it
      const audio = new Audio(audioURL);
      audio.play();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!browserSupportsSpeechRecognition) {
    return <span>Your browser does not support speech recognition.</span>;
  }

  return (
    <div className="bg-slate-800 p-6 rounded-xl shadow-xl border border-slate-700 w-96 fixed bottom-6 right-6 z-50">
      <h2 className="text-xl font-semibold mb-2 text-white">Talk to MediPredict AI</h2>
      <p className="text-slate-400 text-sm mb-2">Transcript:</p>
      <div className="bg-slate-700 text-white rounded p-3 h-24 overflow-y-auto mb-4 text-sm">
        {transcript || "Start speaking..."}
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleStart}
          disabled={listening}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white font-medium"
        >
          Start
        </button>
        <button
          onClick={handleStop}
          disabled={!listening}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white font-medium"
        >
          Stop
        </button>
      </div>

      {loading && <div className="mt-4 text-emerald-400 text-sm">Analyzing...</div>}

      {responseAudio && (
        <div className="mt-4">
          <p className="text-slate-400 text-sm mb-2">Response:</p>
          <audio controls src={responseAudio} className="w-full" />
        </div>
      )}
    </div>
  );
};

export default VoiceAssistant;
