import os
import base64
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()


class VisionService:
    """Service for sending images to Azure Foundry vision model."""

    def __init__(self):
        endpoint = os.getenv("AZURE_FOUNDRY_ENDPOINT")
        api_key = os.getenv("AZURE_FOUNDRY_API_KEY")
        deployment = os.getenv("AZURE_FOUNDRY_DEPLOYMENT")

        if not endpoint:
            raise ValueError("AZURE_FOUNDRY_ENDPOINT is not configured")

        if not api_key:
            raise ValueError("AZURE_FOUNDRY_API_KEY is not configured")

        if not deployment:
            raise ValueError("AZURE_FOUNDRY_DEPLOYMENT is not configured")

        self.deployment = deployment

        self.client = OpenAI(
            api_key=api_key,
            base_url=endpoint.rstrip("/") + "/openai/v1/"
        )

    def analyze_image(self, image_path: str, prompt: str) -> str:
        """Send an image and prompt to the multimodal model."""

        image_path = image_path.strip().strip('"').strip("'")
        path = Path(image_path)

        if not path.exists():
           raise FileNotFoundError(f"Image not found: {image_path}")

        image_bytes = path.read_bytes()
        image_base64 = base64.b64encode(image_bytes).decode("utf-8")

        suffix = path.suffix.lower()

        mime_types = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp",
            ".gif": "image/gif",
        }

        mime_type = mime_types.get(suffix, "image/png")

        response = self.client.responses.create(
            model=self.deployment,
            input=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text",
                            "text": prompt,
                        },
                        {
                            "type": "input_image",
                            "image_url": (
                                f"data:{mime_type};base64,{image_base64}"
                            ),
                        },
                    ],
                }
            ],
        )

        return response.output_text