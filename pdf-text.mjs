// Use getReader() for Safari/WebKit versions without ReadableStream async iteration.
export async function readPDFText(page){
 if(page.isPureXfa)return (await page.getTextContent()).items.map(item=>item.str||'').join(' ');
 const reader=page.streamTextContent().getReader(),parts=[];let finished=false;
 try{for(;;){const {value,done}=await reader.read();if(done){finished=true;break}for(const item of value.items||[])if(typeof item.str==='string')parts.push(item.str)}return parts.join(' ')}
 finally{try{if(!finished)await reader.cancel()}finally{reader.releaseLock()}}
}
