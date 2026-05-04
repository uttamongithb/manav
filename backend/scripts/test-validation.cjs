const ImageKit = require('@imagekit/nodejs');
const ik = new ImageKit({
  publicKey: 'UA04X/l4XLIdxB55duBbzKo1/4E=',
  privateKey: 'QapLPzHL+nBJrHcHQuQqNk3J1Vk=',
  urlEndpoint: 'https://ik.imagekit.io/sx2nvlyos'
});
ik.files.upload({
  file: 123,
  fileName: 'test.txt'
}).catch(e => console.error("Error:", e.message));
