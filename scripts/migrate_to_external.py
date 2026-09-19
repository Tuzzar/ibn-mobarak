#!/usr/bin/env python3
"""
Al Miftah Shop — migrate everything from the Lovable Cloud database
into the customer's own external Supabase project.

Prerequisite: scripts/migrate-to-external-supabase.sql must already be run
in the external project's SQL Editor.

Usage:
  python3 scripts/migrate_to_external.py            # full run
  python3 scripts/migrate_to_external.py --check    # only verify readiness
"""

import json
import mimetypes
import os
import subprocess
import sys
import urllib.request
import urllib.error

EXT_URL = "https://ayxnpifkrqohygyureqg.supabase.co"
SERVICE_KEY = os.environ["EXTERNAL_SUPABASE_SERVICE_ROLE_KEY"]
CDN_ORIGIN = "https://almiftah.lovable.app"
BUCKET = "product-images"

ADMIN_EMAIL = os.environ.get("MIGRATION_ADMIN_EMAIL", "")
ADMIN_PASSWORD = os.environ.get("MIGRATION_ADMIN_PASSWORD", "")

# Insert order matters: parents before children.
TABLES = [
    ("products", "id"),
    ("menu_categories", "id"),
    ("site_content", "id"),
    ("home_sections", "id"),
    ("landing_pages", "id"),
    ("orders", "id"),
    ("order_history", "id"),
    ("incomplete_orders", "id"),
    ("courier_checks", "id"),
    ("app_settings", "key"),
]


def req(method, path, body=None, headers=None, raw=None, base=EXT_URL):
    url = f"{base}{path}"
    h = {"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}"}
    if headers:
        h.update(headers)
    data = raw
    if body is not None:
        data = json.dumps(body).encode()
        h.setdefault("Content-Type", "application/json")
    r = urllib.request.Request(url, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            return resp.status, resp.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()


def pg_json(table):
    """Read a table out of the current Lovable Cloud database as JSON."""
    out = subprocess.run(
        ["psql", "-At", "-c",
         f"select coalesce(json_agg(t), '[]'::json)::text from public.{table} t"],
        capture_output=True, text=True, check=True,
    )
    return json.loads(out.stdout.strip())


def check_schema():
    missing = []
    for table, _ in TABLES:
        status, _ = req("GET", f"/rest/v1/{table}?select=*&limit=1")
        if status == 404:
            missing.append(table)
    return missing


# ---------------------------------------------------------------- data copy
def copy_tables():
    for table, conflict in TABLES:
        rows = pg_json(table)
        if not rows:
            print(f"  {table:<20} 0 rows (skipped)")
            continue
        status, body = req(
            "POST", f"/rest/v1/{table}?on_conflict={conflict}", body=rows,
            headers={"Prefer": "resolution=merge-duplicates,return=minimal"},
        )
        ok = "OK" if status in (200, 201, 204) else f"FAILED {status}"
        print(f"  {table:<20} {len(rows)} rows -> {ok}")
        if status not in (200, 201, 204):
            print(f"    {body.decode()[:400]}")
            return False
    return True


# ------------------------------------------------------------------- admin
def create_admin():
    if not ADMIN_EMAIL or not ADMIN_PASSWORD:
        print("  skipped (no admin credentials in env)")
        return True

    status, body = req("POST", "/auth/v1/admin/users", body={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD,
        "email_confirm": True,
    })
    if status in (200, 201):
        user_id = json.loads(body)["id"]
        print(f"  created auth user {ADMIN_EMAIL}")
    else:
        # Already exists — look it up instead.
        status, body = req(
            "GET",
            f"/auth/v1/admin/users?filter={urllib.parse.quote(ADMIN_EMAIL)}",
        )
        users = json.loads(body).get("users", []) if status == 200 else []
        match = [u for u in users if u.get("email") == ADMIN_EMAIL]
        if not match:
            print(f"  FAILED to create or find admin user: {body.decode()[:300]}")
            return False
        user_id = match[0]["id"]
        print(f"  reused existing auth user {ADMIN_EMAIL}")

    status, body = req(
        "POST", "/rest/v1/user_roles?on_conflict=user_id,role",
        body=[{"user_id": user_id, "role": "administrator", "status": "active"}],
        headers={"Prefer": "resolution=merge-duplicates,return=minimal"},
    )
    if status not in (200, 201, 204):
        print(f"  FAILED to grant administrator role: {body.decode()[:300]}")
        return False
    print("  granted administrator role")
    return True


# ------------------------------------------------------------------ images
_uploaded: dict[str, str] = {}


def migrate_image(url):
    """Download a Lovable-CDN image and re-host it in the external bucket."""
    if not isinstance(url, str) or "/__l5e/assets-v1/" not in url:
        return url
    if url in _uploaded:
        return _uploaded[url]

    path = url if url.startswith("/") else "/" + url.split("//", 1)[-1].split("/", 1)[-1]
    source = url if url.startswith("http") else CDN_ORIGIN + url
    filename = path.rstrip("/").split("/")[-1]
    asset_id = path.strip("/").split("/")[-2]
    key = f"{asset_id}-{filename}"

    try:
        with urllib.request.urlopen(source) as resp:
            blob = resp.read()
            ctype = resp.headers.get("Content-Type") or \
                mimetypes.guess_type(filename)[0] or "application/octet-stream"
    except Exception as exc:  # noqa: BLE001
        print(f"    download failed {source}: {exc}")
        return url

    status, body = req(
        "POST", f"/storage/v1/object/{BUCKET}/{key}", raw=blob,
        headers={"Content-Type": ctype, "x-upsert": "true"},
    )
    if status not in (200, 201):
        print(f"    upload failed {key}: {status} {body.decode()[:200]}")
        return url

    public_url = f"{EXT_URL}/storage/v1/object/public/{BUCKET}/{key}"
    _uploaded[url] = public_url
    return public_url


def walk(value):
    if isinstance(value, str):
        return migrate_image(value)
    if isinstance(value, list):
        return [walk(v) for v in value]
    if isinstance(value, dict):
        return {k: walk(v) for k, v in value.items()}
    return value


def migrate_images():
    targets = [
        ("products", "id", ["image_url", "images"]),
        ("menu_categories", "id", ["icon"]),
        ("site_content", "id", ["value"]),
        ("home_sections", "id", ["config"]),
        ("landing_pages", "id", ["hero_image_url", "og_image_url", "review_images"]),
    ]
    for table, pk, columns in targets:
        status, body = req(
            "GET", f"/rest/v1/{table}?select={pk},{','.join(columns)}")
        if status != 200:
            print(f"  {table:<20} read failed {status}")
            continue
        rows = json.loads(body)
        changed = 0
        for row in rows:
            patch = {}
            for col in columns:
                new = walk(row.get(col))
                if new != row.get(col):
                    patch[col] = new
            if not patch:
                continue
            status, body = req(
                "PATCH", f"/rest/v1/{table}?{pk}=eq.{row[pk]}", body=patch,
                headers={"Prefer": "return=minimal"},
            )
            if status in (200, 204):
                changed += 1
            else:
                print(f"    patch failed {table} {row[pk]}: {body.decode()[:200]}")
        print(f"  {table:<20} {changed} row(s) re-pointed")


def main():
    print("== 1. Checking external schema ==")
    missing = check_schema()
    if missing:
        print("  Missing tables:", ", ".join(missing))
        print("  Run scripts/migrate-to-external-supabase.sql first.")
        sys.exit(1)
    print("  all tables present")

    if "--check" in sys.argv:
        return

    print("== 2. Copying data ==")
    if not copy_tables():
        sys.exit(1)

    print("== 3. Admin account ==")
    if not create_admin():
        sys.exit(1)

    print("== 4. Migrating images to Supabase Storage ==")
    migrate_images()

    print(f"\nDone. {len(_uploaded)} image(s) re-hosted.")


if __name__ == "__main__":
    import urllib.parse  # noqa: E402  (used in create_admin)
    main()
