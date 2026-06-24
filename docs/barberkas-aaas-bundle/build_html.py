#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_html.py — BARBERKAS-AaaS Master Bundle HTML compiler
============================================================
Compiles the canonical Markdown docs (README + MANIFEST + 01..11) into a single
self-contained, dark steel-blue HTML file: BARBERKAS-AaaS-MASTER-BUNDLE-v1.0.html

Doctrine: MASTER-ARCHITECT-PROMPT v8.0 · D-1 Truth-Lock · Outcome-Foundry-aligned (v1.1)
Owner: Reza Estes / Haidar Faras — Sovereign AI Dev

Usage:
    pip3 install --user markdown   # optional but recommended (better rendering)
    python3 build_html.py

If the `markdown` library is not installed, a minimal built-in fallback renderer
is used so the build never hard-fails (credit-aware: zero external deps required).
"""
import os
import re
import sys
import html as _html

HERE = os.path.dirname(os.path.abspath(__file__))
OUTPUT = os.path.join(HERE, "BARBERKAS-AaaS-MASTER-BUNDLE-v1.0.html")

# Ordered bundle manifest: (filename, anchor-id, TOC label)
DOCS = [
    ("README.md", "readme", "\U0001F4CB README"),
    ("MANIFEST.md", "manifest", "\U0001F4E6 MANIFEST"),
    ("01-BARBERKAS-AaaS-STRATEGIC-BRIEF-v1.0.md", "01-barberkas-aaas-strategic-brief-v1-0", "\u00A71 Strategic Brief"),
    ("02-BARBERKAS-AaaS-SECRET-DOCTRINE-v1.0.md", "02-barberkas-aaas-secret-doctrine-v1-0", "\u00A72 Secret Doctrine"),
    ("03-BARBERKAS-AaaS-MONETIZATION-MATRIX-v1.0.md", "03-barberkas-aaas-monetization-matrix-v1-0", "\u00A73 Monetization Matrix"),
    ("04-BARBERKAS-AaaS-MASTER-ARCHITECT-v1.0.md", "04-barberkas-aaas-master-architect-v1-0", "\u00A74 Master Architect"),
    ("05-BARBERKAS-AaaS-SPRINT-PLAN-v1.0.md", "05-barberkas-aaas-sprint-plan-v1-0", "\u00A75 Sprint Plan"),
    ("06-BARBERKAS-AaaS-EXECUTE-PLAYBOOK-v1.0.md", "06-barberkas-aaas-execute-playbook-v1-0", "\u00A76 Execute Playbook"),
    ("07-BARBERKAS-AaaS-AGENT-PRD-v1.0.md", "07-barberkas-aaas-agent-prd-v1-0", "\u00A77 Agent PRD"),
    ("08-BARBERKAS-AaaS-DESIGN-SYSTEM-v1.0.md", "08-barberkas-aaas-design-system-v1-0", "\u00A78 Design System"),
    ("09-BARBERKAS-AaaS-TODO-CHECKLIST-v1.0.md", "09-barberkas-aaas-todo-checklist-v1-0", "\u00A79 TODO Checklist"),
    ("10-BARBERKAS-AaaS-DR-ADDENDUM-v1.0.md", "10-barberkas-aaas-dr-addendum-v1-0", "\u00A710 Deep Research Addendum"),
    ("11-BARBERKAS-AaaS-CROSS-BRAND-MAP-v1.0.md", "11-barberkas-aaas-cross-brand-map-v1-0", "\u00A711 Cross-Brand Map"),
]

CSS = r"""
:root {
  --bg-primary: #0A0F1A;
  --bg-surface: #131A29;
  --bg-elevated: #1E2638;
  --bg-input: #0F1623;
  --border-subtle: #1F2937;
  --border-strong: #2E3B4F;
  --border-focus: #4A90E2;
  --text-primary: #E8EEF7;
  --text-secondary: #A6B3C5;
  --text-muted: #6B7B92;
  --accent: #4A90E2;
  --accent-bright: #6BA6F0;
  --accent-dim: #2E6FC4;
  --accent-bg: #0E1B30;
  --chrome: #94A3B8;
  --chrome-dim: #475569;
  --success: #22C55E;
  --warning: #F59E0B;
  --danger: #EF4444;
  --code-bg: #0B1118;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
@page { size: A4; margin: 14mm; }
html, body {
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  line-height: 1.65;
  font-size: 15px;
  -webkit-font-smoothing: antialiased;
}
.container {
  max-width: 980px;
  margin: 0 auto;
  padding: 48px 32px 96px;
}
header.cover {
  border: 1px solid var(--border-strong);
  background: linear-gradient(135deg, var(--bg-surface), var(--bg-elevated));
  border-radius: 16px;
  padding: 48px 40px;
  margin-bottom: 48px;
  box-shadow: 0 0 32px rgba(74, 144, 226, 0.08);
}
header.cover h1 {
  font-size: 2.5rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--accent);
  margin-bottom: 8px;
}
header.cover .subtitle {
  font-size: 1.125rem;
  color: var(--text-secondary);
  margin-bottom: 24px;
}
header.cover .meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  font-size: 0.875rem;
  color: var(--text-muted);
}
header.cover .meta strong { color: var(--chrome); }
nav.toc {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 24px 28px;
  margin-bottom: 48px;
}
nav.toc h2 {
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--accent);
  margin-bottom: 16px;
}
nav.toc ol { list-style: none; padding: 0; counter-reset: toc; }
nav.toc ol li {
  counter-increment: toc;
  padding: 6px 0;
  border-bottom: 1px solid var(--border-subtle);
}
nav.toc ol li:last-child { border-bottom: none; }
nav.toc ol li::before {
  content: counter(toc, decimal-leading-zero);
  color: var(--chrome-dim);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  margin-right: 12px;
}
nav.toc a {
  color: var(--text-primary);
  text-decoration: none;
  font-weight: 500;
}
nav.toc a:hover { color: var(--accent-bright); }
section.doc {
  margin-bottom: 64px;
  padding-bottom: 48px;
  border-bottom: 1px solid var(--border-subtle);
}
section.doc:last-of-type { border-bottom: none; }
section.doc > .doc-marker {
  display: inline-block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  color: var(--accent);
  background: var(--accent-bg);
  padding: 4px 12px;
  border-radius: 4px;
  margin-bottom: 16px;
  letter-spacing: 0.05em;
}
h1, h2, h3, h4, h5, h6 {
  font-weight: 700;
  line-height: 1.25;
  margin-top: 1.8em;
  margin-bottom: 0.6em;
  color: var(--text-primary);
}
h1 {
  font-size: 2rem;
  color: var(--accent);
  border-bottom: 2px solid var(--accent);
  padding-bottom: 0.4em;
}
h2 {
  font-size: 1.5rem;
  color: var(--accent-bright);
  padding-bottom: 0.3em;
  border-bottom: 1px solid var(--border-subtle);
}
h3 { font-size: 1.25rem; color: var(--chrome); }
h4 { font-size: 1.1rem; color: var(--text-secondary); }
p { margin: 0.85em 0; color: var(--text-primary); }
strong { color: var(--accent-bright); font-weight: 600; }
em { color: var(--chrome); font-style: italic; }
a { color: var(--accent); text-decoration: none; border-bottom: 1px dashed var(--accent-dim); }
a:hover { color: var(--accent-bright); border-bottom-style: solid; }
ul, ol { margin: 0.8em 0 0.8em 1.5em; }
li { margin: 0.3em 0; }
ul li::marker { color: var(--accent); }
ol li::marker { color: var(--chrome); }
blockquote {
  border-left: 3px solid var(--accent);
  background: var(--bg-surface);
  padding: 12px 20px;
  margin: 1em 0;
  color: var(--text-secondary);
  border-radius: 0 8px 8px 0;
}
code {
  background: var(--code-bg);
  color: var(--accent-bright);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.85em;
  border: 1px solid var(--border-subtle);
}
pre {
  background: var(--code-bg);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 16px 20px;
  margin: 1em 0;
  overflow-x: auto;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.85em;
  line-height: 1.55;
  color: var(--text-primary);
}
pre code {
  background: transparent;
  border: none;
  padding: 0;
  color: var(--text-primary);
}
table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.2em 0;
  font-size: 0.9em;
  background: var(--bg-surface);
  border: 1px solid var(--border-strong);
  border-radius: 8px;
  overflow: hidden;
}
th {
  background: var(--bg-elevated);
  color: var(--accent);
  font-weight: 600;
  text-align: left;
  padding: 10px 14px;
  border-bottom: 2px solid var(--accent-dim);
  text-transform: uppercase;
  font-size: 0.78em;
  letter-spacing: 0.05em;
}
td {
  padding: 9px 14px;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-primary);
  vertical-align: top;
}
tr:last-child td { border-bottom: none; }
tr:hover td { background: rgba(74, 144, 226, 0.04); }
hr {
  border: none;
  border-top: 1px solid var(--border-strong);
  margin: 2em 0;
}
.badge {
  display: inline-block;
  padding: 2px 8px;
  font-size: 0.72em;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}
.badge-locked { background: var(--accent-bg); color: var(--accent); border: 1px solid var(--accent-dim); }
footer {
  margin-top: 64px;
  padding-top: 32px;
  border-top: 1px solid var(--border-strong);
  text-align: center;
  color: var(--text-muted);
  font-size: 0.85em;
}
footer .signature {
  color: var(--accent);
  font-family: 'JetBrains Mono', monospace;
  margin-top: 8px;
}
@media print {
  body { font-size: 11pt; }
  .container { padding: 0; }
  section.doc { page-break-before: always; }
  nav.toc { page-break-after: always; }
  header.cover { box-shadow: none; }
}
@media (max-width: 720px) {
  .container { padding: 24px 16px 64px; }
  header.cover { padding: 28px 20px; }
  header.cover h1 { font-size: 1.75rem; }
  header.cover .meta { grid-template-columns: 1fr; }
  table { font-size: 0.8em; }
  th, td { padding: 8px 10px; }
}

"""


def render_markdown(text):
    """Render markdown -> HTML. Prefer python-markdown; fall back to a minimal renderer."""
    try:
        import markdown  # type: ignore
        return markdown.markdown(
            text,
            extensions=["tables", "fenced_code", "toc", "sane_lists", "nl2br"],
        )
    except Exception:
        return _fallback_markdown(text)


def _fallback_markdown(text):
    """Tiny dependency-free markdown renderer (headings, tables, code, lists, bold/italic/code)."""
    lines = text.split("\n")
    out = []
    i = 0
    n = len(lines)

    def inline(s):
        s = _html.escape(s)
        s = re.sub(r"`([^`]+)`", r"<code>\1</code>", s)
        s = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", s)
        s = re.sub(r"(?<!\*)\*([^*]+)\*(?!\*)", r"<em>\1</em>", s)
        s = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2">\1</a>', s)
        return s

    while i < n:
        line = lines[i]
        # fenced code
        if line.strip().startswith("```"):
            i += 1
            buf = []
            while i < n and not lines[i].strip().startswith("```"):
                buf.append(_html.escape(lines[i]))
                i += 1
            i += 1
            out.append("<pre><code>" + "\n".join(buf) + "</code></pre>")
            continue
        # table
        if "|" in line and i + 1 < n and re.match(r"^\s*\|?[\s:|-]+\|?\s*$", lines[i + 1]):
            header = [c.strip() for c in line.strip().strip("|").split("|")]
            i += 2
            rows = []
            while i < n and "|" in lines[i]:
                rows.append([c.strip() for c in lines[i].strip().strip("|").split("|")])
                i += 1
            t = ["<table><thead><tr>"]
            t += ["<th>" + inline(h) + "</th>" for h in header]
            t.append("</tr></thead><tbody>")
            for r in rows:
                t.append("<tr>" + "".join("<td>" + inline(c) + "</td>" for c in r) + "</tr>")
            t.append("</tbody></table>")
            out.append("".join(t))
            continue
        # heading
        m = re.match(r"^(#{1,6})\s+(.*)$", line)
        if m:
            lvl = len(m.group(1))
            out.append("<h%d>%s</h%d>" % (lvl, inline(m.group(2)), lvl))
            i += 1
            continue
        # hr
        if re.match(r"^(\-{3,}|={3,}|\u2550{3,})\s*$", line):
            out.append("<hr />")
            i += 1
            continue
        # blockquote
        if line.startswith(">"):
            buf = []
            while i < n and lines[i].startswith(">"):
                buf.append(inline(lines[i].lstrip(">").strip()))
                i += 1
            out.append("<blockquote>" + "<br>".join(buf) + "</blockquote>")
            continue
        # unordered list
        if re.match(r"^\s*[-*+]\s+", line):
            buf = []
            while i < n and re.match(r"^\s*[-*+]\s+", lines[i]):
                buf.append("<li>" + inline(re.sub(r"^\s*[-*+]\s+", "", lines[i])) + "</li>")
                i += 1
            out.append("<ul>" + "".join(buf) + "</ul>")
            continue
        # ordered list
        if re.match(r"^\s*\d+\.\s+", line):
            buf = []
            while i < n and re.match(r"^\s*\d+\.\s+", lines[i]):
                buf.append("<li>" + inline(re.sub(r"^\s*\d+\.\s+", "", lines[i])) + "</li>")
                i += 1
            out.append("<ol>" + "".join(buf) + "</ol>")
            continue
        # blank
        if line.strip() == "":
            i += 1
            continue
        # paragraph
        buf = [line]
        i += 1
        while i < n and lines[i].strip() != "" and not re.match(r"^(#{1,6}\s|>|```|\s*[-*+]\s|\s*\d+\.\s)", lines[i]):
            buf.append(lines[i])
            i += 1
        out.append("<p>" + inline(" ".join(buf)) + "</p>")
    return "\n".join(out)


def build():
    sections = []
    toc = []
    missing = []
    for fname, anchor, label in DOCS:
        path = os.path.join(HERE, fname)
        toc.append('<li><a href="#%s">%s</a></li>' % (anchor, label))
        if not os.path.exists(path):
            missing.append(fname)
            sections.append(
                '<section class="doc" id="%s"><span class="doc-marker">%s</span>'
                '<p><em>(file missing at build time)</em></p></section>' % (anchor, fname)
            )
            continue
        with open(path, "r", encoding="utf-8") as fh:
            md = fh.read()
        body = render_markdown(md)
        sections.append(
            '<section class="doc" id="%s">\n  <span class="doc-marker">%s</span>\n%s\n</section>'
            % (anchor, fname, body)
        )

    toc_html = "\n".join(toc)
    sections_html = "\n\n".join(sections)

    doc = """<!DOCTYPE html>
<html lang="id" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>BarberKas AaaS Master Bundle v1.0 \u2014 SparkMind Sovereign</title>
<meta name="description" content="BarberKas AaaS Master Bundle v1.0 \u2014 Barbershop Agent-as-a-Service for Indonesia, Cloudflare-native, Sovereign Doctrine, Outcome-Foundry-aligned.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
{css}
</style>
</head>
<body>
<div class="container">

<header class="cover">
  <h1>\U0001F531 BarberKas AaaS \u2014 Master Bundle v1.0</h1>
  <p class="subtitle">Barbershop Agent-as-a-Service \u00B7 Sovereign Doctrine \u00B7 Cloudflare-Native \u00B7 Outcome-Foundry-Aligned</p>
  <div class="meta">
    <div><strong>Bundle ID</strong><br><code>BARBERKAS-AaaS-MASTER-BUNDLE-v1.0</code></div>
    <div><strong>Owner</strong><br>Reza Estes / Haidar Faras \u2014 Sovereign AI Dev</div>
    <div><strong>Date</strong><br>2026-06-05 \u00B7 Upgraded 2026-06-23</div>
    <div><strong>Doctrine</strong><br>MASTER-ARCHITECT-PROMPT v5.0 + v7.0 + v8.0</div>
    <div><strong>Status</strong><br><span class="badge badge-locked">CANONICAL \u00B7 OUTCOME-FOUNDRY-ALIGNED</span></div>
    <div><strong>Alignment</strong><br>SSOT Batch 4 + Batch 5 (Outcome Foundry / OaaS)</div>
  </div>
</header>

<nav class="toc">
  <h2>\U0001F4DA Table of Contents</h2>
  <ol>
{toc}
  </ol>
</nav>

{sections}

<footer>
  <p>BARBERKAS-AaaS-MASTER-BUNDLE-v1.0 \u00B7 SparkMind Sovereign Ecosystem \u00B7 D-1 Truth-Lock</p>
  <p class="signature">// Reza Estes / Haidar Faras \u2014 Sovereign AI Dev \u00B7 Purwokerto</p>
</footer>

</div>
</body>
</html>
""".format(css=CSS, toc=toc_html, sections=sections_html)

    with open(OUTPUT, "w", encoding="utf-8") as fh:
        fh.write(doc)

    print("[build_html] Wrote: %s (%d bytes)" % (OUTPUT, len(doc.encode("utf-8"))))
    if missing:
        print("[build_html] WARNING missing files: %s" % ", ".join(missing))
    else:
        print("[build_html] All %d sections compiled OK." % len(DOCS))


if __name__ == "__main__":
    build()
