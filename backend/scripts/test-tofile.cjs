const { default: ImageKit, toFile } = require('@imagekit/nodejs');
async function run() {
  try {
    const file = await toFile(Buffer.from('hello'), 'test.txt', { type: 'text/plain' });
    console.log(file);
  } catch (e) {
    console.error("toFile error:", e);
  }
}
run();