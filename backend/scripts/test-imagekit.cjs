const ImageKit = require('@imagekit/nodejs');
const ik = new ImageKit({
  publicKey: 'UA04X/l4XLIdxB55duBbzKo1/4E=',
  privateKey: 'QapLPzHL+nBJrHcHQuQqNk3J1Vk=',
  urlEndpoint: 'https://ik.imagekit.io/sx2nvlyos'
});

async function run() {
  try {
    const res = await ik.upload({
      file: Buffer.from('hello'),
      fileName: 'test.txt',
      folder: '/media'
    });
    console.log("Success with ik.upload:", res.url);
  } catch (e) {
    console.error("Error with ik.upload:", e.message);
  }

  try {
    const res2 = await ik.files.upload({
      file: Buffer.from('hello'),
      fileName: 'test.txt',
      folder: '/media'
    });
    console.log("Success with ik.files.upload:", res2.url);
  } catch (e) {
    console.error("Error with ik.files.upload:", e.message);
  }
}
run();