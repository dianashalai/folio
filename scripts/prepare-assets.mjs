import {mkdir,copyFile,readdir} from 'node:fs/promises';
await mkdir('public/ocr',{recursive:true});
await copyFile('node_modules/pdfjs-dist/build/pdf.worker.min.mjs','public/pdf.worker.min.mjs');
await copyFile('node_modules/tesseract.js/dist/worker.min.js','public/ocr/worker.min.js');
for(const name of await readdir('node_modules/tesseract.js-core')) {
  if(/\.wasm(\.js)?$/.test(name)) await copyFile('node_modules/tesseract.js-core/'+name,'public/ocr/'+name);
}
await mkdir('public/ocr/lang',{recursive:true});
for(const language of ['eng','deu'])await copyFile(`node_modules/@tesseract.js-data/${language}/4.0.0_best_int/${language}.traineddata.gz`,`public/ocr/lang/${language}.traineddata.gz`);
