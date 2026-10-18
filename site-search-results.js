(function(){
'use strict';
const names={menu:'메뉴',staff:'업무·직원',content:'콘텐츠',board:'게시판',media:'이미지·미디어',file:'첨부파일'};
const order=Object.keys(names),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function highlight(text,query){text=String(text||'');if(!query)return esc(text);const term=query.toLocaleLowerCase(),low=text.toLocaleLowerCase();let from=0,at,html='';while((at=low.indexOf(term,from))!==-1){html+=esc(text.slice(from,at))+'<mark class="keyword">'+esc(text.slice(at,at+query.length))+'</mark>';from=at+query.length}return html+esc(text.slice(from))}
function snippet(text,q){text=String(text||'').replace(/\s+/g,' ');const at=text.toLocaleLowerCase().indexOf(q.toLocaleLowerCase()),start=Math.max(0,at-50);return(start?'…':'')+text.slice(start,start+240)+(text.length>start+240?'…':'')}
function link(row,text,q){return '<a href="'+esc(row.href)+'"'+(row.href.startsWith('https://')?' target="_blank" rel="noopener noreferrer" title="새 창 열기"':'')+'>'+highlight(text,q)+'</a>'}
function badge(type,count){return '<div class="badge-wrap"><h3 class="bg-badge-search medium">'+names[type]+' ('+count+')</h3></div>'}
function more(type){return '<div class="list-more"><button type="button" class="btn-normal bg-btn-tertiary small" data-search-more="'+type+'" aria-label="'+names[type]+' 검색결과 더보기"><span aria-hidden="true">＋</span>더보기</button></div>'}
function trail(row){const nav=window.SEORIPUL_NAVIGATION,page=row.href.split('?')[0];if(nav)for(const[section,groups]of Object.entries(nav.menu))for(const[group,children]of Object.entries(groups))for(const name of children.length?children:[group])if(nav.routes[name]===page)return ['서리풀구청',section,group,name].filter((v,i,a)=>i===0||v!==a[i-1]);if(page==='photo.html'||page==='video.html')return ['열린구청장실','구정24시','구정갤러리',row.board];return [row.board].filter(Boolean)}
function renderGroup(type,rows,{query='',total=rows.length,showMore=false}={}){
const header=badge(type,total),tail=showMore?more(type):'';
if(type==='menu')return '<li class="result-group result-menu">'+header+'<div class="text">'+rows.map(r=>'<p>'+link(r,r.text||r.title,query)+'</p>').join('')+'</div>'+tail+'</li>';
if(type==='staff')return '<li class="result-group result-staff">'+header+'<div class="table-wrapper" tabindex="0" role="region" aria-label="업무·직원 검색결과 표"><table class="content-table is-left"><caption class="hd-element">업무·직원: 담당 부서/팀 명, 전화번호, 담당 업무</caption><colgroup><col><col><col></colgroup><thead><tr><th scope="col">담당 부서/팀 명</th><th scope="col">전화번호</th><th scope="col">담당 업무</th></tr></thead><tbody>'+rows.map(r=>'<tr><td>'+link(r,[r.organization,r.department,r.position].filter((v,i,list)=>v&&(i===0||v!==list[i-1])).join('>')||r.title,query)+'</td><td>'+esc(r.phone||'-')+'</td><td>'+highlight(r.text,query)+'</td></tr>').join('')+'</tbody></table></div>'+tail+'</li>';
return rows.map((r,i)=>'<li class="result-entry '+(i===0?'group-start ':'')+(i===rows.length-1?'group-end':'')+'">'+(i===0?header:'')+'<div class="text"><dl><dt>'+link(r,r.title,query)+(r.date?'<span class="date">'+esc(r.date.slice(0,10))+'</span>':'')+'</dt><dd>'+highlight(snippet(r.text,query),query)+'</dd></dl>'+(r.image?'<div class="img"><img src="'+esc(r.image)+'" alt="" loading="lazy"></div>':'')+'</div><div class="info"><ul>'+trail(r).map(s=>'<li>'+esc(s)+'</li>').join('')+'</ul></div>'+(i===rows.length-1?tail:'')+'</li>').join('');
}
function render(rows,{category='all',query='',page=1,size=10}={}){
if(!rows.length)return '<li class="search-empty">검색된 정보가 없습니다. 다른 검색어나 검색 조건으로 다시 검색해 주세요.</li>';
if(category!=='all')return renderGroup(category,rows.slice((page-1)*size,page*size),{query,total:rows.length});
return order.map(type=>{const group=rows.filter(r=>r.category===type);return group.length?renderGroup(type,group.slice(0,3),{query,total:group.length,showMore:group.length>3}):''}).join('');
}
window.SearchResultView={render,renderGroup,highlight,order};
})();
