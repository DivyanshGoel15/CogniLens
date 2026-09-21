import os
from pathlib import Path

import azure.cognitiveservices.speech as speechsdk
from dotenv import load_dotenv

load_dotenv()


class SpeechToText:
    """Convert speech audio into text using Azure Speech."""

    def __init__(self):
        self.speech_key = os.getenv("AZURE_SPEECH_KEY")
        self.speech_region = os.getenv("AZURE_SPEECH_REGION")

        if not self.speech_key:
            raise ValueError("AZURE_SPEECH_KEY is not configured")

        if not self.speech_region:
            raise ValueError("AZURE_SPEECH_REGION is not configured")

        self.speech_config = speechsdk.SpeechConfig(
            subscription=self.speech_key,
            region=self.speech_region,
        )

    def transcribe(self, audio_path: str) -> str:
        """Transcribe a local audio file."""

        audio_path = audio_path.strip().strip('"').strip("'")
        path = Path(audio_path)

        if not path.exists():
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        audio_config = speechsdk.audio.AudioConfig(
            filename=str(path)
        )

        recognizer = speechsdk.SpeechRecognizer(
            speech_config=self.speech_config,
            audio_config=audio_config,
        )

        result = recognizer.recognize_once()

        if result.reason == speechsdk.ResultReason.RecognizedSpeech:
            return result.text

        if result.reason == speechsdk.ResultReason.NoMatch:
            return "No speech could be recognized."

        if result.reason == speechsdk.ResultReason.Canceled:
            cancellation = result.cancellation_details
            raise RuntimeError(
                f"Speech recognition canceled: {cancellation.reason}"
            )

        return "Unable to recognize speech."