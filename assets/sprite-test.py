from PIL import Image, ImageDraw, ImageFont
import os

def get_font_path():
    possible_paths = [
        "/Library/Fonts/Arial.ttf",  # Common macOS path
        "/System/Library/Fonts/Supplemental/Arial.ttf",  # Alternative macOS path
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",  # Common Linux path
        "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",  # Another common Linux path
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            return path
    
    # If no font file is found, raise an exception or set to default PIL font
    print("None of the specified font files were found. Using the default PIL font.")
    return None

def create_individual_images(count, width, height, background_color, font_path, initial_font_size, font_color):
    images = []
    for i in range(1, count + 1):
        image = Image.new("RGB", (width, height), background_color)
        draw = ImageDraw.Draw(image)
        
        if font_path:
            font_size = initial_font_size
            font = ImageFont.truetype(font_path, font_size)
        else:
            font = ImageFont.load_default()
        
        text = str(i)
        if font_path:
            while True:
                text_bbox = draw.textbbox((0, 0), text, font=font)
                text_width, text_height = text_bbox[2] - text_bbox[0], text_bbox[3] - text_bbox[1]
                if text_width <= width and text_height <= height:
                    break
                font_size -= 10
                font = ImageFont.truetype(font_path, font_size)
        else:
            text_width, text_height = draw.textsize(text, font=font)
        
        text_x = (width - text_width) // 2 - text_bbox[0]
        text_y = (height - text_height) // 2 - text_bbox[1]
        
        draw.text((text_x, text_y), text, fill=font_color, font=font)
        images.append(image)
    
    return images

def create_sprite_sheet(images, width, height, output_path):
    sprite_sheet_width = len(images) * width
    sprite_sheet_height = height
    sprite_sheet = Image.new("RGB", (sprite_sheet_width, sprite_sheet_height), (255, 255, 255))
    
    for index, image in enumerate(images):
        sprite_sheet.paste(image, (index * width, 0))
    
    sprite_sheet.save(output_path)

if __name__ == "__main__":
    width, height = 276, 315
    background_color = (255, 255, 255)
    font_size = 250
    font_color = (0, 0, 0)
    font_path = get_font_path()
    user_directory = os.path.expanduser("~")
    output_path = os.path.join(user_directory, "sprite_sheet.png")

    images = create_individual_images(8, width, height, background_color, font_path, font_size, font_color)
    create_sprite_sheet(images, width, height, output_path)
