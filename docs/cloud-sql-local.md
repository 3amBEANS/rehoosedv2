# Connect to Cloud SQL from your Mac (local dev)

Use the **Cloud SQL Auth Proxy** so Next.js can reach MySQL without relying on **Authorized networks** (your public IP changes on different networks).

## One-time setup

1. Install tools (Homebrew):

   ```bash
   brew install cloud-sql-proxy
   brew install --cask google-cloud-sdk
   ```

   Open a new terminal after installing `google-cloud-sdk` so `gcloud` is on your `PATH`.

2. Sign in and set Application Default Credentials (used by the proxy):

   ```bash
   gcloud auth login
   gcloud config set project cs4750db-489802
   gcloud auth application-default login
   ```

   Your Google account needs permission on the project (e.g. **Cloud SQL Client**).

## Every dev session

**Terminal A — keep this running**

```bash
cloud-sql-proxy cs4750db-489802:us-east4:cs4750db --address 127.0.0.1 --port 3307
```

Wait for: `The proxy has started successfully and is ready for new connections!`

If you see **`PROTOCOL_CONNECTION_LOST`** in the Next.js terminal, the DB tunnel dropped: restart **`cloud-sql-proxy`**, confirm nothing else is using the same port, and try again. The app pool uses TCP keep-alive to reduce idle drops, but the proxy must stay running.

**Terminal B — app**

In `.env.local`, point at the proxy (not the Cloud SQL public IP):

```env
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=root
DB_PASSWORD=<your MySQL password>
DB_NAME=m2projectdatabase
```

If you use the **Network** URL from `next dev` (e.g. `http://172.26.x.x:3000`) and see HMR blocked, add the host (no `http://`, no port):

```env
ALLOWED_DEV_ORIGINS=172.26.79.127
```

Restart `npm run dev` after changing this.

Then:

```bash
cd rehoosed
npm run dev
```

Restart `npm run dev` after changing `.env.local`.

## Optional: direct public IP instead of the proxy

Set `DB_HOST` to the instance **Public IP** and `DB_PORT=3306`. You must add your **current** public IP to Cloud SQL → **Connections** → **Authorized networks** as `x.x.x.x/32`. Check your IP with:

```bash
curl -4 -s ifconfig.me
```

## Troubleshooting

| Issue | What to check |
|--------|----------------|
| `command not found: gcloud` | Install `google-cloud-sdk` cask; use a new shell. |
| Proxy exits or connection errors | ADC: run `gcloud auth application-default login` again. |
| `ER_ACCESS_DENIED_ERROR` / 1045 | MySQL user/password in `.env.local` — proxy only opens the tunnel. |
| Homebrew `mysql` client error 2059 (`mysql_native_password`) | MySQL 9 client lacks that plugin; use the proxy + app, or an older client / Docker `mysql:8`. |

## Instance reference

- **Connection name:** `cs4750db-489802:us-east4:cs4750db`
- **Local proxy port used here:** `3307` (avoids clashing with a local MySQL on `3306`)

Change project, region, instance, or port if yours differ.
