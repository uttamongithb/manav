const fs = require('fs');

async function run() {
  const token = fs.readFileSync('test-token.txt', 'utf8');
  
  const formData = new FormData();
  formData.append('file', new Blob(['dummy image content'], { type: 'image/jpeg' }), 'test.jpg');

  try {
    const res = await fetch('http://localhost:3001/profile/avatar', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData,
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', text);
  } catch (e) {
    console.error('Fetch error:', e);
  }
}
run();
