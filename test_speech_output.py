from multimodal.speech.speech_service import SpeechService


speech = SpeechService()

text = (
    "Hello. This is a test of CogniLens text to speech. "
    "Your answer can now be listened to instead of only being read."
)

output_path = "data/test_answer.wav"

print("Generating speech...")

result = speech.synthesize(text, output_path)

print(f"Audio saved to: {result}")