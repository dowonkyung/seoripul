(function(){'use strict';
if(window.PostRoutes){const api={get id(){return window.PostRoutes.id},postUrl:window.PostRoutes.postUrl,boardUrl:window.PostRoutes.boardUrl};api.ready=window.PostRoutes.ready.then(()=>api);window.CivilRoute=api;return;}

const board=document.body?.dataset.communityBoard,isCivil=board==='civil-board',write=document.body?.dataset.boardMode==='write',params=new URLSearchParams(location.search);
let routes={},active=new Set();
function postUrl(key,id){const number=routes[id];return key==='civil-board'&&active.has(id)&&Number.isSafeInteger(number)?'/civil-board/'+number+'/':'/'+key+'.html?id='+encodeURIComponent(id)}
function base(){if(!document.querySelector('base')){const tag=document.createElement('base');tag.href='/';document.head.prepend(tag)}}
const api={id:params.get(write?'edit':'id'),postUrl,boardUrl:key=>key==='civil-board'?'/civil-board/':key+'.html'};
api.ready=(async()=>{if(!isCivil)return api;try{const response=await fetch('/civil-board/routes.json',{cache:'no-store'});if(response.ok){const registry=await response.json();routes=registry.posts||{};active=new Set(registry.active||[])}}catch{}
const number=/^\/civil-board\/([1-9]\d*)\/?$/.exec(location.pathname)?.[1];
if(number){api.id=document.body.dataset.civilPostId||Object.keys(routes).find(id=>active.has(id)&&String(routes[id])===number)||null}
if(!write&&api.id){const target=postUrl(board,api.id);if(target.startsWith('/civil-board/')){base();history.replaceState(null,'',target+location.hash);document.querySelector('a.skip')?.setAttribute('href',target+'#main')}}
return api})();
window.CivilRoute=api;
})();