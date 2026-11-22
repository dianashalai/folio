export type Invoice = {amount:number|null; currency:string|null; date:string|null};
export function invoiceFields(text:string):Invoice {
 const currencies=[...new Set((text.match(/\b(?:EUR|USD|GBP|CHF)\b|€|£|\$/g)||[]).map(v=>({'€':'EUR','£':'GBP','$':'USD'}[v]||v)))];
 const currency=currencies.length===1?currencies[0]:null;
 const totals=[...text.matchAll(/(?:grand\s+total|total\s+(?:amount|due)|amount\s+due|balance\s+due|rechnungsbetrag|gesamtbetrag|endbetrag|bruttobetrag|gesamtsumme|^\s*total\b)\s*[:\-]?\s*(?:(?:EUR|USD|GBP|CHF|€|£|\$)\s*)?([0-9][0-9., ']*)(?:\s*(?:EUR|USD|GBP|CHF|€|£|\$))?/gim)];
 const values=totals.map(m=>{let v=m[1].trim().replace(/[ ']/g,'');const decimal=v.match(/[.,](\d{2})$/);if(decimal)v=v.slice(0,-3).replace(/[.,]/g,'')+'.'+decimal[1];else v=v.replace(/[.,]/g,'');return Number(v);}).filter(Number.isFinite);
 const unique=[...new Set(values)];
 const match=text.match(/(?:invoice\s+date|date\s+of\s+invoice|rechnungsdatum|belegdatum|^\s*date|^\s*datum)\s*:?\s*(\d{4}-\d{2}-\d{2}|\d{1,2}[./]\d{1,2}[./]\d{4})/im);
 let date:string|null=null;
 if(match){const raw=match[1];if(/^\d{4}-/.test(raw))date=raw;else{const [d,m,y]=raw.split(/[./]/);if(raw.includes('.')||Number(d)>12)date=`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;}
 if(date){const parsed=new Date(date+'T00:00:00Z');if(!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==date)date=null;}}
 return {amount:unique.length===1?unique[0]:null,currency,date};
}
export function documentSummary(text:string):string {
 const lines=text.split(/\n+/).map(s=>s.trim()).filter(s=>s.length>20);
 const ranked=lines.map((line,i)=>({line,i,score:(/invoice|rechnung|treatment|behandlungsplan|settlement|denial|insurance|versicherung|payment|zahlung|total|gesamt|subject|betreff/i.test(line)?3:0)+(i<8?1:0)}));
 const selected=ranked.sort((a,b)=>b.score-a.score).slice(0,3).sort((a,b)=>a.i-b.i).map(x=>x.line).join(' ');
 const result=selected||text.trim();return result.length>420?result.slice(0,417)+'…':result;
}
