// Standard ZIP with stored entries: originals remain byte-for-byte unchanged.
export function makeZip(files:{name:string;bytes:Uint8Array}[]):Blob {
 const encoder=new TextEncoder();const locals:Uint8Array[]=[];const central:Uint8Array[]=[];let offset=0;
 const crc=(bytes:Uint8Array)=>{let n=0xffffffff;for(const b of bytes){n^=b;for(let i=0;i<8;i++)n=(n>>>1)^((n&1)?0xedb88320:0);}return (n^0xffffffff)>>>0;};
 for(const file of files){const name=encoder.encode(file.name);const checksum=crc(file.bytes);const local=new Uint8Array(30+name.length);const l=new DataView(local.buffer);l.setUint32(0,0x04034b50,true);l.setUint16(4,20,true);l.setUint16(6,0x800,true);l.setUint16(12,33,true);l.setUint32(14,checksum,true);l.setUint32(18,file.bytes.length,true);l.setUint32(22,file.bytes.length,true);l.setUint16(26,name.length,true);local.set(name,30);locals.push(local,file.bytes);
 const entry=new Uint8Array(46+name.length);const c=new DataView(entry.buffer);c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x800,true);c.setUint16(14,33,true);c.setUint32(16,checksum,true);c.setUint32(20,file.bytes.length,true);c.setUint32(24,file.bytes.length,true);c.setUint16(28,name.length,true);c.setUint32(42,offset,true);entry.set(name,46);central.push(entry);offset+=local.length+file.bytes.length;}
 const end=new Uint8Array(22);const e=new DataView(end.buffer);e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,central.reduce((n,v)=>n+v.length,0),true);e.setUint32(16,offset,true);
 return new Blob([...locals,...central,end] as BlobPart[],{type:'application/zip'});
}
