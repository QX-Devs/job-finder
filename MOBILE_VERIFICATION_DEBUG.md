# Mobile Verification Debugging Guide

## Current Issue
Verification link works on PC but shows "Network error" on mobile over LAN.

## What Was Fixed

### 1. **Improved API URL Detection**
- Now uses `window.location.protocol` to match HTTP/HTTPS
- Recalculates API URL at verification time (not just at module load)
- Logs all relevant information for debugging

### 2. **Better Error Messages**
- Shows specific error messages instead of generic "Network error"
- Displays the actual API URL being used
- Provides troubleshooting steps in error message

### 3. **Health Check**
- Tests server connectivity before attempting verification
- Helps identify if server is reachable

## Debugging Steps

### Step 1: Check Browser Console on Mobile

When you open the verification link on your phone, open the browser's developer console and look for:

```
📧 Verifying email: {
  apiBaseUrl: "...",
  fullUrl: "...",
  hostname: "...",
  ...
}
```

**Expected**: `apiBaseUrl` should be `http://192.168.1.100:5000/api`
**If wrong**: The API URL detection is failing

### Step 2: Check Network Tab

In mobile browser dev tools, check the Network tab:
- Look for the request to `/auth/verify/...`
- Check the request URL - should be `http://192.168.1.100:5000/api/auth/verify/...`
- Check the response:
  - **CORS error**: Backend CORS not allowing mobile origin
  - **Connection refused**: Server not reachable or firewall blocking
  - **Timeout**: Server not responding

### Step 3: Test Server Reachability

From your phone's browser, try accessing:
```
http://192.168.1.100:5000/api/health
```

**Expected**: Should return JSON: `{"status":"OK",...}`
**If fails**: Server not reachable from phone

### Step 4: Check Backend Logs

On your PC (where backend is running), check the console for:
```
📧 Email verification attempt: {
  token: "...",
  ip: "...",
  origin: "http://192.168.1.100:3000",
  ...
}
```

**If no log appears**: Request not reaching backend (network/firewall issue)
**If CORS error in logs**: Backend CORS configuration issue

### Step 5: Verify Environment Variables

**Backend `.env`:**
```env
FRONTEND_URL=http://192.168.1.100:3000
PORT=5000
NODE_ENV=development
```

**Frontend `.env`:**
```env
REACT_APP_API_URL=http://192.168.1.100:5000/api
```

**Important**: After changing `.env` files, restart both servers!

### Step 6: Check Firewall

Windows Firewall might be blocking port 5000:
1. Open Windows Defender Firewall
2. Click "Advanced settings"
3. Check "Inbound Rules" for port 5000
4. If missing, create a rule to allow port 5000

### Step 7: Verify CORS

The backend should allow requests from `http://192.168.1.100:3000`. Check backend logs for CORS errors.

## Quick Fixes

### Fix 1: Set Environment Variable
Create `frontend/.env`:
```env
REACT_APP_API_URL=http://192.168.1.100:5000/api
```

Then restart frontend: `npm start`

### Fix 2: Check Backend is Running
Make sure backend is running and accessible:
```bash
# On PC, test locally
curl http://localhost:5000/api/health

# Should return: {"status":"OK",...}
```

### Fix 3: Test from Phone Browser
Open on phone:
```
http://192.168.1.100:5000/api/health
```

If this doesn't work, the server is not reachable from your phone.

## Common Issues

### Issue: "Network error" but server is running
**Cause**: API URL detection using wrong hostname
**Fix**: Set `REACT_APP_API_URL` in `.env`

### Issue: CORS error in console
**Cause**: Backend not allowing mobile origin
**Fix**: Check `FRONTEND_URL` in backend `.env` and restart backend

### Issue: Connection refused
**Cause**: Firewall blocking or server not bound to 0.0.0.0
**Fix**: 
1. Check firewall settings
2. Ensure backend binds to `0.0.0.0` not `127.0.0.1`

### Issue: Timeout
**Cause**: Server not responding or network issue
**Fix**: Check server logs, verify server is running

## Next Steps

1. **Check mobile browser console** - Look for the `📧 Verifying email:` log
2. **Check the `apiBaseUrl` value** - Should be `http://192.168.1.100:5000/api`
3. **If wrong**, set `REACT_APP_API_URL` in frontend `.env`
4. **Test health endpoint** from phone browser
5. **Check backend logs** for verification attempts
6. **Share console logs** if issue persists

## Expected Console Output (Mobile)

```
🔗 API Base URL: http://192.168.1.100:5000/api
🌐 Current hostname: 192.168.1.100
📧 Verifying email: {
  apiBaseUrl: "http://192.168.1.100:5000/api",
  fullUrl: "http://192.168.1.100:5000/api/auth/verify/...",
  hostname: "192.168.1.100",
  ...
}
🏥 Health check response: { status: 200, ok: true }
✅ Verification response: { success: true, message: "..." }
```

If you see different values, that's the issue!

