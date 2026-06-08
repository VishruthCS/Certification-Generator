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
                # Try to load a standard font
                # On Windows this might be 'arial.ttf'
                font = ImageFont.truetype("arial.ttf", size=config.font_size)
            except IOError:
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
