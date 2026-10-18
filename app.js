const menu=window.SEORIPUL_NAVIGATION.menu;
const $=s=>document.querySelector(s);
const serviceNames=['민원/제안/신고','고시 공고','입찰 공고','서리풀 구보','자유게시판','칭찬게시판','조직도','업무 검색','청사 안내','오시는 길'];const paths=['M5 3h14v18H5z M8 8h8 M8 12h8 M8 16h5','M4 6h16v14H4z M8 3v6 M16 3v6 M4 11h16','M4 20h16 M7 17l9-9 M12 5l7 7 M10 3l3 3 M17 10l3 3','M3 5h8l1 2 1-2h8v15h-8l-1 1-1-1H3z M12 7v14','M3 4h18v13H9l-5 4v-4H3z M7 9h10 M7 13h7','M8 11V5a3 3 0 0 1 6 0v6h5v10H5V11z','M9 2h6v5H9z M2 17h6v5H2z M16 17h6v5h-6z M12 7v5 M5 17v-5h14v5','M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14 M15 15l6 6','M3 21h18 M5 21V8l7-5 7 5v13 M9 11v3 M15 11v3 M10 21v-4h4v4','M12 22s8-8.5 8-13A8 8 0 0 0 4 9c0 4.5 8 13 8 13z M9 9a3 3 0 1 0 6 0 3 3 0 0 0-6 0'];
$('#services').innerHTML='<button class="services-prev" aria-label="자주 찾는 서비스 이전 항목" type="button"></button><div class="swiper service-carousel"><div class="swiper-wrapper">'+serviceNames.map((n,i)=>`<div class="swiper-slide"><button class="service-link" data-page="${n}"><span class="service-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[i]}"/></svg></span><span class="service-label">${n}</span></button></div>`).join('')+'</div></div><button class="services-next" aria-label="자주 찾는 서비스 다음 항목" type="button"></button>';
new Swiper('.service-carousel',{slidesPerView:3,spaceBetween:12,rewind:true,navigation:{prevEl:'.services-prev',nextEl:'.services-next'},breakpoints:{480:{slidesPerView:4,spaceBetween:16},768:{slidesPerView:6,spaceBetween:16},1024:{slidesPerView:8,spaceBetween:20},1440:{slidesPerView:10,spaceBetween:20}},a11y:{prevSlideMessage:'이전 서비스',nextSlideMessage:'다음 서비스'}});

const posts={'새소식':['서리풀구청 홈페이지에 오신 것을 환영합니다','구민과 함께하는 서리풀, 여러분의 의견을 들려주세요','서리풀구 청사 및 주요 시설 이용 안내','서리풀구의 상징과 이야기를 만나보세요'],'고시 공고':['서리풀구 고시·공고 게시판 운영 안내','구정 소식 및 행정정보 공개 안내'],'입법 예고':['입법 예고 및 구민 의견 수렴 안내'],'보도자료':['구민과 함께 여는 서리풀구청 홈페이지']};
Object.keys(posts).forEach((n,i)=>{const b=document.createElement('button');const icon=document.createElement('img');icon.src='assets/reference/ico_notice'+[1,3,4,1][i]+'.svg';icon.alt='';b.append(icon,document.createTextNode(n));b.id='tab-'+i;b.setAttribute('role','tab');b.setAttribute('aria-controls','news-list');b.onclick=()=>renderNews(n);$('#tabs').append(b)});
function renderNews(n){document.querySelectorAll('#tabs button').forEach(b=>{const active=b.textContent===n;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1});$('#news-list').setAttribute('aria-labelledby',[...$('#tabs').children].find(b=>b.textContent===n).id);$('#news-list').innerHTML=posts[n].map((title,i)=>`<div class="cont"><p><a href="#none" data-article="${n}:${i}"><span>${title}</span></a></p><div class="date"><span>구정홍보과</span><span>2026-10-16</span></div></div>`).join('');const more=document.querySelector('.notice-list .more-btn');more.dataset.page=n;more.setAttribute('aria-label',n+' 더보기')}
$('#tabs').addEventListener('keydown',e=>{if(!['ArrowRight','ArrowLeft','Home','End'].includes(e.key))return;e.preventDefault();const tabs=[...$('#tabs').children];let i=tabs.indexOf(document.activeElement);i=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[i].click();tabs[i].focus()});renderNews('새소식');
const banners=window.SEORIPUL_BANNERS;
const track=$('#banner-slides');
for(const [index,item] of banners.entries()){
  const slide=document.createElement('div');slide.className='swiper-slide';
  const link=document.createElement(item.href?'a':'button');
  if(item.href)link.href=item.href;else link.dataset.page=item.page||'새소식';
  const image=document.createElement('img');image.src=item.src;image.alt=item.alt;
  image.width=844;image.height=440;image.decoding='async';image.loading=index===0?'eager':'lazy';
  link.append(image);slide.append(link);track.append(slide);
}
$('#slide-total').textContent=banners.length;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const slider=new Swiper('#banner',{
  loop:banners.length>1,speed:reducedMotion.matches?0:500,
  autoplay:reducedMotion.matches?false:{delay:5000,disableOnInteraction:false},
  navigation:{nextEl:'#next',prevEl:'#prev'},
  a11y:{enabled:true,prevSlideMessage:'이전 배너',nextSlideMessage:'다음 배너',slideLabelMessage:'{{index}} / {{slidesLength}}'},
  on:{slideChange(swiper){$('#slide-number').textContent=swiper.realIndex+1}}
});
let stopped=reducedMotion.matches;
function updatePause(){ $('#pause').innerHTML=stopped?"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" aria-hidden=\"true\"><path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M7.64882 4.08082C7.92389 3.9468 8.25131 3.98142 8.49227 4.17L17.6923 11.3702C17.886 11.5218 17.9992 11.7542 17.9992 12.0002C17.9992 12.2462 17.886 12.4786 17.6923 12.6302L8.49227 19.8302C8.2513 20.0188 7.92389 20.0534 7.64882 19.9194C7.37375 19.7854 7.19922 19.5062 7.19922 19.2002V4.8C7.19922 4.49402 7.37375 4.21484 7.64882 4.08082ZM8.79922 6.44198V17.5582L15.9012 12.0002L8.79922 6.44198Z\" fill=\"#33363D\"/></svg>":"<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" aria-hidden=\"true\"><path d=\"M6.99902 4C7.44079 4 7.79872 4.35807 7.79883 4.7998V19.2002C7.79883 19.642 7.44085 20 6.99902 20C6.55729 19.9999 6.19922 19.642 6.19922 19.2002V4.7998C6.19932 4.35813 6.55735 4.00011 6.99902 4ZM16.999 4C17.4408 4 17.7987 4.35807 17.7988 4.7998V19.2002C17.7988 19.642 17.4409 20 16.999 20C16.5573 19.9999 16.1992 19.642 16.1992 19.2002V4.7998C16.1993 4.35813 16.5574 4.00011 16.999 4Z\" fill=\"#33363D\"/></svg>";$('#pause').setAttribute('aria-label',stopped?'배너 자동 전환 시작':'배너 자동 전환 정지');$('#pause').setAttribute('aria-pressed',String(stopped)); }
$('#pause').onclick=()=>{stopped=!stopped;if(stopped)slider.autoplay.stop();else slider.autoplay.start();updatePause()};
$('#banner').addEventListener('focusin',()=>slider.autoplay.stop());
$('#banner').addEventListener('focusout',e=>{if(!e.currentTarget.contains(e.relatedTarget)&&!stopped)slider.autoplay.start()});
reducedMotion.addEventListener('change',e=>{slider.params.speed=e.matches?0:500;if(e.matches){stopped=true;slider.autoplay.stop();updatePause()}});
updatePause();
function detail(title,text){$('#detail-title').textContent=title;$('#detail-body').replaceChildren();const p=document.createElement('p');p.textContent=text;$('#detail-body').append(p);if(!$('#detail').open)$('#detail').showModal()}
document.addEventListener('click',e=>{const p=e.target.closest('[data-page]');if(p)e.preventDefault();if(p)detail(p.dataset.page,`${p.dataset.page} 메뉴입니다. 현재는 메인화면 시안으로, 해당 메뉴의 상세 페이지와 실제 서비스는 추후 연결될 예정입니다.`);const a=e.target.closest('[data-article]');if(a){e.preventDefault();const [cat,i]=a.dataset.article.split(':');detail(posts[cat][i],'이 게시물은 홈페이지의 화면 구성을 보여주기 위한 예시입니다. 실제 공고나 시행 중인 정책이 아닙니다.')}const k=e.target.closest('[data-search]');if(k){$('#query').value=k.dataset.search;$('#search').requestSubmit()}});$('#close-detail').onclick=()=>$('#detail').close();$('#detail').onclick=e=>{if(e.target===$('#detail')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close()}};
$('#search').onsubmit=e=>{e.preventDefault();const q=$('#query').value.trim();if(!q){$('#query').focus();return}location.href='search.html?q='+encodeURIComponent(q)};