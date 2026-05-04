const jwt = require('jsonwebtoken');
const fs = require('fs');

const token = jwt.sign(
  { sub: 'test-user', displayName: 'Test User' },
  '6964ae6cfc486b07374b61c1984a34e87799a8b7862111e8a5943ad494b2fea414458a52dab71b7fe245894a692519d5',
  { expiresIn: '1h' }
);

fs.writeFileSync('test-token.txt', token);
