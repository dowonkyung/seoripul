(function(){
 const navigation=window.SEORIPUL_NAVIGATION,routes=navigation.routes;
 const side=document.querySelector('.lnb-list');
 if(side){const markup=navigation.renderSide(location.pathname);if(markup){side.innerHTML=markup;side.setAttribute('aria-label',navigation.sideFor(location.pathname).section+' 하위 메뉴')}}
 
 // Reference LNB: one expanded group, animated height, and keyboard support.
 if(side){
  const groups=[...side.querySelectorAll(':scope>ul>li')].map(row=>({row,trigger:row.querySelector(':scope>.depth2>a'),panel:row.querySelector(':scope>.depth3')})).filter(g=>g.trigger&&g.panel);
  const animations=new Map();
  function setExpanded(group,open,animate=true){
   const {row,trigger,panel}=group,previous=animations.get(panel),from=panel.hidden?0:panel.getBoundingClientRect().height;
   if(previous){previous.cancel();animations.delete(panel)}
   row.classList.toggle('active',open);trigger.setAttribute('aria-expanded',String(open));trigger.title=open?'접기':'펼치기';panel.inert=!open;panel.hidden=false;panel.style.removeProperty('display');panel.style.height='auto';
   if(!animate||matchMedia('(prefers-reduced-motion:reduce)').matches){panel.hidden=!open;return}
   const to=open?panel.scrollHeight:0;
   const animation=panel.animate([{height:from+'px'},{height:to+'px'}],{duration:260,easing:'ease-in-out'});
   animations.set(panel,animation);
   animation.finished.then(()=>{if(animations.get(panel)!==animation)return;panel.hidden=!open;panel.style.height='auto';animations.delete(panel)}).catch(()=>{});
  }
  let opened=false;
  groups.forEach((group,index)=>{const {trigger,panel,row}=group;trigger.classList.add('arrow');trigger.setAttribute('role','button');panel.classList.add('depth');if(!panel.id)panel.id='lnb-depth-'+index;trigger.setAttribute('aria-controls',panel.id);const open=!opened&&row.classList.contains('active');if(open)opened=true;setExpanded(group,open,false);
   function toggle(e){e.preventDefault();e.stopImmediatePropagation();const open=trigger.getAttribute('aria-expanded')!=='true';if(open)side.querySelectorAll(':scope>ul>li').forEach(row=>{if(row!==group.row)row.classList.remove('active')});groups.forEach(other=>{if(other!==group&&other.trigger.getAttribute('aria-expanded')==='true')setExpanded(other,false)});setExpanded(group,open)}
   trigger.addEventListener('click',toggle);trigger.addEventListener('keydown',e=>{if(e.key===' '){toggle(e)}});
  });
 }

 function hrefFor(a){if(routes[a.dataset.page])return routes[a.dataset.page];const article=a.dataset.article;if(article){const split=article.lastIndexOf(':'),name=article.slice(0,split);if(routes[name])return routes[name]+'?id=sample-'+(Number(article.slice(split+1))+1)}return null}
 document.querySelectorAll('[data-page],[data-article]').forEach(a=>{const href=hrefFor(a);if(href&&a.tagName==='A')a.href=href});
 document.addEventListener('click',e=>{const a=e.target.closest('[data-page],[data-article]');if(!a||a.hasAttribute('aria-expanded'))return;const href=hrefFor(a);if(!href)return;e.preventDefault();e.stopImmediatePropagation();if(e.ctrlKey||e.metaKey)window.open(href,'_blank','noopener');else location.href=href},true);

 // Keep the current municipal page selected independently of an opened menu.
 const pageFile=navigation.normalize(location.pathname);
 const currentLeaf=[...document.querySelectorAll('#gnb a[data-page]')].find(a=>!a.closest('.tit')&&routes[a.dataset.page]===pageFile);
 if(currentLeaf){const top=currentLeaf.closest('#gnb>ul>li'),item=currentLeaf.closest('.gnb-wrap .wrap>ul>li');currentLeaf.setAttribute('aria-current','page');top.classList.add('current-section');item.classList.add('current-item');function selectCurrent(){[...item.parentElement.children].forEach(row=>{row.classList.toggle('active',row===item);if(row.querySelector('.depth3-wrap'))row.firstElementChild.setAttribute('aria-expanded',String(row===item));else row.firstElementChild.removeAttribute('aria-expanded')})}top.firstElementChild.addEventListener('click',selectCurrent);selectCurrent();}

 const config=window.SEORIPUL_BOARD_CONFIG,panel=document.querySelector('#news-list');
 if(document.body.classList.contains('board-page')||!panel||!config?.supabaseUrl||!config?.publishableKey)return;
 const types={'고시 공고':'notice','입찰 공고':'bid','입법 예고':'legislation','일반 공고':'general'},cache=new Map();
 const selected=()=>document.querySelector('#tabs [aria-selected=true]')?.textContent;
 function subjectParticle(text){const code=text.trim().charCodeAt(text.trim().length-1);return code>=0xAC00&&code<=0xD7A3&&(code-0xAC00)%28===0?'가':'이'}
 function message(text){const p=document.createElement('p');p.className='empty';p.textContent=text;panel.replaceChildren(p)}
 function render(rows,name){if(!rows.length){message('등록된 '+name+subjectParticle(name)+' 없습니다.');return}panel.replaceChildren();for(const row of rows){const div=document.createElement('div');div.className='cont';const p=document.createElement('p'),a=document.createElement('a'),span=document.createElement('span');a.href=routes[name]+'?id='+encodeURIComponent(row.id);span.textContent=row.title;a.append(span);p.append(a);const date=document.createElement('div');date.className='date';for(const value of [row.department,new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(row.created_at))]){const part=document.createElement('span');part.textContent=value;date.append(part)}div.append(p,date);panel.append(div)}}
 async function load(name){if(!routes[name])return;const more=document.querySelector('.notice-list .more-btn');if(more)more.href=routes[name];if(cache.has(name)){render(cache.get(name),name);return}message('소식을 불러오는 중입니다.');try{await window.HeaderAuth.ready;const client=window.HeaderAuth.client;if(!client)throw Error('연결되지 않았습니다.');let query=client.from(name==='보도자료'?'seoripul_publication_posts':types[name]?'seoripul_notice_posts':'seoripul_news_posts').select('id,title,department,created_at').eq('status','published');if(types[name])query=query.eq('board_type',types[name]);if(name==='보도자료')query=query.eq('board_type','press');const r=await query.order('created_at',{ascending:false}).limit(5);if(r.error)throw r.error;cache.set(name,r.data);if(selected()===name)render(r.data,name)}catch{if(selected()===name)message(name+'을 불러오지 못했습니다. 게시판 연결 상태를 확인해 주세요.')}}
 if(typeof window.renderNews==='function'){const original=window.renderNews;window.renderNews=function(name){original(name);load(name)}}
 load(selected()||'새소식');
})();
