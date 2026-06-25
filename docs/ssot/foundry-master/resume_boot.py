#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
resume_boot.py — BarberKas-Foundry session resume (FM-04)
=========================================================
Zero-dependency, READ-ONLY, Truth-Lock session resumer. Run at the start of any
session to instantly re-orient: git state, latest handoff, SSOT map, product
status (from README). Never modifies the repo, never calls paid APIs, never
reads secrets.

Doctrine: MASTER-ARCHITECT-PROMPT v8.0 (FM-01) · D-1 Truth-Lock · credit-aware
Owner: Reza Estes / Haidar Faras — Sovereign AI Dev (Purwokerto)

Usage:
    python3 docs/ssot/foundry-master/resume_boot.py          # human-readable
    python3 docs/ssot/foundry-master/resume_boot.py --json    # machine/agent inject
"""
import json
import os
import re
import subprocess
import sys

# ---- locate repo root (this file lives in docs/ssot/foundry-master/) ----
THIS = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(THIS, "..", "..", ".."))
HANDOFFS_DIR = os.path.join(THIS, "handoffs")

HARD_CONSTRAINTS = [
    "100% genspark.ai/ai_developer + Cloudflare Workers/Pages (zero VPS/AWS/GCP/Azure)",
    "Niche-first: barbershop UMKM Purwokerto -> Banyumas -> Jateng -> Indonesia",
    "Horizontal-play (blueprint replicable: KuratorKas/PaceLokal)",
    "D-1 Truth-Lock (maksimum jujur; verifikasi sebelum klaim)",
    "MoR = Oasis BI Pro (Duitku Pop LIVE, merchant D20919)",
    "OVERRIDE-CLOSE-OUT (scope locked -> eksekusi langsung, kecuali GATE HITL)",
]

WAJIB_ORDER = [
    "TRUTH-LOCK: nyatakan yang belum diketahui; jangan mengarang status",
    "RESUME: jalankan script ini / baca handoff terakhir",
    "PLAN: tulis SPRINT-KAS (FM-03) + anggaran kredit",
    "EXECUTE: kerjakan sesuai scope (tambah, jangan hancurkan)",
    "VERIFY: build/test nyata (bukti, bukan klaim)",
    "HANDOFF: tulis FM-02 handoff baru di akhir sesi",
]

HITL_GATES = ["payment/Duitku/MoR", "legal/garansi", "secrets/credential",
              "custom domain/DNS", "harga publik", "migrasi D1 destruktif"]


def _git(args):
    """Run a git command read-only; return stripped stdout or '' on failure."""
    try:
        out = subprocess.run(
            ["git", "-C", REPO_ROOT] + args,
            capture_output=True, text=True, timeout=15,
        )
        return out.stdout.strip()
    except Exception:
        return ""


def collect_git():
    branch = _git(["rev-parse", "--abbrev-ref", "HEAD"]) or "unknown"
    last = _git(["log", "-1", "--pretty=%h %s"]) or "(no commits)"
    recent = _git(["log", "-5", "--pretty=%h %s"]).splitlines()
    status = _git(["status", "--porcelain"]).splitlines()
    return {
        "branch": branch,
        "last_commit": last,
        "recent_commits": recent,
        "uncommitted_files": len([s for s in status if s.strip()]),
        "uncommitted_sample": [s.strip() for s in status[:10] if s.strip()],
    }


def latest_handoff():
    if not os.path.isdir(HANDOFFS_DIR):
        return None
    files = [f for f in os.listdir(HANDOFFS_DIR)
             if f.upper().startswith("HANDOFF-") and f.endswith(".md")]
    if not files:
        return None
    files.sort()
    latest = files[-1]
    path = os.path.join(HANDOFFS_DIR, latest)
    try:
        with open(path, "r", encoding="utf-8") as fh:
            content = fh.read()
    except Exception:
        content = ""
    # extract NEXT STEP section if present
    next_step = ""
    m = re.search(r"##\s*7\.\s*NEXT STEP.*?\n(.*?)(\n##\s|\Z)", content, re.S | re.I)
    if m:
        next_step = m.group(1).strip()
    return {"file": latest, "path": os.path.relpath(path, REPO_ROOT),
            "next_step": next_step, "chars": len(content)}


def ssot_map():
    ssot_dir = os.path.join(REPO_ROOT, "docs", "ssot")
    groups = {"foundry-master (FM)": [], "Batch 4 (reposition)": [],
              "Batch 5 (Outcome Foundry)": [], "R6 (standar/spec)": [], "lain": []}
    if not os.path.isdir(ssot_dir):
        return groups
    for root, _dirs, files in os.walk(ssot_dir):
        for f in sorted(files):
            if not f.endswith(".md"):
                continue
            rel = os.path.relpath(os.path.join(root, f), REPO_ROOT)
            if f.startswith("FM-"):
                groups["foundry-master (FM)"].append(rel)
            elif f.startswith("B4-"):
                groups["Batch 4 (reposition)"].append(rel)
            elif f.startswith("B5-"):
                groups["Batch 5 (Outcome Foundry)"].append(rel)
            elif f.startswith("R6-") or "SKILL-AUTHORING" in f:
                groups["R6 (standar/spec)"].append(rel)
            else:
                groups["lain"].append(rel)
    return groups


def product_status():
    """Read product facts ONLY from README (Truth-Lock: no guessing)."""
    readme = os.path.join(REPO_ROOT, "README.md")
    facts = {}
    if not os.path.isfile(readme):
        return {"note": "README.md not found — cek manual"}
    try:
        with open(readme, "r", encoding="utf-8") as fh:
            txt = fh.read()
    except Exception:
        return {"note": "README unreadable — cek manual"}
    for label, pat in [
        ("production_url", r"Production URL\**:?\s*\**\s*(https?://\S+)"),
        ("github", r"GitHub\**:?\s*\**\s*(https?://\S+)"),
        ("payment", r"Payment\**:?\s*\**\s*([^\n]+)"),
    ]:
        m = re.search(pat, txt, re.I)
        if m:
            facts[label] = m.group(1).strip().rstrip("*").strip()
    if not facts:
        facts["note"] = "tidak ada fakta produk terbaca di README — cek manual"
    return facts


def find_skill():
    skill = os.path.join(REPO_ROOT, "skills",
                         "sovereign-barberkas-foundry-context-injection", "SKILL.md")
    return os.path.relpath(skill, REPO_ROOT) if os.path.isfile(skill) else None


def build_report():
    return {
        "repo_root": REPO_ROOT,
        "git": collect_git(),
        "latest_handoff": latest_handoff(),
        "ssot_map": ssot_map(),
        "product_status": product_status(),
        "context_injection_skill": find_skill(),
        "hard_constraints": HARD_CONSTRAINTS,
        "urutan_wajib": WAJIB_ORDER,
        "hitl_gates": HITL_GATES,
    }


def print_human(r):
    line = "=" * 64
    print(line)
    print(" BARBERKAS-FOUNDRY · RESUME-BOOT (FM-04) · D-1 Truth-Lock")
    print(line)
    g = r["git"]
    print(f"\n[REPO]   {os.path.basename(r['repo_root'])}  (branch: {g['branch']})")
    print(f"         last: {g['last_commit']}")
    print(f"         uncommitted files: {g['uncommitted_files']}")
    if g["uncommitted_sample"]:
        for s in g["uncommitted_sample"]:
            print(f"           - {s}")
    print("\n[RECENT COMMITS]")
    for c in g["recent_commits"]:
        print(f"   {c}")

    h = r["latest_handoff"]
    print("\n[HANDOFF TERAKHIR]")
    if h:
        print(f"   file: {h['path']}")
        if h["next_step"]:
            print("   NEXT STEP:")
            for ln in h["next_step"].splitlines():
                print(f"     {ln}")
    else:
        print("   (belum ada handoff — sesi pertama / mulai bersih)")

    print("\n[PETA SSOT]")
    for grp, files in r["ssot_map"].items():
        if files:
            print(f"   {grp}:")
            for f in files:
                print(f"     - {f}")

    print("\n[STATUS PRODUK] (fakta dari README)")
    for k, v in r["product_status"].items():
        print(f"   {k}: {v}")

    print("\n[SKILL CONTEXT-INJECTION]")
    print(f"   {r['context_injection_skill'] or '(belum ada)'}")

    print("\n[HARD CONSTRAINTS]")
    for i, c in enumerate(r["hard_constraints"], 1):
        print(f"   {i}. {c}")

    print("\n[URUTAN WAJIB]")
    for i, c in enumerate(r["urutan_wajib"], 1):
        print(f"   {i}. {c}")

    print("\n[GATE HITL — minta izin owner sebelum]")
    print("   " + " · ".join(r["hitl_gates"]))
    print("\n" + line)
    print(" NEXT: tulis SPRINT-KAS (FM-03), eksekusi, lalu HANDOFF (FM-02).")
    print(line)


def main():
    report = build_report()
    if "--json" in sys.argv:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        print_human(report)


if __name__ == "__main__":
    main()
