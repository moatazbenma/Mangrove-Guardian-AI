import time
import requests

BASE = "http://localhost:8000/api"
creds = {"username": "testuser", "password": "testpass123"}

r = requests.post(f"{BASE}/token/", json=creds, timeout=20)
r.raise_for_status()
token = r.json()["access"]
headers = {"Authorization": f"Bearer {token}"}

lst = requests.get(f"{BASE}/analysis/", headers=headers, timeout=20)
lst.raise_for_status()
payload = lst.json()
items = payload.get("results", payload if isinstance(payload, list) else [])

if not items:
    print("NO_ANALYSIS_RECORDS")
    raise SystemExit(0)

items = sorted(items, key=lambda x: x.get("id", 0), reverse=True)
analysis = items[0]
aid = analysis["id"]
print("TARGET_ANALYSIS_ID", aid, "INITIAL_STATUS", analysis.get("status"))

rr = requests.post(f"{BASE}/analysis/{aid}/retry/", headers=headers, timeout=20)
print("RETRY_STATUS_CODE", rr.status_code)
print("RETRY_BODY", rr.text[:300])

final = None
for i in range(1, 13):
    g = requests.get(f"{BASE}/analysis/{aid}/", headers=headers, timeout=20)
    g.raise_for_status()
    d = g.json()
    st = d.get("status")
    print(f"POLL_{i}", st)
    if st in ("complete", "failed"):
        final = d
        break
    time.sleep(10)

if final is None:
    final = d

print("FINAL_STATUS", final.get("status"))
print("FINAL_HEALTH", final.get("health_score"))
print("FINAL_DAMAGE", final.get("damage_detected"))
print("FINAL_RISK", final.get("risk_level"))
print("FINAL_RESULT", str(final.get("result"))[:500])
