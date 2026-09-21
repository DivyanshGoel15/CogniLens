import re

from .vision_service import VisionService


class ImageAnalyzer:
    """Analyze images, extract text, and explain learning content."""

    def __init__(self):
        self.vision = VisionService()

    def analyze(self, image_path: str) -> dict:
        prompt = """
You are CogniLens, a multimodal learning agent designed to help
people understand information from images.

Analyze the uploaded image carefully.

Return your response using EXACTLY these four section headings:

EXTRACTED TEXT:
Transcribe all clearly readable text from the image.
If there is no readable text, write: No readable text found.

IMAGE UNDERSTANDING:
Explain what the image represents. Identify diagrams, charts,
questions, labels, relationships, or other important visual information.

KEY POINTS:
Give 3–5 important points useful for understanding the content.

EXPLANATION:
Explain the content clearly and simply. Use step-by-step reasoning
when appropriate.

IMPORTANT:
- Only report information visible or clearly inferable from the image.
- Do not invent missing text, labels, numbers, or facts.
- This is a general-purpose learning agent, not specifically for students.
"""

        result = self.vision.analyze_image(image_path, prompt)

        return self._parse_response(result)

    def _parse_response(self, result: str) -> dict:
        """Convert the model's sectioned response into structured data."""

        sections = {
            "extracted_text": "",
            "image_understanding": "",
            "key_points": "",
            "explanation": "",
        }

        patterns = {
            "extracted_text": r"EXTRACTED TEXT:\s*(.*?)(?=\nIMAGE UNDERSTANDING:|\Z)",
            "image_understanding": r"IMAGE UNDERSTANDING:\s*(.*?)(?=\nKEY POINTS:|\Z)",
            "key_points": r"KEY POINTS:\s*(.*?)(?=\nEXPLANATION:|\Z)",
            "explanation": r"EXPLANATION:\s*(.*?)(?=\Z)",
        }

        for key, pattern in patterns.items():
            match = re.search(pattern, result, re.DOTALL | re.IGNORECASE)

            if match:
                sections[key] = match.group(1).strip()

        return sections