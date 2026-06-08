import os
import json
import google.generativeai as genai
import PIL.Image
import requests
from io import BytesIO

from app.core.config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)

def detect_placeholders(image_path: str):
    """
    Uses Gemini Vision to detect placeholder coordinates on a certificate template.
    """
    try:
        if image_path.startswith("http://") or image_path.startswith("https://"):
            response = requests.get(image_path)
            response.raise_for_status()
            img = PIL.Image.open(BytesIO(response.content))
        else:
            img = PIL.Image.open(image_path)
    except Exception as e:
        raise ValueError(f"Could not open image: {e}")

    # Using the flash model for multimodal tasks
    model = genai.GenerativeModel('gemini-2.5-flash')

    prompt = f"""
    Analyze this certificate template image. The image dimensions are {img.width} pixels wide by {img.height} pixels high.
    Identify EVERY logical blank space or line where custom text should be inserted (e.g., Recipient Name, Course Name, Date, Certificate ID, Signature Name).
    
    CRITICAL: Locate the most prominent, stylized existing text on the certificate (like the main title or heading). 
    Extract the EXACT hex color code of this text (e.g., #5A3E2B, #1A237E, #D4AF37). Do NOT just guess black; look closely at the pixels of the title text.
    
    Return the output ONLY as a valid JSON object matching this exact schema, without any markdown formatting:
    {{
      "font_color": "<hex code, e.g. #000000 or #5A3E2B>",
      "fields": [
        {{
          "name": "<A descriptive lowercase_snake_case name for the field, e.g. recipient_name, issue_date>",
          "x": <center X pixel coordinate>,
          "y": <center Y pixel coordinate>
        }}
      ]
    }}
    
    Ensure the x coordinates are between 0 and {img.width}, and the y coordinates are between 0 and {img.height}.
    """

    try:
        response = model.generate_content(
            [prompt, img],
            generation_config=genai.types.GenerationConfig(
                response_mime_type="application/json",
            ),
        )
        text_response = response.text
        # Clean up markdown if present
        if text_response.startswith("```json"):
            text_response = text_response.replace("```json", "").replace("```", "").strip()
        
        coordinates = json.loads(text_response)
        return coordinates
    except Exception as e:
        print(f"Gemini API error: {e}")
        # Fallback dummy coordinates if AI fails or formatting is bad
        return {
            "font_color": "#000000",
            "fields": [
                { "name": "recipient_name", "x": 400, "y": 300 },
                { "name": "from_date", "x": 300, "y": 500 },
                { "name": "to_date", "x": 500, "y": 500 }
            ]
        }
