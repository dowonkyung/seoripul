(function(){
 const host=document.querySelector('#sitemap-content');
 function link(name){const a=document.createElement('a');a.textContent=name;a.href=name==='새소식'?'news.html':'#none';if(name!=='새소식')a.dataset.page=name;return a}
 for(const [name,groups] of Object.entries(menu)){
  const section=document.createElement('section');section.className='content-section';const h=document.createElement('h3');h.textContent=name;section.append(h);
  const list=document.createElement('ul');list.className='portal-sitemap';
  for(const [title,children] of Object.entries(groups)){const li=document.createElement('li');li.append(link(title));if(children.length){const sub=document.createElement('ul');sub.className='normal-type dot';for(const child of children){const row=document.createElement('li');row.append(link(child));sub.append(row)}li.append(sub)}list.append(li)}section.append(list);host.append(section)
 }
 const status=document.querySelector('#map-status');document.querySelector('#copy-link').onclick=async e=>{e.preventDefault();try{await navigator.clipboard.writeText(location.href);status.textContent='링크를 복사했습니다.'}catch{status.textContent='주소창에서 링크를 복사해 주세요.'}};
 document.querySelector('#share-link').onclick=async e=>{e.preventDefault();try{if(navigator.share)await navigator.share({title:document.title,url:location.href});else document.querySelector('#copy-link').click()}catch{}};
 document.querySelector('#print-page').onclick=e=>{e.preventDefault();window.print()};
})();
