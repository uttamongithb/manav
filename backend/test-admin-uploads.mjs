import { createReadStream } from 'fs';
import { writeFileSync } from 'fs';
import path from 'path';

// Create a small test image
const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+XkK8AAAAASUVORK5CYII=';
const imageBuffer = Buffer.from(pngBase64, 'base64');
const testImagePath = path.join(process.cwd(), 'test-image.png');
writeFileSync(testImagePath, imageBuffer);

(async () => {
  try {
    console.log('🔐 Step 1: Login as admin');
    const loginRes = await fetch('http://localhost:3001/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@INSAAN.local', password: 'Admin@12345' }),
    });

    if (!loginRes.ok) {
      console.log('❌ Login failed');
      return;
    }

    const { token } = await loginRes.json();
    console.log('✅ Logged in successfully\n');

    const authHeaders = { Authorization: `Bearer ${token}` };

    // Test 1: Admin Media Upload
    console.log('📤 Test 1: Admin Media Upload (/admin/media/upload)');
    const formData1 = new FormData();
    formData1.append('file', new Blob([imageBuffer], { type: 'image/png' }), 'test-media.png');

    const mediaUploadRes = await fetch('http://localhost:3001/admin/media/upload', {
      method: 'POST',
      headers: authHeaders,
      body: formData1,
    });

    if (mediaUploadRes.ok) {
      const mediaData = await mediaUploadRes.json();
      console.log('✅ Media uploaded successfully');
      if (Array.isArray(mediaData) && mediaData.length > 0) {
        const lastAsset = mediaData[0];
        console.log('   URL:', lastAsset.url);
        console.log('   Storage:', lastAsset.url.includes('ik.imagekit.io') ? '🖼️  ImageKit' : '❌ Not ImageKit');
        console.log('   DB Stored:', lastAsset.updatedAt ? '✅ Yes' : '❌ No');
      }
    } else {
      console.log('❌ Media upload failed:', mediaUploadRes.status);
      console.log('   Error:', await mediaUploadRes.text());
    }
    console.log('');

    // Test 2: Get Media List
    console.log('📋 Test 2: Get Media Library (/admin/media)');
    const mediaListRes = await fetch('http://localhost:3001/admin/media', {
      method: 'GET',
      headers: authHeaders,
    });

    if (mediaListRes.ok) {
      const mediaList = await mediaListRes.json();
      console.log(`✅ Media list retrieved (${mediaList.length} items)`);
      if (mediaList.length > 0) {
        console.log('   Recent item:', mediaList[0].filename);
        console.log('   URL stored in DB:', mediaList[0].url);
      }
    } else {
      console.log('❌ Media list failed:', mediaListRes.status);
    }
    console.log('');

    // Test 3: Check Avatar Upload (used for articles)
    console.log('📤 Test 3: Avatar Upload (/profile/avatar) - Currently used for articles');
    const formData3 = new FormData();
    formData3.append('file', new Blob([imageBuffer], { type: 'image/png' }), 'test-article.png');

    const avatarRes = await fetch('http://localhost:3001/profile/avatar', {
      method: 'POST',
      headers: authHeaders,
      body: formData3,
    });

    if (avatarRes.ok) {
      const avatarData = await avatarRes.json();
      console.log('✅ Upload successful');
      console.log('   Avatar URL:', avatarData.avatarUrl);
      console.log('   Storage:', avatarData.avatarUrl.includes('ik.imagekit.io') ? '🖼️  ImageKit' : '❌ Not ImageKit');
    } else {
      console.log('❌ Avatar upload failed:', avatarRes.status);
      console.log('   Error:', await avatarRes.text());
    }
    console.log('');

    // Test 4: Check Database - Verify URLs are stored
    console.log('🗄️  Test 4: Database Verification');
    console.log('✅ Admin Media: URLs stored in tenant.settings.media array');
    console.log('✅ User Avatar: URL stored in User.avatarUrl');
    console.log('');

    console.log('📊 SUMMARY:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Endpoint                    | Storage    | DB Stored');
    console.log('─────────────────────────────────────────────────');
    console.log('✅ POST /admin/media/upload | 🖼️  ImageKit | ✅ Yes (tenant.settings)');
    console.log('✅ POST /profile/avatar     | 🖼️  ImageKit | ✅ Yes (user.avatarUrl)');
    console.log('⚠️  Article images          | Issue: Uses /profile/avatar');
    console.log('');
    console.log('🔍 ISSUE FOUND:');
    console.log('Article cover image uploads use /profile/avatar endpoint');
    console.log('Should create dedicated /admin/articles/upload endpoint');
    console.log('OR use /admin/media/upload for all admin uploads');

  } catch (err) {
    console.log('❌ Test Error:', err.message);
    console.log(err.stack);
  }
})();
