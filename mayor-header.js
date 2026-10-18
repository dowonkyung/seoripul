const gnbDim=document.createElement('div');gnbDim.className='gnb-dim';gnbDim.hidden=true;gnbDim.setAttribute('aria-hidden','true');document.querySelector('header').after(gnbDim);
const menu=window.SEORIPUL_NAV_MENU||{"구청장입니다":{"인사말":[],"프로필":[],"취임사":[]},"구정24시":{"구정갤러리":["포토갤러리","영상갤러리"],"구청장동정":[],"언론기사":[]},"공약과 실천":{"공약실천":["공약관리"],"매니페스토":["선거공약"]}};
const $=s=>document.querySelector(s);
const navList=document.querySelector('#gnb>ul');
for(const [name,groups] of Object.entries(menu)){
 const li=document.createElement('li'),a=document.createElement('a');a.href='#none';a.textContent=name;a.setAttribute('aria-expanded','false');a.title='하위 메뉴 열기';
 const panel=document.createElement('div');panel.className='gnb-wrap type-depth3';panel.id='gnb-panel-'+navList.children.length;a.setAttribute('aria-controls',panel.id);
 const inner=document.createElement('div');inner.className='inner';const wrap=document.createElement('div');wrap.className='wrap';const ul=document.createElement('ul');
 for(const [title,children] of Object.entries(groups)){
  const item=document.createElement('li'),link=document.createElement('a');link.href='#none';link.textContent=title;link.dataset.page=title;item.append(link);
  if(children.length){delete link.dataset.page;link.setAttribute('aria-expanded','false');const depth=document.createElement('div');depth.className='depth3-wrap';const list=document.createElement('ul');for(const child of children){const row=document.createElement('li'),childLink=document.createElement('a');childLink.href='#none';childLink.textContent=child;childLink.dataset.page=child;row.append(childLink);list.append(row)}const titleBlock=document.createElement('div');titleBlock.className='tit';const titleLink=document.createElement('a');titleLink.href='#none';titleLink.dataset.page=title;titleLink.append(document.createTextNode(title));titleBlock.append(titleLink);depth.append(titleBlock,list);item.append(depth);const select=()=>{[...ul.children].forEach(row=>{row.classList.remove('active');if(row.querySelector('.depth3-wrap'))row.firstElementChild.setAttribute('aria-expanded','false');else row.firstElementChild.removeAttribute('aria-expanded')});item.classList.add('active');link.setAttribute('aria-expanded','true')};link.onclick=e=>{e.preventDefault();if(matchMedia('(max-width:63.99em)').matches){link.setAttribute('aria-expanded','true');return}select()};if(ul.children.length===0){item.classList.add('active');link.setAttribute('aria-expanded','true')}}ul.append(item);
 }
 wrap.append(ul);inner.append(wrap);panel.append(inner);li.append(a,panel);navList.append(li);
 a.onclick=e=>{e.preventDefault();if(matchMedia('(max-width:63.99em)').matches&&li.classList.contains('active'))return;const active=li.classList.contains('active');closeGnb();li.classList.toggle('active',!active);a.setAttribute('aria-expanded',String(!active));gnbDim.hidden=active};
}
function closeGnb(){gnbDim.hidden=true;document.querySelectorAll('#gnb>ul>li').forEach(li=>{li.classList.remove('active');li.firstElementChild.setAttribute('aria-expanded','false')})}
const bottom=document.querySelector('.header-bottom'),all=document.querySelector('#menuAll');
const mobileMenuMedia=matchMedia('(max-width:63.99em)');let menuInert=[];
all.href='mayor.html#sitemap';
function syncMenuButton(){if(mobileMenuMedia.matches){all.setAttribute('aria-expanded',String(bottom.classList.contains('all-open')));all.setAttribute('aria-controls','header-bottom')}else{closeAll();all.setAttribute('aria-expanded','false');all.setAttribute('aria-controls','sitemapPopup');all.setAttribute('aria-haspopup','dialog')}}
function openMobileMenu(){closeDropdowns();closeGnb();bottom.classList.add('all-open');document.documentElement.classList.add('mobile-menu-open');all.setAttribute('aria-expanded','true');bottom.setAttribute('role','dialog');bottom.setAttribute('aria-modal','true');bottom.setAttribute('aria-label','전체메뉴');menuInert=[...document.querySelectorAll('main,footer,.header-top,.header-middle .bottom-menu')].map(e=>({e,old:e.inert}));menuInert.forEach(x=>x.e.inert=true);const first=navList.querySelector(':scope>li.current-section')||navList.firstElementChild;first.classList.add('active');first.firstElementChild.setAttribute('aria-expanded','true');gnbDim.hidden=true;bottom.querySelectorAll('.gnb-wrap .wrap>ul>li>a[aria-expanded]').forEach(a=>a.setAttribute('aria-expanded','true'));document.querySelector('.mobile-close a').focus()}
all.onclick=e=>{e.preventDefault();if(mobileMenuMedia.matches)openMobileMenu();else openOfficeSitemap()};
mobileMenuMedia.addEventListener('change',syncMenuButton);syncMenuButton();
document.addEventListener('click',e=>{if(bottom.classList.contains('all-open')&&e.target.closest('.mobile-login a'))closeAll()},true);
document.addEventListener('keydown',e=>{if(e.key!=='Tab'||!bottom.classList.contains('all-open')||document.querySelector('dialog[open]'))return;const links=[...document.querySelectorAll('.header-bottom a,.header-bottom button,.header-middle .top-menu a')].filter(a=>a.getClientRects().length&&!a.closest('[hidden]'));const first=links[0],last=links[links.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}});
function closeAll(){bottom.classList.remove('all-open');document.documentElement.classList.remove('mobile-menu-open');bottom.removeAttribute('role');bottom.removeAttribute('aria-modal');bottom.removeAttribute('aria-label');if(typeof menuInert!=='undefined'){menuInert.forEach(x=>x.e.inert=x.old);menuInert=[]}if(mobileMenuMedia.matches)all.setAttribute('aria-expanded','false');bottom.querySelectorAll('.gnb-wrap .wrap>ul>li>a[aria-expanded]').forEach(a=>a.setAttribute('aria-expanded',String(a.parentElement.classList.contains('active'))));closeGnb()}
document.querySelector('.mobile-close a').onclick=e=>{e.preventDefault();closeAll();all.focus()};
const toggles=document.querySelectorAll('.top-menu .button-bottom,.total-search');
toggles.forEach(a=>a.onclick=e=>{e.preventDefault();const open=a.getAttribute('aria-expanded')!=='true';closeDropdowns();a.setAttribute('aria-expanded',String(open));document.getElementById(a.getAttribute('aria-controls')).hidden=!open;if(a.classList.contains('total-search')&&open)document.querySelector('#applyTotalSearchTop').focus()});
function closeDropdowns(){toggles.forEach(a=>{a.setAttribute('aria-expanded','false');document.getElementById(a.getAttribute('aria-controls')).hidden=!(a.classList.contains('total-search')&&matchMedia('(min-width:1024px)').matches)})}
document.addEventListener('click',e=>{if(!e.target.closest('.header-bottom')&&!e.target.closest('#menuAll')&&!(bottom.classList.contains('all-open')&&e.target.closest('.top-menu')))closeAll();if(!e.target.closest('.top-menu')&&!e.target.closest('.total-search')&&!e.target.closest('.header-search'))closeDropdowns();if(e.target.closest('a[href="#none"]'))e.preventDefault()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeAll();closeDropdowns();all.focus()}});
document.querySelectorAll('[data-zoom]').forEach(a=>a.onclick=e=>{e.preventDefault();document.body.style.zoom=a.dataset.zoom;document.querySelectorAll('[data-zoom]').forEach(z=>z.classList.toggle('active',z===a));closeDropdowns()});
function headerSearch(){const input=document.querySelector('#applyTotalSearchTop'),q=input.value.trim();if(!q){input.focus();return}location.href='search.html?q='+encodeURIComponent(q)}
document.querySelector('.header-search-btn').onclick=e=>{e.preventDefault();headerSearch()};document.querySelector('#applyTotalSearchTop').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();headerSearch()}};

function detail(title,text){$('#detail-title').textContent=title;$('#detail-body').textContent=text;if(!$('#detail').open)$('#detail').showModal()}
document.addEventListener('click',e=>{const a=e.target.closest('[data-page]');if(a){e.preventDefault();detail(a.dataset.page,'이 메뉴의 상세 서비스는 준비 중입니다.')}});$('#close-detail').onclick=()=>$('#detail').close();

// The reference shows an inline desktop search and a toggle on small screens.
const headerSearchMedia=matchMedia('(min-width:1024px)');
function syncHeaderSearch(){document.querySelector('#header-search').hidden=!headerSearchMedia.matches;document.querySelector('.total-search').setAttribute('aria-expanded','false')}
headerSearchMedia.addEventListener('change',syncHeaderSearch);syncHeaderSearch();
const searchClose=document.createElement('button');searchClose.type='button';searchClose.className='header-search-close';searchClose.textContent='×';searchClose.setAttribute('aria-label','통합검색 닫기');searchClose.onclick=()=>{closeDropdowns();document.querySelector('.total-search').focus()};document.querySelector('#header-search').append(searchClose);


// Desktop all-menu follows the reference sitemap popup; mobile keeps its header menu.
const officeSitemap=document.createElement('dialog');officeSitemap.id='sitemapPopup';officeSitemap.className='office-sitemap-popup';officeSitemap.setAttribute('aria-labelledby','office-sitemap-title');
const sitemapTitle=document.createElement('h2');sitemapTitle.id='office-sitemap-title';sitemapTitle.textContent='전체메뉴';
const sitemapClose=document.createElement('button');sitemapClose.type='button';sitemapClose.className='office-sitemap-close';sitemapClose.setAttribute('aria-label','전체메뉴 닫기');sitemapClose.innerHTML='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 5 14 14M19 5 5 19" stroke="#464C53" stroke-width="1.6" stroke-linecap="round"/></svg>';
const sitemapBody=document.createElement('nav');sitemapBody.className='popup-body';sitemapBody.setAttribute('aria-label','열린구청장실 전체메뉴');
const sitemapList=document.createElement('ul');sitemapList.className='portal-sitemap';
const officeRoutes={'구청장입니다':'mayor.html#greeting','인사말':'mayor.html#greeting','프로필':'mayor.html#profile','취임사':'mayor.html#inaugural','구정24시':'mayor.html#gallery','구정갤러리':'mayor.html#gallery','포토갤러리':'photo.html','영상갤러리':'video.html','구청장동정':'activity.html','언론기사':'media.html','공약과 실천':'mayor.html#promise','공약실천':'mayor.html#promise','공약관리':'mayor.html#promise','매니페스토':'mayor.html#manifesto','선거공약':'mayor.html#election'};
function sitemapLink(text){const a=document.createElement('a');a.textContent=text;a.href=officeRoutes[text]||'mayor.html';return a}
for(const [group,items]of Object.entries(menu)){const column=document.createElement('li');column.append(sitemapLink(group));const list=document.createElement('ul');list.className='normal-type dot';for(const[label,children]of Object.entries(items)){const item=document.createElement('li');item.append(sitemapLink(label));if(children.length){const nested=document.createElement('ul');nested.className='normal-type hyphen';for(const child of children){const li=document.createElement('li');li.append(sitemapLink(child));nested.append(li)}item.append(nested)}list.append(item)}column.append(list);sitemapList.append(column)}
sitemapList.style.setProperty('--sitemap-columns',Object.keys(menu).length);
sitemapBody.append(sitemapList);officeSitemap.append(sitemapTitle,sitemapClose,sitemapBody);document.body.append(officeSitemap);
let sitemapOverflow='';
function closeOfficeSitemap(){if(officeSitemap.open)officeSitemap.close()}
function openOfficeSitemap(){if(mobileMenuMedia.matches){openMobileMenu();return}if(officeSitemap.open)return;closeAll();closeDropdowns();sitemapOverflow=document.documentElement.style.overflow;document.documentElement.style.overflow='hidden';all.setAttribute('aria-expanded','true');officeSitemap.showModal();sitemapClose.focus()}
officeSitemap.addEventListener('close',()=>{document.documentElement.style.overflow=sitemapOverflow;all.setAttribute('aria-expanded','false');all.focus()});
sitemapClose.onclick=closeOfficeSitemap;
officeSitemap.addEventListener('click',e=>{if(e.target.closest('a'))closeOfficeSitemap();else if(e.target===officeSitemap){const rect=officeSitemap.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)closeOfficeSitemap()}});
mobileMenuMedia.addEventListener('change',()=>{if(officeSitemap.open)closeOfficeSitemap()});
window.OfficeSitemap={open:openOfficeSitemap,close:closeOfficeSitemap};
