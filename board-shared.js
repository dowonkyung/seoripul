const gnbDim=document.createElement('div');gnbDim.className='gnb-dim';gnbDim.hidden=true;gnbDim.setAttribute('aria-hidden','true');document.querySelector('header').after(gnbDim);
const menu=window.SEORIPUL_NAV_MENU||window.SEORIPUL_NAVIGATION.menu;
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
all.href='sitemap.html';
function syncMenuButton(){if(mobileMenuMedia.matches){all.setAttribute('aria-expanded',String(bottom.classList.contains('all-open')));all.setAttribute('aria-controls','header-bottom')}else{closeAll();all.removeAttribute('aria-expanded');all.removeAttribute('aria-controls')}}
function openMobileMenu(){closeDropdowns();closeGnb();bottom.classList.add('all-open');document.documentElement.classList.add('mobile-menu-open');all.setAttribute('aria-expanded','true');bottom.setAttribute('role','dialog');bottom.setAttribute('aria-modal','true');bottom.setAttribute('aria-label','전체메뉴');menuInert=[...document.querySelectorAll('main,footer,.header-top,.header-middle .bottom-menu')].map(e=>({e,old:e.inert}));menuInert.forEach(x=>x.e.inert=true);const first=navList.querySelector(':scope>li.current-section')||navList.firstElementChild;first.classList.add('active');first.firstElementChild.setAttribute('aria-expanded','true');gnbDim.hidden=true;bottom.querySelectorAll('.gnb-wrap .wrap>ul>li>a[aria-expanded]').forEach(a=>a.setAttribute('aria-expanded','true'));document.querySelector('.mobile-close a').focus()}
all.onclick=e=>{if(mobileMenuMedia.matches){e.preventDefault();openMobileMenu()}else closeGnb()};
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
