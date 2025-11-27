# Quick Fix for Mobile Verification Issue

## The Problem
The verification link shows: "Cannot connect to server at http://localhost:5000/api"

This means the frontend is trying to connect to `localhost` instead of `192.168.1.100`.

## The Solution

### Step 1: Create/Update Frontend .env File

Create or edit `frontend/.env` file:

```env
REACT_APP_API_URL=http://192.168.1.100:5000/api
```

**Important**: Replace `192.168.1.100` with your actual PC's IP address if different.

### Step 2: Restart Frontend Server

After creating/updating the `.env` file, you MUST restart the React dev server:

1. Stop the current server (Ctrl+C)
2. Start it again: `npm start`

**The .env file is only read when the server starts!**

### Step 3: Test

1. Open the verification link on your phone
2. Check the browser console (if available) - you should see:
   ```
   🔗 API Base URL: http://192.168.1.100:5000/api
   ```
3. The verification should now work!

## Alternative: Find Your PC's IP Address

If you don't know your PC's IP:

**Windows:**
```cmd
ipconfig
```
Look for "IPv4 Address" under your network adapter (usually `192.168.x.x`)

**Mac/Linux:**
```bash
ifconfig
# or
ip addr
```

## Verify It's Working

After setting the environment variable and restarting:

1. Check the browser console on your phone
2. Look for: `🔗 API Base URL: http://192.168.1.100:5000/api`
3. If it still shows `localhost`, the `.env` file wasn't read (server not restarted)

## Why This Happens

React environment variables are embedded at build time. The auto-detection based on `window.location.hostname` should work, but setting `REACT_APP_API_URL` explicitly is more reliable.

## Still Not Working?

1. **Double-check the IP address** - Make sure it matches your PC's actual IP
2. **Verify the .env file location** - Must be in `frontend/.env` (not `frontend/src/.env`)
3. **Check server restart** - The React dev server must be restarted after changing `.env`
4. **Test server reachability** - From phone browser, try: `http://192.168.1.100:5000/api/health`
5. **Check firewall** - Windows Firewall might be blocking port 5000

