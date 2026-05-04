const fs = require('fs');

async function run() {
  const token = fs.readFileSync('test-token.txt', 'utf8');
  
  try {
    const res = await fetch('http://localhost:3001/profile', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Updated Name',
        role: 'Member',
        visibility: 'public',
        city: '',
        state: '',
        country: '',
        timezone: '',
        bio: '',
        avatarUrl: 'https://example.com/avatar.jpg'
      }),
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', text);
  } catch (e) {
    console.error('Fetch error:', e);
  }
}
run();
