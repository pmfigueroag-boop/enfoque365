import urllib.request
import urllib.error
import ssl

url = "http://localhost:8000/api/v1/pei/ia/export-plan-ia"
headers = {
    "Content-Type": "application/json",
    "X-Tenant-Id": "1",
    "X-User-Email": "admin@enfoque365.gob.do"
}
req = urllib.request.Request(url, headers=headers, method="POST", data=b"{}")
try:
    context = ssl._create_unverified_context()
    with urllib.request.urlopen(req, context=context) as response:
        print(response.status)
        print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    print(e.read().decode('utf-8'))
except Exception as e:
    print(f"Error: {e}")
