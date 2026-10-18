// The viewer runs in an opaque-origin sandbox; it cannot access the site's session or storage.
window.addEventListener('message',e=>{if(e.source!==parent||e.data?.type!=='hwp-document'||!(e.data.buffer instanceof ArrayBuffer)||e.data.buffer.byteLength>20*1024*1024)return;try{new window.HwpViewer(document.querySelector('#hwp-viewer'),new Uint8Array(e.data.buffer),{type:'array'});parent.postMessage({type:'hwp-rendered'},'*')}catch{parent.postMessage({type:'hwp-error'},'*')}});
parent.postMessage({type:'hwp-ready'},'*');
