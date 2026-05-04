(async () => {
  try {
    // Test 1: Login
    const loginRes = await fetch('http://localhost:3001/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@INSAAN.local', password: 'Admin@12345' }),
    });

    console.log('1️⃣  LOGIN:', loginRes.status === 201 ? '✅ OK' : '❌ FAILED');
    if (!loginRes.ok) {
      console.log('   Error:', await loginRes.text());
      return;
    }

    const { token, avatarUrl: currentAvatar } = await loginRes.json();
    console.log('   Current avatar:', currentAvatar);

    // Test 2: Upload new avatar
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+XkK8AAAAASUVORK5CYII=';
    const bytes = Buffer.from(pngBase64, 'base64');
    const formData = new FormData();
    formData.append('file', new Blob([bytes], { type: 'image/png' }), 'avatar-test.png');

    const uploadRes = await fetch('http://localhost:3001/profile/avatar', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    console.log('2️⃣  UPLOAD:', uploadRes.status === 201 ? '✅ OK' : '❌ FAILED');
    if (!uploadRes.ok) {
      console.log('   Error:', await uploadRes.text());
      return;
    }

    const uploadBody = await uploadRes.json();
    console.log('   New avatar URL:', uploadBody.avatarUrl);
    
    // Verify it's a real ImageKit URL
    if (uploadBody.avatarUrl.includes('ik.imagekit.io')) {
      console.log('3️⃣  IMAGEKIT STORAGE: ✅ OK (URL verified in ImageKit domain)');
    } else {
      console.log('3️⃣  IMAGEKIT STORAGE: ❌ FAILED (URL not from ImageKit)');
    }

  } catch (err) {
    console.log('❌ Test Error:', err.message);
    console.log(err.stack);
  }
})();
