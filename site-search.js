(async function(){
'use strict';
const $=s=>document.querySelector(s),el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n};
const categories=[['all','전체'],['menu','메뉴'],['staff','업무·직원'],['content','콘텐츠'],['board','게시판'],['media','멀티미디어'],['file','첨부파일']];
const query=(new URLSearchParams(location.search).get('q')||'').trim().slice(0,100);$('#search-query').value=query;document.title=(query?query+' 검색결과 - ':'')+'통합검색 - 서리풀구청';
let rows=[],page=1,size=10,category='all',sort='score',options={};
for(const[value,label]of categories){const wrap=el('label',undefined,'category-choice'),input=el('input'),span=el('span',label),count=el('span','0','category-count');input.type='radio';input.name='category';input.value=value;input.checked=value==='all';count.id='count-'+value;input.onchange=()=>{category=value;page=1;render()};wrap.append(input,span,count);$('#search-categories').append(wrap)}
function render(){
const base=window.SiteSearch.filter(rows,{...options,category:'all',sort,query}),filtered=base.filter(r=>category==='all'||r.category===category),pages=category==='all'?1:Math.max(1,Math.ceil(filtered.length/size));page=Math.min(page,pages);
const summary=$('#search-summary');summary.replaceChildren();summary.append(document.createTextNode('적용된 검색어 ‘'),el('strong',query),document.createTextNode('’ · 검색 결과 '),el('strong',String(filtered.length)),document.createTextNode('개'));
for(const[value]of categories)$('#count-'+value).textContent=String(value==='all'?base.length:base.filter(x=>x.category===value).length);
const host=$('#search-results');host.innerHTML=window.SearchResultView.render(filtered,{category,query,page,size});
const nav=$('#search-paging');nav.replaceChildren();if(pages>1){const arrow='<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M7 3.5 14 10 7 16.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';const start=Math.max(1,Math.min(page-2,pages-4));for(const[label,n]of [['이전',page-1],...Array.from({length:Math.min(5,pages)},(_,i)=>[String(start+i),start+i]),['다음',page+1]]){const button=el('button',label);button.type='button';if(label==='이전'||label==='다음'){button.className='paging-direction';button.innerHTML=label==='이전'?arrow+'<span>이전</span>':'<span>다음</span>'+arrow;button.disabled=n<1||n>pages;button.setAttribute('aria-label',label+' 페이지')}else if(n===page)button.setAttribute('aria-current','page');button.onclick=()=>{page=n;render();summary.scrollIntoView({block:'start'})};nav.append(button)}}
}
$('#search-results').addEventListener('click',e=>{const more=e.target.closest('[data-search-more]');if(!more)return;category=more.dataset.searchMore;page=1;for(const input of document.querySelectorAll('input[name="category"]'))input.checked=input.value===category;render();$('#search-summary').scrollIntoView({block:'start'})});
for(const button of document.querySelectorAll('.filter-toggle'))button.addEventListener('click',()=>{const open=button.getAttribute('aria-expanded')!=='true',panel=document.getElementById(button.getAttribute('aria-controls'));button.setAttribute('aria-expanded',String(open));panel.classList.toggle('collapsed',!open);panel.inert=!open;});
$('#search-filters').onsubmit=e=>{e.preventDefault();const start=$('#search-start').value,end=$('#search-end').value;if(start&&end&&start>end){$('#search-end').setCustomValidity('종료일은 시작일 이후로 선택해 주세요.');$('#search-end').reportValidity();return}$('#search-end').setCustomValidity('');options={start,end,within:$('#search-within').value.trim(),exclude:$('#search-exclude').value.trim()};page=1;render()};
$('#search-end').oninput=()=>$('#search-end').setCustomValidity('');
$('#search-filters').onreset=()=>{category='all';options={};page=1;setTimeout(render,0)};
$('#search-size').onchange=()=>{size=Number($('#search-size').value);page=1;render()};
for(const[value,id]of [['score','sort-score'],['date','sort-date']])$('#'+id).onclick=()=>{sort=value;page=1;$('#sort-score').setAttribute('aria-pressed',String(sort==='score'));$('#sort-date').setAttribute('aria-pressed',String(sort==='date'));render()};
$('#site-search-form').onsubmit=e=>{const input=$('#search-query');input.value=input.value.trim();if(!input.value){e.preventDefault();input.focus()}};
if(!query){$('#search-summary').textContent='검색어를 입력해 주세요.';$('#search-query').focus();return}
$('#search-summary').textContent='사이트 전체에서 검색하고 있습니다.';
try{await window.HeaderAuth.ready;const results=await Promise.all([window.SiteSearch.database(window.HeaderAuth.client,query),window.SearchContents.load(query)]);rows=results.flatMap(r=>r.rows);const errors=results.flatMap(r=>r.errors);if(errors.length){$('#search-warning').hidden=false;$('#search-warning').textContent='일부 검색 대상의 정보를 불러오지 못했습니다: '+errors.join(', ')+'. 해당 결과는 제외되어 있습니다. 잠시 후 새로고침해 주세요.'}render()}catch{$('#search-summary').textContent='검색결과를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'}
})();