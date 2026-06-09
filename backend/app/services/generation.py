import os
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
from app.models.template import Template, PlaceholderConfig

def generate_certificate(template: Template, configs: list[PlaceholderConfig], data: dict[str, str], format: str = "png") -> BytesIO:
    """
    Generates a certificate by writing text onto the template image.
    Returns the generated file as a BytesIO object.
    """
    try:
        import requests
        if template.image_path.startswith("http://") or template.image_path.startswith("https://"):
            response = requests.get(template.image_path)
            response.raise_for_status()
            img = Image.open(BytesIO(response.content)).convert("RGBA")
        else:
            img = Image.open(template.image_path).convert("RGBA")
    except Exception as e:
        raise ValueError(f"Could not open template image: {e}")

    draw = ImageDraw.Draw(img)
    
    for config in configs:
        field_value = data.get(config.field_name)
        if field_value:
            # Load default font (Pillow's default or a custom TTF if provided)
            # In production, you would load a specific .ttf file based on config.font_family
            try:
                # Render Linux does not have arial.ttf, so we download OpenSans dynamically
                font_filename = "OpenSans-Regular.ttf"
                font_path = os.path.join(os.path.dirname(__file__), font_filename)
                
                if not os.path.exists(font_path):
                    import urllib.request
                    url = "https://github.com/googlefonts/opensans/raw/main/fonts/ttf/OpenSans-Regular.ttf"
                    urllib.request.urlretrieve(url, font_path)
                
                font = ImageFont.truetype(font_path, size=config.font_size)
            except Exception as e:
                print(f"Failed to load TrueType font: {e}")
                # Fallback to default
                font = ImageFont.load_default()

            # Konva frontend places text from the top-left corner by default.
            # Using anchor="lt" (left, top) ensures the text is drawn exactly where the user dragged it.
            draw.text(
                (config.x_coordinate, config.y_coordinate), 
                field_value, 
                fill=config.font_color, 
                font=font,
                anchor="lt" 
            )

    output = BytesIO()
    if format.lower() == "pdf":
        img = img.convert("RGB") # PDF doesn't support RGBA
        img.save(output, format="PDF")
    else:
        img.save(output, format="PNG")
        
    output.seek(0)
    return output
