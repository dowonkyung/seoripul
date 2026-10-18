(function(){
 'use strict';let timer;const $=s=>document.querySelector(s);function message(text){const toast=$('#board-toast');toast.textContent=text;toast.classList.add('visible');clearTimeout(timer);timer=setTimeout(()=>toast.classList.remove('visible'),3000)}
 $('#copy-link').onclick=async e=>{e.preventDefault();try{await navigator.clipboard.writeText(await window.PostShare.url());message('링크를 복사했습니다.')}catch{message('주소창의 링크를 복사해 주세요.')}};
 $('#share-link').onclick=async e=>{e.preventDefault();try{if(navigator.share)await navigator.share({title:document.title,url:await window.PostShare.url()});else $('#copy-link').click()}catch(e){if(e.name!=='AbortError')message('공유하지 못했습니다. 주소창의 링크를 복사해 주세요.')}};
 $('#print-page').onclick=e=>{e.preventDefault();window.print()};
})();
