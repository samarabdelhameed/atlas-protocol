# Subgraph Environment Setup

## Goldsky Configuration

Create `subgraph/.env` with:

```env
GOLDSKY_API_KEY=your_goldsky_api_key_here
GOLDSKY_PROJECT_ID=your_goldsky_project_id_here
```

## Getting Goldsky Credentials

1. Create account at [Goldsky](https://goldsky.com)
2. Create a new project
3. Get API Key from dashboard
4. Get Project ID from project settings

## After Deployment

After deploying the subgraph, you'll receive a GraphQL endpoint like:
```
https://api.goldsky.com/api/public/atlas-protocol/subgraphs/atlas-v1
```

Update this in:
- `apps/agent-service/.env`: `SUBGRAPH_URL=...`
- `apps/frontend/.env`: `VITE_SUBGRAPH_URL=...`

