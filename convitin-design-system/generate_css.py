import json, re

base = "/home/claude/convitin-design-system"
foundations = json.load(open(f"{base}/tokens/foundations.json"))
themes = json.load(open(f"{base}/tokens/themes.json"))
semantic = json.load(open(f"{base}/tokens/semantic.json"))

def kebab(s):
    return re.sub(r'(?<!^)(?=[A-Z])', '-', s).lower()

lines = []
lines.append("/* ============================================================")
lines.append("   Convitin Design Language (CDL) — Design Tokens")
lines.append("   Gerado automaticamente. Não edite os valores manualmente:")
lines.append("   edite tokens/*.json e regenere.")
lines.append("   ============================================================ */\n")

# ---- Global foundations (theme-agnostic) ----
lines.append(":root {")
for k, v in foundations["radius"].items():
    lines.append(f"  --radius-{kebab(k)}: {v};")
for k, v in foundations["shadow"].items():
    lines.append(f"  --shadow-{kebab(k)}: {v};")
for k, v in foundations["spacing"].items():
    lines.append(f"  --spacing-{k}: {v};")
for k, v in foundations["opacity"].items():
    lines.append(f"  --opacity-{kebab(k)}: {v};")
for name, fb in foundations["feedback"].items():
    for step, val in fb.items():
        lines.append(f"  --feedback-{name}-{kebab(step)}: {val};")
lines.append("}\n")

# ---- Per-theme blocks ----
for slug, theme in themes.items():
    selector = ":root, [data-theme='%s']" % slug if slug == "base-azul-minimal" else "[data-theme='%s']" % slug
    lines.append(f"/* {theme['label']} ({theme['mode']} mode) */")
    lines.append(f"{selector} {{")
    lines.append(f"  color-scheme: {theme['mode']};")
    for step, val in theme["scale"].items():
        lines.append(f"  --accent-{step}: {val};")
    for tk, tv in semantic[slug]["tokens"].items():
        lines.append(f"  --{kebab(tk)}: {tv};")
    lines.append("}\n")

with open(f"{base}/css/tokens.css", "w") as f:
    f.write("\n".join(lines))

print("css written, lines:", len(lines))
