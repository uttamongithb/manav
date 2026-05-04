const ImageKit = require('imagekit');
const ik = new ImageKit({
  publicKey: 'UA04X/l4XLIdxB55duBbzKo1/4E=',
  privateKey: 'QapLPzHL+nBJrHcHQuQqNk3J1Vk=',
  urlEndpoint: 'https://ik.imagekit.io/sx2nvlyos'
});

ik.upload({
  file: Buffer.from('hello'),
  fileName: 'test.txt',
  folder: '/media'
}).then(console.log).catch(e => console.error("v6 error:", e.message));
