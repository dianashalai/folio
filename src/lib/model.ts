export type Category={id:string;name:string};
export type SeedModel={format:'folio-hashed-tfidf-v1';exportedAt:string;categories:Category[];exampleCount:number;vocabulary:string[];documentFrequency:number[];examples:{category:string;terms:[number,number][]}[]};
export type TrainingExample={text:string;category:string|null;trained:number};
const words=(s:string)=>s.toLowerCase().normalize('NFKC').match(/[\p{L}\p{N}]+/gu)||[];
const cache=new Map<string,Promise<string>>();
async function digest(token:string){
  let value=cache.get(token);
  if(!value){value=crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)).then(b=>Array.from(new Uint8Array(b),v=>v.toString(16).padStart(2,'0')).join(''));cache.set(token,value);if(cache.size>50000)cache.clear();}
  return value;
}
async function hashedWords(text:string){return Promise.all(words(text).map(t=>t.length>1?digest(t):Promise.resolve('')));}
function counts(ts:string[]){const v=new Map<string,number>();ts.slice(0,12000).forEach((t,i)=>{if(t)v.set(t,(v.get(t)||0)+(i<10?3:1));});return v;}
export async function prepareClassifier(model:SeedModel,local:TrainingExample[]=[]){
  const extra=local.filter(e=>e.trained&&e.category&&e.text.trim());
  const df=new Map(model.vocabulary.map((token,i)=>[token,model.documentFrequency[i]]));
  const vectors=model.examples.map(e=>({category:e.category,vector:new Map(e.terms.map(([i,n])=>[model.vocabulary[i],n]))}));
  for(const e of extra){const ts=await hashedWords(e.text);for(const t of new Set(ts))if(t)df.set(t,(df.get(t)||0)+1);vectors.push({category:e.category!,vector:counts(ts)});}
  const n=model.exampleCount+extra.length;
  function weighted(v:Map<string,number>){return new Map([...v].map(([t,w])=>[t,w*(1+Math.log((n+1)/((df.get(t)||0)+1)))]));}
  const norm=(v:Map<string,number>)=>Math.sqrt([...v.values()].reduce((a,b)=>a+b*b,0));
  const prepared=vectors.map(e=>{const vector=weighted(e.vector);return {...e,vector,norm:norm(vector)};});
  return async(text:string)=>{
    const q=weighted(counts(await hashedWords(text))),qn=norm(q),scores=new Map<string,number>();
    for(const e of prepared){let dot=0;for(const [t,w]of q)dot+=w*(e.vector.get(t)||0);const score=dot/(qn*e.norm||1);scores.set(e.category,Math.max(scores.get(e.category)||0,score));}
    const ranked=[...scores].sort((a,b)=>b[1]-a[1]);
    return {category:ranked[0]&&ranked[0][1]>0?ranked[0][0]:null,score:ranked[0]?.[1]||0,ranked};
  };
}
