import colorsys, json, os

def hex_from_hls(h, l, s):
    h = (h % 360) / 360.0
    l = max(0, min(100, l)) / 100.0
    s = max(0, min(100, s)) / 100.0
    r, g, b = colorsys.hls_to_rgb(h, l, s)
    return "#{:02X}{:02X}{:02X}".format(round(r*255), round(g*255), round(b*255))

def light_scale(hue, sat, base_l):
    """12-step light-mode scale, Radix-inspired. Steps 1-8 = bg/border ramp,
    9 = solid brand, 10 = solid hover, 11 = low-contrast text, 12 = high-contrast text."""
    L = [98.5, 96.5, 93.5, 89.5, 84.5, 78, 69, 58, base_l, max(base_l-8,10), 38, 17]
    S = [sat*0.20, sat*0.28, sat*0.34, sat*0.40, sat*0.46, sat*0.52,
         sat*0.58, sat*0.66, sat*1.00, min(sat*1.05,100), sat*0.80, sat*0.55]
    return {str(i+1): hex_from_hls(hue, L[i], S[i]) for i in range(12)}

def dark_scale(hue, sat, base_l):
    """12-step dark-mode scale. 1 = darkest bg ... 12 = brightest text.
    9/10 = neon solid accent."""
    L = [9, 12, 15, 19, 24, 30, 38, 47, base_l, min(base_l+9,90), 78, 93]
    S = [sat*0.35, sat*0.40, sat*0.45, sat*0.50, sat*0.55, sat*0.60,
         sat*0.65, sat*0.72, sat*1.00, min(sat*1.05,100), sat*0.55, sat*0.30]
    return {str(i+1): hex_from_hls(hue, L[i], S[i]) for i in range(12)}

def background_tint(hue):
    """Fundo de página com leve 'banho' da cor do tema (estilo Stripe/Linear).
    L alto + S alto ainda dá um tom bem pastel, porque perto do branco a
    saturação não 'aparece' tanto quanto em tons médios."""
    return hex_from_hls(hue, 97, 100)

def feedback_set(hue, sat, base_l):
    return {
        "surface": hex_from_hls(hue, 95, sat*0.30),
        "border":  hex_from_hls(hue, 78, sat*0.55),
        "solid":   hex_from_hls(hue, base_l, sat),
        "solidHover": hex_from_hls(hue, max(base_l-8,10), sat),
        "text":    hex_from_hls(hue, 32, sat*0.75),
    }

# ---------- FOUNDATIONS ----------
neutral_light = light_scale(hue=230, sat=8, base_l=46)
neutral_dark  = dark_scale(hue=230, sat=10, base_l=55)

feedback = {
    "success": feedback_set(150, 55, 38),
    "warning": feedback_set(40, 85, 52),
    "danger":  feedback_set(357, 72, 50),
    "info":    feedback_set(205, 70, 50),
}

radius = {"none": "0px", "xs": "4px", "sm": "8px", "md": "12px", "lg": "16px", "xl": "20px", "2xl": "24px", "full": "9999px"}

shadow = {
    "xs": "0 1px 2px rgba(16, 24, 40, 0.05)",
    "sm": "0 1px 3px rgba(16, 24, 40, 0.10), 0 1px 2px rgba(16, 24, 40, 0.06)",
    "md": "0 4px 8px -2px rgba(16, 24, 40, 0.10), 0 2px 4px -2px rgba(16, 24, 40, 0.06)",
    "lg": "0 12px 16px -4px rgba(16, 24, 40, 0.08), 0 4px 6px -2px rgba(16, 24, 40, 0.03)",
    "xl": "0 20px 24px -4px rgba(16, 24, 40, 0.08), 0 8px 8px -4px rgba(16, 24, 40, 0.03)",
}

spacing = {str(v): f"{v}px" for v in [2,4,8,12,16,20,24,32,40,48,64,80]}

opacity = {"disabled": 0.40, "overlay": 0.60, "backdrop": 0.80}

foundations = {
    "neutral": {"light": neutral_light, "dark": neutral_dark},
    "feedback": feedback,
    "radius": radius,
    "shadow": shadow,
    "spacing": spacing,
    "opacity": opacity,
}

# ---------- THEMES ----------
# name -> (hue, sat, base_l, mode)
theme_defs = {
    "base-azul-minimal": ("Azul Minimal (Padrão do Site)", 243, 68, 58, "light"),
    "algodao-rosa":      ("☁️ Rosa Algodão", 336, 62, 53, "light"),
    "champagne-chic":    ("🥂 Champagne Chic", 38, 68, 36, "light"),
    "eucalipto-organico":("🌿 Eucalipto Orgânico", 152, 34, 40, "light"),
    "oceano":            ("🌊 Oceano", 204, 68, 42, "light"),
    "pessego":           ("🍑 Pêssego", 21, 75, 43, "light"),
    "terracota":         ("🌅 Terracota", 14, 55, 48, "light"),
    "grafite":           ("⚫ Grafite", 222, 10, 32, "light"),
    "cyberpunk":         ("🌌 Cyberpunk", 232, 75, 58, "dark"),
}

themes = {}
for slug, (label, hue, sat, base_l, mode) in theme_defs.items():
    scale = dark_scale(hue, sat, base_l) if mode == "dark" else light_scale(hue, sat, base_l)
    themes[slug] = {
        "label": label,
        "mode": mode,
        "accentHue": hue,
        "scale": scale,
        "backgroundTint": background_tint(hue) if mode == "light" else None,
    }

with open("/home/claude/convitin-design-system/tokens/foundations.json", "w") as f:
    json.dump(foundations, f, indent=2, ensure_ascii=False)

with open("/home/claude/convitin-design-system/tokens/themes.json", "w") as f:
    json.dump(themes, f, indent=2, ensure_ascii=False)

print("done")
print(json.dumps({k: v["scale"] for k, v in themes.items()}, indent=2, ensure_ascii=False)[:2000])
