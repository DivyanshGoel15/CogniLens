from multimodal.vision.image_analyzer import ImageAnalyzer


def main():
    image_path = input("Enter image path: ").strip()

    analyzer = ImageAnalyzer()

    print("\nAnalyzing image...\n")

    result = analyzer.analyze(image_path)

    print("\n========== RESULT ==========\n")
    print("Extracted Text:")
    print(result["extracted_text"])

    print("\nImage Understanding:")
    print(result["image_understanding"])

    print("\nKey Points:")
    print(result["key_points"])

    print("\nExplanation:")
    print(result["explanation"])


if __name__ == "__main__":
    main()