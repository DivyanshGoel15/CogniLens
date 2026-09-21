from .vision_service import VisionService


class DiagramAnalyzer:
    """Analyze diagrams and explain their structure."""

    def __init__(self):
        self.vision = VisionService()

    def analyze(self, image_path: str) -> str:
        prompt = """
Analyze this diagram as a general-purpose learning assistant.

Identify:
1. The main components.
2. Labels and text visible in the diagram.
3. Connections, arrows, or relationships.
4. The overall concept represented.
5. A clear step-by-step explanation of how the diagram works.

Be accurate and only use information visible in the image.
"""

        return self.vision.analyze_image(image_path, prompt)