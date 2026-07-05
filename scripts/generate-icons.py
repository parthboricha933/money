from PIL import Image, ImageDraw, ImageFont
import os

icons_dir = "/home/z/my-project/public/icons"
os.makedirs(icons_dir, exist_ok=True)

for size in [192, 512]:
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Background rounded rectangle with gradient
    corner_radius = int(size * 0.2)
    
    # Draw gradient background (emerald to teal)
    for y in range(size):
        ratio = y / size
        r = int(16 + (13 - 16) * ratio)  # #10b981 -> #0d9488
        g = int(185 + (148 - 185) * ratio)
        b = int(129 + (136 - 129) * ratio)
        for x in range(size):
            # Check if inside rounded rect
            in_rect = True
            for cx, cy in [(corner_radius, corner_radius), (size - corner_radius, corner_radius), 
                          (corner_radius, size - corner_radius), (size - corner_radius, size - corner_radius)]:
                if (x < corner_radius or x >= size - corner_radius) and (y < corner_radius or y >= size - corner_radius):
                    dx = abs(x - cx)
                    dy = abs(y - cy)
                    if dx > 0 or dy > 0:
                        dist = ((dx) ** 2 + (dy) ** 2) ** 0.5
                        if dist > corner_radius:
                            in_rect = False
                            break
            if in_rect:
                img.putpixel((x, y), (r, g, b, 255))
    
    # Draw ₹ symbol
    try:
        font_size = int(size * 0.5)
        font = ImageFont.truetype("/usr/share/fonts/truetype/chinese/NotoSansSC-Regular.ttf", font_size)
    except:
        font = ImageFont.load_default()
    
    text = "₹"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x = (size - text_w) // 2
    y = (size - text_h) // 2 - bbox[1]
    
    # Draw white text with slight shadow
    draw.text((x + 2, y + 2), text, fill=(0, 0, 0, 60), font=font)
    draw.text((x, y), text, fill=(255, 255, 255, 255), font=font)
    
    filepath = os.path.join(icons_dir, f"icon-{size}.png")
    img.save(filepath, "PNG")
    print(f"Created {filepath}")

# Also create favicon
img_small = img.resize((32, 32), Image.Resampling.LANCZOS)
img_small.save("/home/z/my-project/public/favicon.ico", "ICO")
print("Created favicon.ico")

print("Done!")
