# Debug Script for Image Loading Issue

This script will help diagnose why the second user's images aren't loading.

## Step 1: Check Browser Console

1. Open your browser's Developer Tools (F12)
2. Go to the **Console** tab
3. Log in as the **first user** (whose images work)
4. Navigate to a page with images
5. Look for any errors or warnings
6. Take a screenshot

Then:
1. Log out and log in as the **second user** (whose images don't work)
2. Navigate to a page with images
3. Look for any errors or warnings - especially:
   - 403 Forbidden errors
   - 404 Not Found errors
   - CORS errors
   - Network errors
4. Take a screenshot

## Step 2: Check Network Tab

1. Open Developer Tools (F12)
2. Go to the **Network** tab
3. Filter by "Img" or "Media"
4. Log in as the second user
5. Navigate to a page with their images
6. Look at the image requests:
   - What is the full URL being requested?
   - What is the HTTP status code? (200, 403, 404, etc.)
   - What is the response size?
   - Are there any error messages?

## Step 3: Test Direct URL Access

1. Right-click on a broken image
2. Select "Copy image address" or "Inspect"
3. Copy the full URL
4. Open a new browser tab (in incognito/private mode if possible)
5. Paste the URL and try to access it directly
6. Does the image load?

## Step 4: Compare URLs

Compare the image URLs between the two users:

**First user (working):**
- What does the avatar URL look like?
- Example: `https://[project-id].supabase.co/storage/v1/object/public/avatars/[user-id]/[filename]`

**Second user (not working):**
- What does the avatar URL look like?
- Is it the same format?
- Is the user ID correct?

## Step 5: Check Supabase Storage

1. Go to your Supabase Dashboard
2. Navigate to **Storage**
3. Open the `avatars` bucket
4. Check if the second user's folder exists
5. Check if there are files in that folder
6. Try to view/download the files directly from the dashboard

## Step 6: Check Database

Run this query in your Supabase SQL Editor:

\`\`\`sql
-- Check avatar URLs for both users
SELECT id, username, avatar_url, created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;
\`\`\`

Look for:
- Are both users' avatar_url fields populated?
- Do the URLs look correct?
- Are they using the same URL format?

## Common Issues to Look For

1. **Incorrect URL format**: URLs should be `https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]`
2. **Missing files**: Files weren't actually uploaded to storage
3. **Wrong bucket**: Files uploaded to wrong bucket
4. **Malformed paths**: Incorrect file paths in the database
5. **CORS issues**: Browser blocking cross-origin requests
6. **Cache issues**: Browser caching old/broken URLs

## Please Share

After running these checks, please share:
1. Any console errors you see
2. The HTTP status codes from the Network tab
3. The full image URLs for both users (you can redact the project ID if needed)
4. Whether the files exist in Supabase Storage dashboard
5. The avatar_url values from the database query
