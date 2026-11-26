"""Render the share card with local typography and the existing author illustration."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parent.parent
fonts = Path('/System/Library/Fonts/Supplemental')
card = Image.new('RGB', (1200, 630), '#eee5d2')
draw = ImageDraw.Draw(card)
def label(text, position, filename, size, color):
    font = ImageFont.truetype(str(fonts / filename), size)
    draw.text(position, text, font=font, fill=color, anchor='lt')
label('ОНЛАЙН-МИСТЕРИЯ · МАРИЯ УХАНОВА', (60, 62), 'Arial.ttf', 14, '#75423d')
label('За Белым', (60, 127), 'Georgia.ttf', 72, '#372f27')
label('Кроликом', (60, 208), 'Georgia Italic.ttf', 72, '#75423d')
label('12 дверей', (60, 314), 'Georgia.ttf', 32, '#372f27')
label('20 или 24 декабря 2026', (60, 386), 'Georgia.ttf', 24, '#372f27')
label('4 часа · Zoom · без записи', (60, 438), 'Arial.ttf', 17, '#534737')
label('rabbit.logos-journey.com', (60, 508), 'Arial.ttf', 14, '#675a47')
art = Image.open(root / 'public/images/hero-rabbit-alice.webp').convert('RGB')
art.thumbnail((630, 420), Image.Resampling.LANCZOS)
card.paste(art, (550, 90))
card.save(root / 'public/og-image.jpg', 'JPEG', quality=95, subsampling=0, optimize=True)
