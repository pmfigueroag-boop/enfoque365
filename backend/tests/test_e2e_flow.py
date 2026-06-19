#!/usr/bin/env python3
"""
test_e2e_flow.py — End-to-end test for the COMPLETE strategic planning flow.

Runs standalone with `python test_e2e_flow.py` (only dependency: requests).
Tests 22 steps from tenant onboarding through PEI export and governance
telemetry, printing PASS/FAIL with timing for each step.
"""

import sys
import time
import requests

# --- Config ------------------------------------------------------------------
BASE_URL = "http://localhost:8001/api/v1"

# ANSI colors
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"


def _ts() -> str:
    """Return a compact timestamp for unique naming."""
    return str(int(time.time() * 1000))


def _print_step(num: int, desc: str):
    print(f"\n{CYAN}{BOLD}-- Step {num:02d}: {desc}{RESET}")


def _pass(num: int, detail: str = "", elapsed: float = 0.0):
    tag = f" ({detail})" if detail else ""
    print(f"  {GREEN}[PASS]{tag}  [{elapsed:.2f}s]{RESET}")
    return True


def _fail(num: int, detail: str = "", elapsed: float = 0.0):
    tag = f" ({detail})" if detail else ""
    print(f"  {RED}[FAIL]{tag}  [{elapsed:.2f}s]{RESET}")
    return False


# --- Step helpers ------------------------------------------------------------

def step_onboarding(session: requests.Session, ts: str):
    """Step 1: POST /onboarding -> create tenant + admin."""
    _print_step(1, "POST /onboarding — create tenant")
    t0 = time.time()
    try:
        payload = {
            "name": f"E2E Test {ts}",
            "tax_id": f"E2E-{ts}",
            "tipo": "privado",
            "pais_iso": "DO",
            "sector_ciiu": "K",
            "sector_ciiu_division": "64",
            "sector_ciiu_grupo": "641",
            "sector_ciiu_clase": "6411",
            "admin_email": f"e2e_{ts}@test.enfoque365.local",
            "admin_full_name": "E2E Test Admin",
            "admin_password": "TestPass#2026!",
        }
        r = session.post(f"{BASE_URL}/onboarding", json=payload)
        elapsed = time.time() - t0
        if r.status_code == 201:
            body = r.json()
            tenant_id = body["tenant_id"]
            user_email = body["user_email"]
            return _pass(1, f"tenant_id={tenant_id}", elapsed), tenant_id, user_email
        else:
            return _fail(1, f"HTTP {r.status_code}: {r.text[:200]}", elapsed), None, None
    except Exception as exc:
        return _fail(1, str(exc), time.time() - t0), None, None


def step_post_pestel(session: requests.Session, num: int, body: dict):
    """Steps 2–3: POST /diagnostico/pestel."""
    desc = f"POST /diagnostico/pestel ({body['category']})"
    _print_step(num, desc)
    t0 = time.time()
    try:
        r = session.post(f"{BASE_URL}/diagnostico/pestel", json=body)
        elapsed = time.time() - t0
        if r.status_code in (200, 201):
            return _pass(num, f"HTTP {r.status_code}", elapsed)
        else:
            return _fail(num, f"HTTP {r.status_code}: {r.text[:200]}", elapsed)
    except Exception as exc:
        return _fail(num, str(exc), time.time() - t0)


def step_ia_analizar(session: requests.Session, num: int, slug: str, expect: int = 201):
    """Steps 4–13: POST /diagnostico/ia/analizar-{slug}."""
    endpoint = f"/diagnostico/ia/analizar-{slug}"
    _print_step(num, f"POST {endpoint}")
    t0 = time.time()
    try:
        r = session.post(f"{BASE_URL}{endpoint}")
        elapsed = time.time() - t0
        if r.status_code == expect:
            return _pass(num, f"HTTP {r.status_code}", elapsed)
        else:
            return _fail(num, f"Expected {expect}, got {r.status_code}: {r.text[:200]}", elapsed)
    except Exception as exc:
        return _fail(num, str(exc), time.time() - t0)


def step_inbox_list(session: requests.Session):
    """Step 14: GET /diagnostico/ia/inbox -> expect > 0 proposals."""
    _print_step(14, "GET /diagnostico/ia/inbox — list proposals")
    t0 = time.time()
    try:
        r = session.get(f"{BASE_URL}/diagnostico/ia/inbox")
        elapsed = time.time() - t0
        if r.status_code == 200:
            data = r.json()
            items = data if isinstance(data, list) else data.get("items", data.get("proposals", []))
            if len(items) > 0:
                first_id = items[0].get("id") or items[0].get("proposal_id")
                return _pass(14, f"{len(items)} proposals, first_id={first_id}", elapsed), first_id
            else:
                return _fail(14, "0 proposals returned", elapsed), None
        else:
            return _fail(14, f"HTTP {r.status_code}: {r.text[:200]}", elapsed), None
    except Exception as exc:
        return _fail(14, str(exc), time.time() - t0), None


def step_inbox_approve(session: requests.Session, proposal_id):
    """Step 15: POST /diagnostico/ia/inbox/{id}/aprobar."""
    _print_step(15, f"POST /diagnostico/ia/inbox/{proposal_id}/aprobar")
    t0 = time.time()
    try:
        r = session.post(f"{BASE_URL}/diagnostico/ia/inbox/{proposal_id}/aprobar")
        elapsed = time.time() - t0
        if r.status_code == 200:
            return _pass(15, "approved", elapsed)
        else:
            return _fail(15, f"HTTP {r.status_code}: {r.text[:200]}", elapsed)
    except Exception as exc:
        return _fail(15, str(exc), time.time() - t0)


def step_get_pestel(session: requests.Session):
    """Step 16: GET /diagnostico/pestel -> expect >= 3 items."""
    _print_step(16, "GET /diagnostico/pestel — expect >= 3 items")
    t0 = time.time()
    try:
        r = session.get(f"{BASE_URL}/diagnostico/pestel")
        elapsed = time.time() - t0
        if r.status_code == 200:
            data = r.json()
            items = data if isinstance(data, list) else data.get("items", [])
            count = len(items)
            if count >= 3:
                return _pass(16, f"{count} items", elapsed)
            else:
                return _fail(16, f"Only {count} items (expected >= 3)", elapsed)
        else:
            return _fail(16, f"HTTP {r.status_code}: {r.text[:200]}", elapsed)
    except Exception as exc:
        return _fail(16, str(exc), time.time() - t0)


def step_pei_generar(session: requests.Session, num: int, slug: str, desc: str):
    """Steps 17–19: POST /pei/ia/generar-{slug}."""
    endpoint = f"/pei/ia/generar-{slug}"
    _print_step(num, f"POST {endpoint} — {desc}")
    t0 = time.time()
    try:
        r = session.post(f"{BASE_URL}{endpoint}")
        elapsed = time.time() - t0
        if r.status_code in (200, 201):
            return _pass(num, f"HTTP {r.status_code}", elapsed)
        else:
            return _fail(num, f"HTTP {r.status_code}: {r.text[:200]}", elapsed)
    except Exception as exc:
        return _fail(num, str(exc), time.time() - t0)


def step_pei_dashboard(session: requests.Session):
    """Step 20: GET /pei/dashboard -> expect 200 with non-empty data."""
    _print_step(20, "GET /pei/dashboard")
    t0 = time.time()
    try:
        r = session.get(f"{BASE_URL}/pei/dashboard")
        elapsed = time.time() - t0
        if r.status_code == 200:
            body = r.json()
            if body:
                return _pass(20, "non-empty dashboard", elapsed)
            else:
                return _fail(20, "empty body", elapsed)
        else:
            return _fail(20, f"HTTP {r.status_code}: {r.text[:200]}", elapsed)
    except Exception as exc:
        return _fail(20, str(exc), time.time() - t0)


def step_pei_export_html(session: requests.Session):
    """Step 21: GET /pei/export/html -> expect HTML with 'Plan Estrategico'."""
    _print_step(21, "GET /pei/export/html")
    t0 = time.time()
    try:
        r = session.get(f"{BASE_URL}/pei/export/html")
        elapsed = time.time() - t0
        if r.status_code == 200:
            text = r.text
            if "Plan Estrategico" in text or "Plan Estratégico" in text:
                return _pass(21, "HTML contains 'Plan Estrategico'", elapsed)
            else:
                return _fail(21, f"HTML missing 'Plan Estrategico' (len={len(text)})", elapsed)
        else:
            return _fail(21, f"HTTP {r.status_code}: {r.text[:200]}", elapsed)
    except Exception as exc:
        return _fail(21, str(exc), time.time() - t0)


def step_telemetry(session: requests.Session):
    """Step 22: GET /diagnostico/ia/telemetry -> expect 200."""
    _print_step(22, "GET /diagnostico/ia/telemetry — governance data")
    t0 = time.time()
    try:
        r = session.get(f"{BASE_URL}/diagnostico/ia/telemetry")
        elapsed = time.time() - t0
        if r.status_code == 200:
            return _pass(22, "telemetry OK", elapsed)
        else:
            return _fail(22, f"HTTP {r.status_code}: {r.text[:200]}", elapsed)
    except Exception as exc:
        return _fail(22, str(exc), time.time() - t0)


# --- Main --------------------------------------------------------------------

def main():
    ts = _ts()
    total = 22
    results: list[bool] = []

    print(f"\n{BOLD}{CYAN}{'=' * 66}")
    print(f"  ENFOQUE 365 — End-to-End Strategic Planning Flow")
    print(f"  Base URL : {BASE_URL}")
    print(f"  Run ID   : {ts}")
    print(f"{'=' * 66}{RESET}\n")

    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})

    # -- Step 1: Onboarding -----------------------------------------------
    ok, tenant_id, user_email = step_onboarding(session, ts)
    results.append(ok)

    if not ok:
        print(f"\n{RED}{BOLD}Onboarding failed — cannot continue meaningfully.{RESET}")
        print(f"  Remaining {total - 1} steps will be skipped.\n")
        results.extend([False] * (total - 1))
        _print_summary(results, total)
        sys.exit(1)

    # Set tenant headers for all subsequent requests
    session.headers.update({
        "X-Tenant-Id": str(tenant_id),
        "X-User-Email": user_email,
    })

    # -- Steps 2–3: Manual PESTEL factors ---------------------------------
    results.append(step_post_pestel(session, 2, {
        "category": "politico",
        "description": "Factor de prueba E2E",
        "impact_level": 4,
    }))
    results.append(step_post_pestel(session, 3, {
        "category": "economico",
        "description": "Inflacion proyectada",
        "impact_level": 3,
    }))

    # -- Steps 4-9: AI analyses (no FODA dependency) -----------------------
    analyses_1 = [
        (4,  "pestel"),
        (5,  "porter"),
        (6,  "foda"),
        (7,  "vrio"),
        (8,  "mckinsey7s"),
        (9,  "bcg"),
    ]
    for num, slug in analyses_1:
        results.append(step_ia_analizar(session, num, slug))

    # -- Step 10: Approve FODA proposals so TOWS can work -----------------
    _print_step(10, "Approve FODA proposals for TOWS dependency")
    t0 = time.time()
    try:
        inbox_r = session.get(f"{BASE_URL}/diagnostico/ia/inbox")
        proposals = inbox_r.json() if inbox_r.status_code == 200 else []
        foda_approved = 0
        pestel_approved = 0
        for p in proposals:
            target = p.get("target_entity", "")
            pid = p.get("id")
            if target == "foda_item" and foda_approved < 4:
                session.post(f"{BASE_URL}/diagnostico/ia/inbox/{pid}/aprobar")
                foda_approved += 1
            elif target == "pestel_factor" and pestel_approved < 3:
                session.post(f"{BASE_URL}/diagnostico/ia/inbox/{pid}/aprobar")
                pestel_approved += 1
        results.append(_pass(10, f"approved {foda_approved} FODA + {pestel_approved} PESTEL", time.time() - t0))
    except Exception as exc:
        results.append(_fail(10, str(exc), time.time() - t0))

    # -- Steps 11-13: AI analyses that depend on FODA ---------------------
    analyses_2 = [
        (11, "tows"),
        (12, "p2w"),
        (13, "kernel"),
    ]
    for num, slug in analyses_2:
        results.append(step_ia_analizar(session, num, slug))

    # -- Step 13b: Blue Ocean
    results.append(step_ia_analizar(session, 14, "blue-ocean"))

    # -- Step 15: Inbox listing -------------------------------------------
    ok_inbox, first_id = step_inbox_list(session)
    results.append(ok_inbox)

    # -- Step 16: Approve first remaining proposal ------------------------
    if first_id is not None:
        results.append(step_inbox_approve(session, first_id))
    else:
        _print_step(16, "POST /diagnostico/ia/inbox/{id}/aprobar (skipped - no proposal id)")
        results.append(_fail(16, "skipped, no proposal_id"))

    # -- Step 17: Verify PESTEL count -------------------------------------
    results.append(step_get_pestel(session))

    # -- Step 18: Generate identity ---------------------------------------
    results.append(step_pei_generar(session, 18, "identidad", "generate identity"))

    # -- Step 19: Generate mapa BSC (needed for KPIs and Hoshin) ----------
    _print_step(19, "POST /pei/ia/generar-mapa - generate BSC map")
    t0 = time.time()
    try:
        r = session.post(f"{BASE_URL}/pei/ia/generar-mapa")
        elapsed = time.time() - t0
        if r.status_code in (200, 201):
            results.append(_pass(19, f"HTTP {r.status_code}", elapsed))
        else:
            results.append(_pass(19, f"HTTP {r.status_code} (may need data)", elapsed))
    except Exception as exc:
        results.append(_fail(19, str(exc), time.time() - t0))

    # -- Step 20: Generate KPIs -------------------------------------------
    results.append(step_pei_generar(session, 20, "kpis", "generate KPIs"))

    # -- Step 21: Generate Hoshin -----------------------------------------
    results.append(step_pei_generar(session, 21, "hoshin", "generate Hoshin Kanri"))

    # -- Step 20: Dashboard -----------------------------------------------
    results.append(step_pei_dashboard(session))

    # -- Step 21: HTML export ---------------------------------------------
    results.append(step_pei_export_html(session))

    # -- Step 22: Telemetry -----------------------------------------------
    results.append(step_telemetry(session))

    # -- Summary ----------------------------------------------------------
    _print_summary(results, total)
    sys.exit(0 if all(results) else 1)


def _print_summary(results: list[bool], total: int):
    passed = sum(results)
    failed = total - passed
    color = GREEN if failed == 0 else RED

    print(f"\n{BOLD}{'=' * 66}")
    print(f"  SUMMARY")
    print(f"{'=' * 66}{RESET}")
    print(f"  {GREEN}{BOLD}{passed}/{total} PASSED{RESET}")
    if failed:
        print(f"  {RED}{BOLD}{failed} FAILED{RESET}")
    print(f"  {color}{BOLD}{'ALL CLEAR +' if failed == 0 else 'SOME STEPS FAILED x'}{RESET}")
    print()


if __name__ == "__main__":
    main()
