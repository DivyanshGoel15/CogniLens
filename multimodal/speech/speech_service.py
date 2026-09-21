from pathlib import Path

import azure.cognitiveservices.speech as speechsdk

from .speech_to_text import SpeechToText


class SpeechService:
    """High-level speech service for CogniLens."""

    def __init__(self):
        self.speech_to_text = SpeechToText()

        self.speech_config = speechsdk.SpeechConfig(
            subscription=self.speech_to_text.speech_key,
            region=self.speech_to_text.speech_region,
        )

    def transcribe(self, audio_path: str) -> str:
        """Convert an audio file into text."""
        return self.speech_to_text.transcribe(audio_path)

    def synthesize(self, text: str, output_path: str) -> str:
        """Convert text into speech and save it as an audio file."""

        if not text or not text.strip():
            raise ValueError("Text cannot be empty")

        output_path = output_path.strip().strip('"').strip("'")
        path = Path(output_path)

        path.parent.mkdir(parents=True, exist_ok=True)

        audio_config = speechsdk.audio.AudioOutputConfig(
            filename=str(path)
        )

        synthesizer = speechsdk.SpeechSynthesizer(
            speech_config=self.speech_config,
            audio_config=audio_config,
        )

        result = synthesizer.speak_text_async(text).get()

        if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
            return str(path)

        if result.reason == speechsdk.ResultReason.Canceled:
            cancellation = result.cancellation_details
            raise RuntimeError(
                f"Speech synthesis canceled: {cancellation.reason}"
            )

        raise RuntimeError("Unable to synthesize speech.")