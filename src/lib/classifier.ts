export function tokens(text:string){return text.toLowerCase().normalize('NFKC').match(/[\p{L}\p{N}]+/gu)||[];}
export function classify(text:string,examples:{text:string,category:string}[]){
 const all=examples.map(e=>tokens(e.text));const df=new Map<string,number>();for(const ts of all)for(const t of new Set(ts))df.set(t,(df.get(t)||0)+1);
 function vector(s:string){const v=new Map<string,number>();tokens(s).slice(0,12000).forEach((t,i)=>{if(t.length>1)v.set(t,(v.get(t)||0)+(i<10?3:1));});for(const [t,n]of v)v.set(t,n* (1+Math.log((examples.length+1)/((df.get(t)||0)+1))));return v;}
 const q=vector(text),norm=(v:Map<string,number>)=>Math.sqrt([...v.values()].reduce((a,b)=>a+b*b,0));const qn=norm(q);const scores=new Map<string,number>();for(const e of examples){const v=vector(e.text);let dot=0;for(const [t,w]of q)dot+=w*(v.get(t)||0);const score=dot/(qn*norm(v)||1);scores.set(e.category,Math.max(scores.get(e.category)||0,score));}const ranked=[...scores].sort((a,b)=>b[1]-a[1]);const top=ranked[0];return {category:top&&top[1]>0?top[0]:null,score:top?.[1]||0};
}
