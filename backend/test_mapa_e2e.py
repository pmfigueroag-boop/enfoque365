"""Test E2E: Mapa BSC via IA"""
import urllib.request, urllib.error, json

BASE = "http://localhost:8001/api/v1"

def req(method, path, data=None):
    body = json.dumps(data).encode() if data else None
    headers = {"Content-Type": "application/json", "X-Tenant-Id": "3", "X-User-Email": "admin@enfoque365.gob.do"}
    r = urllib.request.Request(BASE + path, data=body, headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(r, timeout=10)
        raw = resp.read().decode()
        return resp.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

# 1. Limpiar inbox
print("PASO 1: Limpiar inbox")
s, inbox = req("GET", "/diagnostico/ia/inbox")
pendientes = [p for p in inbox if p["status"] == "borrador"]
print(f"  Pendientes: {len(pendientes)}")
for p in pendientes:
    req("POST", f"/diagnostico/ia/inbox/{p['id']}/rechazar", {"rejection_reason": "test cleanup"})
print("  OK")

# 2. Generar arbol
print("\nPASO 2: Generar Arbol IA")
s, proposals = req("POST", "/pei/ia/generar-arbol")
print(f"  Status: {s}, Propuestas: {len(proposals) if isinstance(proposals, list) else 'ERROR'}")
if s != 201:
    print(f"  ERROR: {proposals}"); exit(1)

ejes_props = [p for p in proposals if p["target_entity"] == "eje_estrategico"]
objs_props = [p for p in proposals if p["target_entity"] == "objetivo_estrategico"]
print(f"  Ejes: {len(ejes_props)}, Objetivos: {len(objs_props)}")

# 3. Aprobar ejes
print("\nPASO 3a: Aprobar EJES")
for p in ejes_props:
    payload = json.loads(p["proposed_payload"])
    s, r = req("POST", f"/diagnostico/ia/inbox/{p['id']}/aprobar")
    print(f"  [{p['id']}] {payload.get('perspectiva_bsc','?')} {payload['name'][:35]} -> {s}")
    if s != 200: print(f"    ERR: {str(r)[:150]}")

# Verificar ejes
s, ejes = req("GET", "/pei/ejes")
print(f"  Ejes en BD: {len(ejes)}")
for e in ejes:
    print(f"    [{e['id']}] {e.get('perspectiva_bsc','?')} {e['name']}")

# 3b. Aprobar objetivos
print("\nPASO 3b: Aprobar OBJETIVOS")
for p in objs_props:
    payload = json.loads(p["proposed_payload"])
    s, r = req("POST", f"/diagnostico/ia/inbox/{p['id']}/aprobar")
    print(f"  [{p['id']}] {payload['description'][:40]} -> {s}")
    if s != 200: print(f"    ERR: {str(r)[:150]}")

# 4. Verificar arbol
print("\nPASO 4: Arbol")
s, arbol = req("GET", "/pei/arbol")
for e in arbol:
    objs = e.get("objetivos", [])
    print(f"  {e.get('perspectiva_bsc','?')} | {e['name'][:30]} | {len(objs)} obj")

# 5. MAPA
print("\nPASO 5: MAPA BSC")
s, mapa = req("GET", "/pei/mapa-estrategico")
print(f"  Status: {s}, Type: {type(mapa).__name__}")
if isinstance(mapa, list):
    print(f"  Items: {len(mapa)}")
    for item in mapa:
        print(f"    perspectiva={item.get('perspectiva','?')}, ejes={len(item.get('ejes',[]))}")
        for e in item.get("ejes", []):
            print(f"      {e['name'][:30]} -> {len(e.get('objetivos',[]))} obj")
else:
    print(f"  RAW: {str(mapa)[:500]}")

print("\nDONE")
