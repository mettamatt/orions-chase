import os
import argparse
from PIL import Image

def load_images(image_dir):
    image_files = [f for f in sorted(os.listdir(image_dir)) if f.endswith('.png')]
    return [Image.open(os.path.join(image_dir, img)) for img in image_files]

def create_sprite_sheet(images, output_path):
    sprite_width, sprite_height = images[0].size
    sheet_width = sprite_width * len(images)
    sheet_height = sprite_height
    
    sprite_sheet = Image.new("RGBA", (sheet_width, sheet_height))
    
    for index, image in enumerate(images):
        sprite_sheet.paste(image, (index * sprite_width, 0))
    
    sprite_sheet.save(output_path)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create a sprite sheet from PNG files in a directory.")
    parser.add_argument("image_dir", type=str, help="The directory containing the PNG files.")
    args = parser.parse_args()
    
    images = load_images(args.image_dir)
    if images:
        output_path = os.path.join(args.image_dir, 'sprite_sheet.png')
        create_sprite_sheet(images, output_path)
        print(f"Sprite sheet saved as {output_path}")
    else:
        print("No PNG files found in the directory.")
