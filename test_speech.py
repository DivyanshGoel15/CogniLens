from multimodal.speech.speech_to_text import SpeechToText


audio_path = input("Enter audio file path: ").strip()

speech = SpeechToText()

print("\nTranscribing...\n")

result = speech.transcribe(audio_path)

print("========== TRANSCRIPTION ==========")
print(result)