import json

with open("/home/claude/convitin-design-system/tokens/foundations.json") as f:
    foundations = json.load(f)
with open("/home/claude/convitin-design-system/tokens/themes.json") as f:
    themes = json.load(f)

neutral_light = foundations["neutral"]["light"]
neutral_dark  = foundations["neutral"]["dark"]
feedback = foundations["feedback"]

def relative_luminance(hex_color):
    hex_color = hex_color.lstrip("#")
    r, g, b = (int(hex_color[i:i+2], 16) / 255 for i in (0, 2, 4))
    def lin(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = lin(r), lin(g), lin(b)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b

def best_on_color(bg_hex, light_hex, dark_hex):
    """Pick whichever of light/dark text reads better on bg_hex (WCAG contrast)."""
    l_bg = relative_luminance(bg_hex)
    def contrast(fg_hex):
        l_fg = relative_luminance(fg_hex)
        lighter, darker = max(l_bg, l_fg), min(l_bg, l_fg)
        return (lighter + 0.05) / (darker + 0.05)
    return light_hex if contrast(light_hex) >= contrast(dark_hex) else dark_hex

def build_semantic(theme):
    accent = theme["scale"]
    neutral = neutral_dark if theme["mode"] == "dark" else neutral_light
    # Todos os temas foram calibrados (base_l do tom 9) para dar contraste >= 4.5:1
    # contra branco, então o botão primário sempre usa texto branco -- convenção
    # única, sem trocar cor de texto tema a tema (como Stripe/Linear fazem).
    on_primary = "#FFFFFF"
    _check = best_on_color(accent["9"], "#FFFFFF", "#1A1A1A")
    if _check != "#FFFFFF":
        print(f"AVISO: {theme['label']} - branco pode ficar abaixo do ideal em primary-9 ({accent['9']})")

    if theme["mode"] == "light":
        # Fundo da página ganha um "banho" pastel da cor do tema; os cards ficam
        # brancos puros por cima para dar contraste e profundidade (Stripe/Linear).
        background = theme["backgroundTint"]
        surface = "#FFFFFF"
        surface_elevated = "#FFFFFF"
    else:
        background = neutral["2"]
        surface = neutral["1"]
        surface_elevated = neutral["1"]

    return {
        # Foundations / surfaces
        "background":       background,
        "surface":          surface,
        "surfaceElevated":  surface_elevated,
        "surfaceHover":     neutral["3"],
        "surfaceActive":    neutral["4"],
        "border":           neutral["6"],
        "borderHover":      neutral["7"],
        "borderFocus":      accent["8"],
        # Typography
        "textTitle":        neutral["12"],
        "textHeading":      neutral["12"],
        "textBody":         neutral["11"],
        "textMuted":        neutral["10"],
        "textDisabled":     neutral["8"],
        "textInverse":      neutral["1"],
        # Primary (theme accent)
        "primary":          accent["9"],
        "primaryHover":     accent["10"],
        "primaryActive":    accent["11"],
        "primarySoft":      accent["3"],
        "primarySurface":   accent["2"],
        "onPrimary":        on_primary,
        # Secondary (neutral-driven, theme agnostic)
        "secondary":        neutral["4"],
        "secondaryHover":   neutral["5"],
        "secondarySurface": neutral["2"],
        "onSecondary":      neutral["12"],
        # Feedback (global, shared across all themes)
        "success":        feedback["success"]["solid"],
        "successSurface": feedback["success"]["surface"],
        "warning":        feedback["warning"]["solid"],
        "warningSurface": feedback["warning"]["surface"],
        "danger":         feedback["danger"]["solid"],
        "dangerSurface":  feedback["danger"]["surface"],
        "info":           feedback["info"]["solid"],
        "infoSurface":    feedback["info"]["surface"],
    }

semantic = {slug: {"label": t["label"], "mode": t["mode"], "tokens": build_semantic(t)} for slug, t in themes.items()}

with open("/home/claude/convitin-design-system/tokens/semantic.json", "w") as f:
    json.dump(semantic, f, indent=2, ensure_ascii=False)

# ---------------- COMPONENT TOKENS ----------------
# These reference SEMANTIC token names (strings), not raw colors, so they are
# resolved through CSS variables at build/runtime -> a component never sees a hex.
components = {
    "button": {
        "primary": {
            "background": "{primary}", "backgroundHover": "{primaryHover}",
            "backgroundPressed": "{primaryActive}", "backgroundDisabled": "{textDisabled}",
            "text": "{onPrimary}", "border": "transparent", "radius": "{radius.sm}",
            "shadow": "{shadow.xs}",
        },
        "secondary": {
            "background": "{secondary}", "backgroundHover": "{secondaryHover}",
            "backgroundPressed": "{border}", "backgroundDisabled": "{surfaceHover}",
            "text": "{onSecondary}", "border": "{border}", "radius": "{radius.sm}",
        },
        "outline": {
            "background": "transparent", "backgroundHover": "{primarySurface}",
            "text": "{primary}", "border": "{primary}", "radius": "{radius.sm}",
        },
        "danger": {
            "background": "{danger}", "backgroundHover": "{danger}", "text": "{onPrimary}",
            "border": "transparent", "radius": "{radius.sm}",
        },
    },
    "card": {
        "background": "{surface}", "backgroundHover": "{surfaceHover}",
        "border": "{border}", "radius": "{radius.md}", "shadow": "{shadow.sm}",
        "shadowHover": "{shadow.md}",
    },
    "input": {
        "background": "{surface}", "border": "{border}", "borderHover": "{borderHover}",
        "borderFocus": "{borderFocus}", "borderError": "{danger}",
        "text": "{textBody}", "placeholder": "{textMuted}", "radius": "{radius.sm}",
    },
    "badge": {
        "primary": {"background": "{primarySurface}", "text": "{primary}"},
        "neutral": {"background": "{secondarySurface}", "text": "{textMuted}"},
        "success": {"background": "{successSurface}", "text": "{success}"},
        "warning": {"background": "{warningSurface}", "text": "{warning}"},
        "danger":  {"background": "{dangerSurface}",  "text": "{danger}"},
        "info":    {"background": "{infoSurface}",    "text": "{info}"},
        "radius": "{radius.full}",
    },
    "chip": {
        "background": "{surfaceHover}", "backgroundSelected": "{primarySoft}",
        "text": "{textBody}", "textSelected": "{primary}", "radius": "{radius.full}",
    },
    "tabs": {
        "text": "{textMuted}", "textActive": "{primary}",
        "indicator": "{primary}", "border": "{border}",
    },
    "modal": {
        "background": "{surface}", "overlay": "rgba(0,0,0,{opacity.overlay})",
        "radius": "{radius.lg}", "shadow": "{shadow.xl}", "border": "{border}",
    },
    "toast": {
        "background": "{surfaceElevated}", "border": "{border}", "shadow": "{shadow.lg}",
        "radius": "{radius.md}",
        "success": {"border": "{success}"}, "danger": {"border": "{danger}"},
    },
    "skeleton": {"background": "{surfaceHover}", "shimmer": "{surfaceActive}"},
    "header": {"background": "{surface}", "border": "{border}", "text": "{textTitle}"},
    "footer": {"background": "{background}", "border": "{border}", "text": "{textMuted}"},
    "filterPill": {
        "background": "{surface}", "backgroundActive": "{primary}",
        "text": "{textBody}", "textActive": "{onPrimary}", "border": "{border}",
        "radius": "{radius.full}",
    },
    "progressBar": {"track": "{surfaceHover}", "fill": "{primary}", "radius": "{radius.full}"},
}

with open("/home/claude/convitin-design-system/tokens/components.json", "w") as f:
    json.dump(components, f, indent=2, ensure_ascii=False)

print("semantic + components written")
