import assert from 'node:assert/strict';
import {readPDFText} from '../pdf-text.mjs';
const descriptor=Object.getOwnPropertyDescriptor(ReadableStream.prototype,Symbol.asyncIterator);
try{
 delete ReadableStream.prototype[Symbol.asyncIterator];
 const stream=new ReadableStream({start(c){c.enqueue({items:[{str:'첫째 쪽'},{type:'beginMarkedContent'}]});c.enqueue({items:[{str:'둘째 문장'}]});c.close()}});
 const page={streamTextContent:()=>stream,getTextContent(){throw Error('Incompatible API must not be called')}};
 assert.equal(await readPDFText(page),'첫째 쪽 둘째 문장');assert.equal(stream.locked,false);
 let cancelled=false,released=false;
 await assert.rejects(readPDFText({streamTextContent:()=>({getReader:()=>({read:async()=>{throw Error('stream failed')},cancel:async()=>{cancelled=true},releaseLock(){released=true}})})}),/stream failed/);
 assert.equal(cancelled,true);assert.equal(released,true);
 assert.equal(await readPDFText({isPureXfa:true,getTextContent:async()=>({items:[{str:'XFA 문서'}]})}),'XFA 문서');
 console.log('PASS: Safari-style stream without async iterator; all chunks read; reader released; error cleanup; XFA fallback');
}finally{if(descriptor)Object.defineProperty(ReadableStream.prototype,Symbol.asyncIterator,descriptor)}

