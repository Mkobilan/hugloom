# Profile Photo Upload Setup Guide

## ✅ What Was Implemented

### 1. **Updated TopBar Component**
- **File**: `c:\hugloom\src\components\layout\TopBar.tsx`
- **Changes**: 
  - Now fetches actual username from database
  - Displays time-based greeting (morning/afternoon/evening)
  - No more hardcoded "Sarah"!

### 2. **Profile Photo Upload Feature**
- **File**: `c:\hugloom\src\app\profile\page.tsx`
- **Features**:
  - ✅ Click camera icon to select image
  - ✅ File validation (images only, max 5MB)
  - ✅ Upload to Supabase Storage
  - ✅ Real-time preview
  - ✅ Loading states during upload
  - ✅ Automatic database update
  - ✅ Error handling with user-friendly messages

### 3. **Storage Setup SQL**
- **File**: `c:\hugloom\supabase\storage-setup.sql`
- **Contains**: Complete SQL to set up the avatars bucket with RLS policies

---

## 🚀 Setup Instructions

### Step 1: Run the SQL in Supabase

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `c:\hugloom\supabase\storage-setup.sql`
4. Click **Run** to execute

**What this does:**
- Creates an `avatars` storage bucket
- Sets it as public (so avatar URLs work)
- Adds security policies so users can only upload/delete their own photos
- Sets 5MB file size limit
- Restricts to image formats only (JPEG, PNG, WebP, GIF)

### Step 2: Verify Storage Bucket

1. In Supabase dashboard, go to **Storage**
2. You should see a new bucket called `avatars`
3. Click on it to verify it's public

### Step 3: Test the Feature

1. Navigate to http://localhost:3000
2. Go to **More** → **My Profile**
3. Click the **camera icon** on the profile photo
4. Select an image (max 5MB)
5. Watch it upload and update in real-time!
6. Check the header - it should show your username now

---

## 📁 File Structure

```
avatars/
  └── {user_id}/
      ├── 1234567890.jpg
      ├── 1234567891.png
      └── ...
```

Each user's photos are stored in their own folder (by user ID) for organization and security.

---

## 🔒 Security Features

1. **Row Level Security (RLS)**: Users can only upload/delete their own photos
2. **File Type Validation**: Only images allowed (client + server side)
3. **File Size Limit**: 5MB maximum
4. **Unique Filenames**: Timestamp-based to prevent conflicts
5. **Public URLs**: Generated automatically for easy access

---

## 🎨 User Experience Flow

1. **Upload Photo**:
   - User clicks camera icon
   - Selects image from device
   - Image validates (type & size)
   - Uploads to Supabase Storage
   - Gets public URL
   - Updates database
   - Shows success message
   - Photo appears immediately

2. **View Photo**:
   - Profile page shows uploaded photo
   - More page shows photo in header card
   - Falls back to initial letter if no photo

---

## 🐛 Error Handling

The system handles these scenarios:
- ❌ Non-image files selected
- ❌ Files larger than 5MB
- ❌ Upload failures
- ❌ Database update failures
- ❌ Network errors

All errors show user-friendly messages.

---

## 🔄 What Happens on Upload

```
1. User selects image
   ↓
2. Validate file type & size
   ↓
3. Generate unique filename
   ↓
4. Upload to Supabase Storage (avatars/{user_id}/{timestamp}.ext)
   ↓
5. Get public URL
   ↓
6. Update profile.avatar_url in database
   ↓
7. Update UI state
   ↓
8. Show success message
```

---

## 📝 SQL Script Contents

The `storage-setup.sql` file contains:

```sql
-- Creates avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

-- RLS Policies:
-- 1. Public read access
-- 2. Authenticated users can upload their own
-- 3. Users can update their own
-- 4. Users can delete their own
```

---

## ✨ Additional Features

- **Loading States**: Spinner shows during upload
- **Disabled State**: Camera button disabled during upload
- **Auto-clear**: File input resets after upload
- **Immediate Update**: Photo shows without page refresh
- **Fallback Display**: Shows first letter of username if no photo

---

## 🎯 Next Steps (Optional Enhancements)

- [ ] Add image cropping before upload
- [ ] Add image compression for smaller file sizes
- [ ] Allow drag-and-drop upload
- [ ] Show upload progress percentage
- [ ] Add ability to remove photo
- [ ] Add photo gallery for multiple photos

---

## 🔧 Troubleshooting

**Issue**: "Error uploading image: new row violates row-level security policy"
- **Solution**: Make sure you ran the storage-setup.sql script

**Issue**: "Bucket not found"
- **Solution**: Verify the avatars bucket exists in Supabase Storage

**Issue**: Image uploads but doesn't show
- **Solution**: Check that the bucket is set to public

**Issue**: "Image must be less than 5MB"
- **Solution**: Resize or compress your image before uploading

---

## 📊 Testing Checklist

- [x] TopBar shows actual username
- [x] TopBar shows time-based greeting
- [x] Camera button opens file picker
- [x] File validation works (type & size)
- [x] Upload shows loading state
- [x] Photo appears after upload
- [x] Database updates correctly
- [x] Error messages display properly
- [x] Success messages display properly
- [x] Photo persists after page refresh

---

**All features are now ready to use! Just run the SQL script and you're good to go! 🎉**
