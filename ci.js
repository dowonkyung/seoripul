(function(){
'use strict';const dialog=document.querySelector('#ci-download-dialog'),open=document.querySelector('[data-ci-download-open]');if(!dialog||!open)return;
open.onclick=()=>{if(!dialog.open)dialog.showModal()};dialog.querySelector('[data-ci-download-close]').onclick=()=>dialog.close();
dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()});
})();

