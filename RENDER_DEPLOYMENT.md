# Render.com Deployment Guide for MCP Server

## The Problem
Your Next.js app is deployed, but the MCP server is a separate HTTP server that needs its own deployment.

## Solution: Deploy MCP Server as Separate Service

### Step 1: Create a New Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `speaks999/agent-crm`

### Step 2: Configure the Service

**Service Settings:**
- **Name**: `agent-crm-mcp-server` (or any name you prefer)
- **Region**: Choose closest to you
- **Branch**: `main`
- **Root Directory**: `mcp-server`
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start:http`

**Environment Variables:**
Add these in the Render dashboard:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
PORT=10000
```

**Note**: Render automatically sets `PORT`, but we set it explicitly to ensure compatibility.

### Step 3: Deploy

Click **"Create Web Service"** and wait for deployment.

### Step 4: Get Your MCP Endpoint

Once deployed, you'll get a URL like:
```
https://agent-crm-mcp-server.onrender.com
```

Your MCP endpoint will be:
```
https://agent-crm-mcp-server.onrender.com/mcp
```

### Step 5: Configure ChatGPT

Use this endpoint URL in ChatGPT's connector configuration:
```
https://agent-crm-mcp-server.onrender.com/mcp
```

## Alternative: Single Service Deployment

If you want everything in one service, you'll need to integrate the MCP server into Next.js as API routes. This is more complex but possible.
