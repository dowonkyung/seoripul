(async function(){
 const host=document.querySelector('#file-preview'),params=new URLSearchParams(location.search),store=window.BoardStore;let asset,original;
 function fail(message){host.replaceChildren();const p=document.createElement('p');p.className='preview-error';p.textContent=message;host.append(p)}
 try{const p=await store.post(params.get('post')||'',false);asset=p.assets.find(a=>a.kind==='attachment'&&a.id===params.get('file'));if(!asset)throw Error('첨부파일을 찾을 수 없습니다.');document.querySelector('#preview-name').textContent=asset.file_name;document.title=asset.file_name+' - 바로보기';const download=document.querySelector('#preview-download');download.disabled=false;download.onclick=async()=>{download.disabled=true;try{original=original||await store.blob(asset);const url=URL.createObjectURL(original),a=document.createElement('a');a.href=url;a.download=asset.file_name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000)}catch(e){fail(e.message)}finally{download.disabled=false}};
 let file=asset;if(asset.previewFile)file={file:asset.previewFile,file_name:asset.previewFile.name};else if(asset.preview_path)file={storage_path:asset.preview_path,file_name:'미리보기.pdf'};
 const blob=await store.blob(file),ext=store.ext(file.file_name);host.replaceChildren();
 if(['png','jpg','jpeg','webp','gif'].includes(ext)){const img=document.createElement('img');img.src=URL.createObjectURL(blob);img.alt=asset.file_name;img.className='preview-image';host.append(img)}
 else if(ext==='pdf'){const {renderPDF}=await import('./pdf-preview.mjs');await renderPDF(host,blob)}
 else if(ext==='txt'){const pre=document.createElement('pre');pre.className='preview-text';pre.textContent=await blob.text();host.append(pre)}
 else if(ext==='hwp'){
  const buffer=await blob.arrayBuffer();if(![208,207,17,224,161,177,26,225].every((value,index)=>new Uint8Array(buffer)[index]===value))throw Error('이 파일은 지원되는 한글 5 문서가 아닙니다. 원본을 다운로드하거나 작성자에게 미리보기 PDF 등록을 요청해 주세요.');
  const frame=document.createElement('iframe');frame.src='hwp-preview.html';frame.sandbox='allow-scripts';frame.title='한글 문서 바로보기';frame.className='file-frame';
  let sent=false;const timeout=setTimeout(()=>fail('HWP 미리보기에 시간이 오래 걸리고 있습니다. 원본을 다운로드하거나 미리보기 PDF를 사용해 주세요.'),20000);
  window.addEventListener('message',event=>{if(event.source!==frame.contentWindow)return;if(event.data?.type==='hwp-ready'&&!sent){sent=true;frame.contentWindow.postMessage({type:'hwp-document',buffer},'*',[buffer])}else if(event.data?.type==='hwp-rendered')clearTimeout(timeout);else if(event.data?.type==='hwp-error'){clearTimeout(timeout);fail('이 HWP 문서는 미리보기를 지원하지 않습니다. 원본 다운로드 또는 미리보기 PDF를 이용해 주세요.')}});host.append(frame);
 }else fail('이 형식은 브라우저 바로보기를 지원하지 않습니다. 원본을 다운로드해 주세요. 작성자가 미리보기 PDF를 추가하면 여기에서 볼 수 있습니다.');
 }catch(e){fail(e.message||'파일을 불러오지 못했습니다.')}
})();
