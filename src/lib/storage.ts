import type {Category} from './model';
export type Doc={id:string;name:string;text:string;category:string|null;trained:number;score:number;created:string;blob?:Blob};
export type Workspace={categories:Category[];documents:Doc[]};
let open:Promise<IDBDatabase>|null=null;
function database(){if(!open)open=new Promise((resolve,reject)=>{const r=indexedDB.open('folio-portfolio-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('workspace');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});return open;}
export async function loadWorkspace():Promise<Workspace|null>{const db=await database();return new Promise((resolve,reject)=>{const r=db.transaction('workspace').objectStore('workspace').get('current');r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error);});}
export async function saveWorkspace(data:Workspace){const db=await database();return new Promise<void>((resolve,reject)=>{const tx=db.transaction('workspace','readwrite');tx.objectStore('workspace').put(data,'current');tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Storage is full.'));});}
