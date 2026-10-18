from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
root = Path(__file__).resolve().parent.parent
im = Image.new('RGB', (1200, 630), '#edf2f8')
d = ImageDraw.Draw(im)
d.rounded_rectangle((80, 80, 1120, 550), radius=40, fill='white')
d.ellipse((160, 205, 380, 425), fill='#2a5caa')
d.polygon([(205, 350), (270, 240), (335, 350)], fill='white')
font = next((p for p in [Path('C:/Windows/Fonts/arialbd.ttf'), Path('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf')] if p.exists()), None)
large = ImageFont.truetype(str(font), 72) if font else ImageFont.load_default()
small = ImageFont.truetype(str(font), 25) if font else ImageFont.load_default()
d.text((435, 235), 'SEORIPUL-GU', font=large, fill='#24344c')
d.text((440, 335), 'GEUMSEONG  /  OFFICIAL WEBSITE', font=small, fill='#53657b')
im.save(root / 'assets/og-seoripul.png')

