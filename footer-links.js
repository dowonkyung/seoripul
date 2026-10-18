(function(){
 const badges=window.SEORIPUL_FOOTER_BADGES||[];
 document.querySelectorAll('footer .address-map ul li a').forEach((a,i)=>{
  const badge=badges[i],img=a.querySelector('img');if(!badge||!img)return;
  if(badge.image)img.src=badge.image;if(badge.alt)img.alt=badge.alt;
  const href=String(badge.href||'').trim();
  if(href&&(!/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href)||/^https?:\/\//i.test(href))){
   a.href=href;a.removeAttribute('data-page');
   if(badge.newTab){a.target='_blank';a.rel='noopener noreferrer';a.title='새 창 열림'}else{a.removeAttribute('target');a.removeAttribute('rel');a.removeAttribute('title')}
  }
 });
})();
