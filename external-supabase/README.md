# External Supabase Edge Functions

Ei folder-er edge function gulo **External Supabase project** (`vdbkannwrsekvrdwijrx`) e deploy korar jonno — Lovable Cloud-e na. Lovable auto-deploy korbe na (eta `supabase/functions/` folder-e nai).

## Why?

Apnar asol data (products, orders, user_roles, auth) **External Supabase**-e. Admin operations je service role key use kore, segulo oikhane deploy hote hobe.

## Functions

### `admin-management`
Admin panel-er sob privileged operation: list/create staff, role change, suspend, remove, set password.

---

## Deploy korar instructions

### Step 1: Supabase CLI install (jodi na thake)

**Mac:**
```bash
brew install supabase/tap/supabase
```

**Windows (Scoop):**
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Linux / npm:**
```bash
npm install -g supabase
```

Details: https://supabase.com/docs/guides/cli/getting-started

### Step 2: Login

```bash
supabase login
```
Browser khulbe → External Supabase account-e login korben.

### Step 3: Link to External project

Apnar local computer-e ekta empty folder banan (e.g. `nuqtah-edge-deploy`), tarpor:

```bash
cd nuqtah-edge-deploy
supabase init
supabase link --project-ref vdbkannwrsekvrdwijrx
```

### Step 4: Function file copy korun

Ei project theke `external-supabase/functions/admin-management/index.ts` file ta apnar local folder-e copy korun ei path-e:

```
nuqtah-edge-deploy/
  supabase/
    functions/
      admin-management/
        index.ts        ← ei file ta eikhane rakhen
```

### Step 5: Deploy

```bash
supabase functions deploy admin-management --no-verify-jwt
```

> `--no-verify-jwt` flag dorkar karon ami function-er bhitor manually JWT verify kori (administrator role check korar jonno).

### Step 6: Verify deploy

External Supabase dashboard → Edge Functions menu-e `admin-management` dekha jabe with status "Active". Logs tab khule rakhle invocation dekha jabe.

### Step 7: Test (optional, before frontend switch)

```bash
curl -X POST \
  "https://vdbkannwrsekvrdwijrx.supabase.co/functions/v1/admin-management" \
  -H "Authorization: Bearer YOUR_ADMINISTRATOR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"action":"list"}'
```

JWT pawar way: browser-e site-e login kore DevTools console-e:
```js
(await window.supabase?.auth?.getSession?.())?.data?.session?.access_token
```
(Jodi `window.supabase` exposed na thake, sheta skip kore directly frontend switch korte parben.)

Successful hole JSON array (staff list) ba `{"error":"..."}` return korbe.

---

## Deploy hoye gele

Apni amake bolben "deploy done" — ami frontend (`admin.admins.tsx` + admin functions file) update kore `supabase.functions.invoke('admin-management', ...)` use korar moto banabo. Edge function ready na thakle frontend switch korle admin panel break korbe.

## Rollback

Kichu venge gele:
```bash
supabase functions delete admin-management
```
Frontend ekhono purono `createServerFn` use korche, tai eta delete korle current admin panel jemon kaaj korche temon-i korbe.
