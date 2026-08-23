# Deploying 18 Cricket Network to Azure

Two services:

| Component | Azure service | Source |
| --- | --- | --- |
| Backend API (FastAPI) | Azure App Service (Linux, Python 3.12) — or Container Apps via `backend/Dockerfile` | `backend/` |
| Frontend (Expo web) | Azure Static Web Apps (static export) | `frontend/` |

CI/CD is wired in `.github/workflows/azure-deploy.yml` (manual **Run workflow** or push to `main`).

## Prerequisites
- An Azure subscription and the Azure CLI (`az login`).
- A production **MongoDB** (MongoDB Atlas recommended). You need a full SRV connection string **with username and password**, and Atlas → Network Access must allow Azure (add `0.0.0.0/0`, or restrict to Azure outbound IPs).
- This GitHub repository.

## 1. Backend → Azure App Service

```bash
# Variables
RG=cricket-rg
LOC=centralindia
PLAN=cricket-plan
API=cricket-api          # must be globally unique -> https://cricket-api.azurewebsites.net

az group create -n $RG -l $LOC
az appservice plan create -g $RG -n $PLAN --is-linux --sku B1
az webapp create -g $RG -p $PLAN -n $API --runtime "PYTHON:3.12"

# Runtime configuration (SECRETS live here, never in git)
az webapp config appsettings set -g $RG -n $API --settings \
  MONGO_URL="<your-atlas-srv-uri-with-credentials>" \
  DB_NAME="18cricketnetwork" \
  JWT_SECRET="<long-random-secret>" \
  SCM_DO_BUILD_DURING_DEPLOYMENT="true"
  # optional: EMERGENT_LLM_KEY / OPENAI_API_KEY, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET

# Start command
az webapp config set -g $RG -n $API \
  --startup-file "gunicorn -k uvicorn.workers.UvicornWorker server:app --bind=0.0.0.0:8000 --workers 2 --timeout 120"

# Publish profile for GitHub Actions (save the whole XML)
az webapp deployment list-publishing-profiles -g $RG -n $API --xml
```

Then in GitHub → **Settings → Secrets and variables → Actions**:
- Variable `AZURE_WEBAPP_NAME` = `cricket-api`
- Secret `AZURE_WEBAPP_PUBLISH_PROFILE` = the XML from the last command

Verify after deploy: `https://cricket-api.azurewebsites.net/api/health` returns `{"status":"healthy"}`.

### Alternative: container (Container Apps / Web App for Containers)
`backend/Dockerfile` is production-ready and reads config from env. Build/push to ACR or GHCR and point an Azure Container App / Web App for Containers at it (expose port 8000; set the same app settings).

## 2. Frontend → Azure Static Web Apps

```bash
SWA=cricket-web
az staticwebapp create -g $RG -n $SWA -l eastus2   # SWA regions differ from App Service
az staticwebapp secrets list -g $RG -n $SWA --query "properties.apiKey" -o tsv
```

In GitHub → Actions secrets/variables:
- Secret `AZURE_STATIC_WEB_APPS_API_TOKEN` = the token above
- Variable `BACKEND_URL` = `https://cricket-api.azurewebsites.net` (baked into the web bundle at build time)

The workflow runs `expo export --platform web` and uploads `frontend/dist`. `frontend/staticwebapp.config.json` provides SPA fallback for deep links.

## 3. Deploy
Push to `main`, or GitHub → **Actions → Deploy to Azure → Run workflow**. The two jobs deploy the backend and frontend. Update `BACKEND_URL` and re-run the frontend job if the backend URL changes.

## Required secrets & variables (summary)
| Location | Name | Purpose |
| --- | --- | --- |
| GitHub secret | `AZURE_WEBAPP_PUBLISH_PROFILE` | Deploy backend |
| GitHub secret | `AZURE_STATIC_WEB_APPS_API_TOKEN` | Deploy frontend |
| GitHub variable | `AZURE_WEBAPP_NAME` | Backend app name |
| GitHub variable | `BACKEND_URL` | Backend URL baked into web build |
| Azure App Setting | `MONGO_URL`, `DB_NAME`, `JWT_SECRET` | Backend runtime (required) |
| Azure App Setting | `EMERGENT_LLM_KEY`/`OPENAI_API_KEY`, `RAZORPAY_*` | Optional features |

## Notes
- No secrets are committed; all runtime config is via environment variables / Azure App Settings.
- Backend CORS currently allows all origins — tighten to your SWA domain before public launch.
- The database must be reachable from Azure (Atlas network allowlist).
