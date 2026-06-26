#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
resume_boot.py — BarberKas-Foundry session resume (FM-04)
=========================================================
Zero-dependency, READ-ONLY by default, Truth-Lock session resumer. Run at the
start of any session to instantly re-orient: git state, latest handoff, SSOT
map, product status (from README), available backups, and (opt-in) production
health. Never modifies the repo on default run, never calls paid APIs, never
reads secrets.

Doctrine: MASTER-ARCHITECT-PROMPT v8.0 (FM-01) · D-1 Truth-Lock · credit-aware
Owner: Reza Estes / Haidar Faras — Sovereign AI Dev (Purwokerto)

Usage:
    python3 docs/ssot/foundry-master/resume_boot.py            # human-readable
    python3 docs/ssot/foundry-master/resume_boot.py --json     # machine/agent inject
    python3 docs/ssot/foundry-master/resume_boot.py --boot     # 1-line master boot prompt
    python3 docs/ssot/foundry-master/resume_boot.py --health   # opt-in: ping production URL
    python3 docs/ssot/foundry-master/resume_boot.py --list-backups          # show known backups
    python3 docs/ssot/foundry-master/resume_boot.py --restore-from <tar.gz> # restore from backup (WRITES)

Notes (Truth-Lock / credit-aware):
- Default run = read-only, no network, no paid API.
- --health does ONE free HTTP GET (stdlib urllib) to the README Production URL
  /health endpoint. Network-only; never touches secrets or payment.
- --restore-from is the ONLY mode that writes to disk; it requires an explicit
  path and prints exactly what it will extract before doing so.
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

# Directories scanned for ProjectBackup tar.gz artifacts (read-only discovery).
BACKUP_SEARCH_DIRS = [
    REPO_ROOT,
    os.path.join(REPO_ROOT, "backups"),
    os.path.expanduser("~"),
    "/home/user",
    "/mnt/aidrive",
]


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


# ════════════════════════════════════════════════════════════════════════════
# NEW (FM-04 v2): backups discovery, production health, master boot, restore
# ════════════════════════════════════════════════════════════════════════════

def find_backups():
    """Discover ProjectBackup tar.gz artifacts (read-only, shallow scan).

    Truth-Lock: only reports files it can actually stat. Looks for archives whose
    name hints at this project (barberkas / foundry / bkf) OR any *.tar.gz in the
    repo-local ./backups dir. Shallow scan only (credit/time-aware): never walks
    deep trees like /mnt/aidrive.
    """
    seen = {}
    hint = re.compile(r"(barberkas|foundry|bkf)", re.I)
    for d in BACKUP_SEARCH_DIRS:
        if not os.path.isdir(d):
            continue
        is_backups_dir = os.path.basename(os.path.normpath(d)) == "backups"
        try:
            entries = os.listdir(d)
        except Exception:
            continue
        for name in entries:
            if not (name.endswith(".tar.gz") or name.endswith(".tgz")):
                continue
            if not (is_backups_dir or hint.search(name)):
                continue
            full = os.path.join(d, name)
            try:
                st = os.stat(full)
            except Exception:
                continue
            # de-dup by realpath
            key = os.path.realpath(full)
            if key in seen:
                continue
            seen[key] = {
                "path": full,
                "size_bytes": st.st_size,
                "mtime": int(st.st_mtime),
            }
    backups = sorted(seen.values(), key=lambda b: b["mtime"], reverse=True)
    return backups


def production_health(do_network=False, timeout=8):
    """OPT-IN production health check. Returns a dict; only hits network if asked.

    Truth-Lock + credit-aware: by default returns {checked: False} and does NOTHING.
    When --health is passed, performs ONE free stdlib HTTP GET to <production_url>/health.
    Never reads secrets, never calls paid APIs.
    """
    url = (product_status() or {}).get("production_url", "")
    result = {"checked": False, "url": url, "endpoint": None,
              "status": None, "ok": None, "body_snippet": None, "error": None}
    if not do_network:
        result["note"] = "skip (default). pakai --health untuk cek (1 GET gratis)."
        return result
    if not url:
        result["error"] = "production_url tidak terbaca di README"
        return result
    endpoint = url.rstrip("/") + "/health"
    result["endpoint"] = endpoint
    result["checked"] = True
    try:
        import urllib.request
        req = urllib.request.Request(endpoint, headers={"User-Agent": "resume_boot/2.0"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            code = resp.getcode()
            body = resp.read(512).decode("utf-8", "replace")
            result["status"] = code
            result["ok"] = 200 <= code < 400
            result["body_snippet"] = body.strip()[:300]
    except Exception as e:  # noqa: BLE001 — report any failure honestly
        result["ok"] = False
        result["error"] = f"{type(e).__name__}: {e}"
    return result


def master_boot_prompt(r):
    """Return a single-line master boot prompt to paste at the start of a session."""
    h = r.get("latest_handoff") or {}
    handoff = h.get("path", "(none)")
    prod = (r.get("product_status") or {}).get("production_url", "(unknown)")
    return (
        "BOOT BarberKas-Foundry (FM-01 v8.0 · D-1 Truth-Lock · OVERRIDE-CLOSE-OUT): "
        f"repo=Sparkmind-obp-off/Barberkas-foundry@main; prod={prod}; "
        f"baca handoff terakhir {handoff}; "
        "jalankan `python3 docs/ssot/foundry-master/resume_boot.py --json` sebagai kebenaran; "
        "patuhi 6 hard-constraint; GATE HITL=payment/legal/secret/domain/harga/D1-destruktif; "
        "tulis SPRINT-KAS (FM-03) sebelum eksekusi; tutup sesi dengan HANDOFF (FM-02) + backup tar.gz."
    )


def restore_from_backup(tarball, dest=None, dry_run=False):
    """Restore repo state from a ProjectBackup tar.gz. THE ONLY WRITE PATH.

    Prints exactly what it will extract first. Safe-extracts (rejects absolute
    paths / .. traversal). Default dest = parent of REPO_ROOT (ProjectBackup
    archives preserve the absolute project dir layout).
    """
    import tarfile
    if not os.path.isfile(tarball):
        return {"ok": False, "error": f"file tidak ditemukan: {tarball}"}
    dest = dest or os.path.dirname(REPO_ROOT)
    info = {"tarball": tarball, "dest": dest, "dry_run": dry_run, "members": []}
    try:
        with tarfile.open(tarball, "r:gz") as tf:
            members = tf.getmembers()
            # safety: reject unsafe paths
            for m in members:
                name = m.name
                if name.startswith("/") or ".." in name.split("/"):
                    return {"ok": False, "error": f"member tidak aman ditolak: {name}"}
            info["members"] = [m.name for m in members[:20]]
            info["member_count"] = len(members)
            if dry_run:
                info["ok"] = True
                info["note"] = "dry-run: tidak ada yang diekstrak"
                return info
            tf.extractall(path=dest)
        info["ok"] = True
        info["note"] = f"restore selesai → {dest}"
    except Exception as e:  # noqa: BLE001
        return {"ok": False, "error": f"{type(e).__name__}: {e}"}
    return info


def build_report(health=False):
    return {
        "repo_root": REPO_ROOT,
        "git": collect_git(),
        "latest_handoff": latest_handoff(),
        "ssot_map": ssot_map(),
        "product_status": product_status(),
        "context_injection_skill": find_skill(),
        "backups": find_backups(),
        "production_health": production_health(do_network=health),
        "hard_constraints": HARD_CONSTRAINTS,
        "urutan_wajib": WAJIB_ORDER,
        "hitl_gates": HITL_GATES,
    }


def _human_size(n):
    units = ["B", "KB", "MB", "GB"]
    f = float(n)
    for u in units:
        if f < 1024 or u == "GB":
            return f"{f:.1f}{u}"
        f /= 1024
    return f"{n}B"


def print_human(r):
    import datetime
    line = "=" * 64
    print(line)
    print(" BARBERKAS-FOUNDRY · RESUME-BOOT (FM-04 v2) · D-1 Truth-Lock")
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

    print("\n[BACKUP TERSEDIA] (restore, jangan rebuild)")
    backups = r.get("backups") or []
    if backups:
        for b in backups[:8]:
            ts = datetime.datetime.fromtimestamp(b["mtime"]).strftime("%Y-%m-%d %H:%M")
            print(f"   - {b['path']}  ({_human_size(b['size_bytes'])}, {ts})")
        print("   → restore: python3 docs/ssot/foundry-master/resume_boot.py --restore-from <path>")
    else:
        print("   (tidak ada tar.gz terdeteksi — buat via ProjectBackup di akhir sesi)")

    ph = r.get("production_health") or {}
    print("\n[PRODUCTION HEALTH]")
    if not ph.get("checked"):
        print(f"   (tidak dicek — default hemat). {ph.get('note','')}")
        print("   → cek: python3 docs/ssot/foundry-master/resume_boot.py --health")
    else:
        flag = "✅ OK" if ph.get("ok") else "❌ DOWN/ERR"
        print(f"   endpoint: {ph.get('endpoint')}")
        print(f"   status: {ph.get('status')}  {flag}")
        if ph.get("body_snippet"):
            print(f"   body: {ph['body_snippet']}")
        if ph.get("error"):
            print(f"   error: {ph['error']}")

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

    print("\n[MASTER BOOT — 1 baris, tempel di awal sesi]")
    print("   " + master_boot_prompt(r))

    print("\n" + line)
    print(" NEXT: tulis SPRINT-KAS (FM-03), eksekusi, lalu HANDOFF (FM-02).")
    print(line)


def main():
    argv = sys.argv[1:]

    # --restore-from <path>: THE ONLY WRITE PATH (explicit, prints plan first)
    if "--restore-from" in argv:
        idx = argv.index("--restore-from")
        try:
            tarball = argv[idx + 1]
        except IndexError:
            print("ERROR: --restore-from butuh path tar.gz", file=sys.stderr)
            sys.exit(2)
        dry = "--dry-run" in argv
        res = restore_from_backup(tarball, dry_run=dry)
        print(json.dumps(res, ensure_ascii=False, indent=2))
        sys.exit(0 if res.get("ok") else 1)

    # --list-backups: read-only discovery
    if "--list-backups" in argv:
        print(json.dumps(find_backups(), ensure_ascii=False, indent=2))
        return

    # --boot: 1-line master boot prompt only
    if "--boot" in argv:
        r = build_report(health=False)
        print(master_boot_prompt(r))
        return

    health = "--health" in argv
    report = build_report(health=health)
    if "--json" in argv:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        print_human(report)


if __name__ == "__main__":
    main()
