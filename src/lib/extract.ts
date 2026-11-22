export async function extractText(file:File,progress:(s:string)=>void):Promise<string>{
 const ext=file.name.split('.').pop()?.toLowerCase();
 if(ext==='txt')return (await file.text()).slice(0,100000);
 if(ext==='docx'){const mammoth=await import('mammoth');return (await mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()})).value.slice(0,100000);}
 const asset=(s:string)=>new URL(import.meta.env.BASE_URL+s,document.baseURI).href;
 let worker:any;async function ocr(image:any){if(!worker){const {createWorker}=await import('tesseract.js');worker=await createWorker(['eng','deu'],1,{workerPath:asset('ocr/worker.min.js'),corePath:asset('ocr/'),langPath:asset('ocr/lang/'),logger:(m:any)=>{if(m.status==='recognizing text')progress('Recognising text '+Math.round(m.progress*100)+'%');else progress('Preparing text recognition…');}});}return (await worker.recognize(image)).data.text;}
 try{if(['png','jpg','jpeg','webp'].includes(ext||''))return (await ocr(file)).slice(0,100000);

 if(ext==='tif'||ext==='tiff'){
   const {decodeTiff}=await import('./tiff');
   let text='';
   for(const page of decodeTiff(await file.arrayBuffer())){
     progress('Page '+page.number+' / '+page.total);
     const source=document.createElement('canvas');source.width=page.width;source.height=page.height;
     const ctx=source.getContext('2d');if(!ctx)throw Error('TIFF_INVALID');
     ctx.putImageData(new ImageData(new Uint8ClampedArray(page.rgba),page.width,page.height),0,0);
     const canvas=document.createElement('canvas');
     const swap=page.orientation>=5&&page.orientation<=8;
     canvas.width=swap?page.height:page.width;canvas.height=swap?page.width:page.height;
     const output=canvas.getContext('2d');if(!output)throw Error('TIFF_INVALID');
     const w=page.width,h=page.height;
     const transforms:Record<number,number[]>={2:[-1,0,0,1,w,0],3:[-1,0,0,-1,w,h],4:[1,0,0,-1,0,h],5:[0,1,1,0,0,0],6:[0,1,-1,0,h,0],7:[0,-1,-1,0,h,w],8:[0,-1,1,0,0,w]};
     const m=transforms[page.orientation];if(m)output.setTransform(m[0],m[1],m[2],m[3],m[4],m[5]);
     output.drawImage(source,0,0);
     try{text+=await ocr(canvas)+'\n';}finally{source.width=0;source.height=0;canvas.width=0;canvas.height=0;}
   }
   return text.slice(0,100000);
 }
 if(ext==='pdf'){const pdfjs=await import('pdfjs-dist');pdfjs.GlobalWorkerOptions.workerSrc=asset('pdf.worker.min.mjs');const task=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())});const pdf=await task.promise;try{if(pdf.numPages>30)throw Error('This demo supports PDF files up to 30 pages.');let text='';for(let i=1;i<=pdf.numPages;i++){progress('Page '+i+' / '+pdf.numPages);const page=await pdf.getPage(i);const content=await page.getTextContent();let t=content.items.map((x:any)=>x.str||'').join(' ');if(t.trim().length<25){const viewport=page.getViewport({scale:1.7});if(viewport.width*viewport.height>25000000)throw Error('This PDF page is too large to process.');const canvas=document.createElement('canvas');canvas.width=viewport.width;canvas.height=viewport.height;await page.render({canvas,canvasContext:canvas.getContext('2d')!,viewport}).promise;t=await ocr(canvas);canvas.width=0;canvas.height=0;}text+=t+'\n';page.cleanup();}return text.slice(0,100000);}finally{await task.destroy();}}
 throw Error('Supported formats: PDF, DOCX, TXT, JPG, PNG, WEBP and TIFF.');}finally{if(worker)await worker.terminate();}
}
