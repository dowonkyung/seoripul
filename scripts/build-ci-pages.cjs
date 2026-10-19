const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
function build(root){
 const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'symbols-config.js'),'utf8'),ctx);
 const entry=Object.entries(ctx.window).find(([key])=>key.endsWith('_SYMBOLS'));if(!entry)throw Error('CI configuration missing');
 const site=entry[0].split('_')[0].toLowerCase(),config=entry[1],mark=config.mark;
 const names={angangjin:['안강진구','ANGANGJIN-GU'],geumseong:['금성도','GEUMSEONG-DO'],seoripul:['서리풀구','SEORIPUL-GU']},[name,english]=names[site]||['지자체','LOCAL GOVERNMENT'];
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const safe=s=>/^assets\/[a-z0-9_./-]+$/i.test(s||'')&&!s.includes('..')?s:'';
 const signatures=(mark.signatures||[]).filter(x=>safe(x.image));
 const variants=[{label:'심벌마크',image:mark.image},...signatures.filter(x=>x.image!==mark.image)].slice(0,3);
 const zoom='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="10" cy="10" r="6.5"/><path d="m15 15 5 5M10 7v6M7 10h6"/></svg>';
 const artwork='<div class="ci-image-box"><div class="ci-variants">'+variants.map(x=>'<figure><a class="ci-visual" href="'+esc(safe(x.image))+'" target="_blank" rel="noopener" aria-label="'+esc(x.label)+' 이미지 확대보기 (새 창)"><img src="'+esc(safe(x.image))+'" alt="'+esc(name+' '+x.label)+'"></a><figcaption>'+esc(x.label)+'</figcaption></figure>').join('')+'</div><a class="ci-image-zoom" href="'+esc(safe(mark.image))+'" target="_blank" rel="noopener" aria-label="심벌마크 이미지 확대보기 (새 창)">'+zoom+'</a></div>';
 const logotypes='<div class="ci-image-box ci-logotype-box"><div class="ci-logotypes"><figure><div class="ci-letter ci-korean">'+esc(name)+'</div><figcaption>국문</figcaption></figure><figure><div class="ci-letter ci-english">'+esc(english.replace('-','<br>')).replace('&lt;br&gt;','<br>')+'</div><figcaption>영문</figcaption></figure><figure><div class="ci-letter ci-combined"><strong>'+esc(name)+'</strong><small>'+esc(english)+'</small></div><figcaption>국영문</figcaption></figure></div></div>';
 const colors=(mark.colors||[]).filter(c=>/^#[a-f0-9]{6}$/i.test(c.hex));
 const colorHTML='<div class="ci-color-wrap">'+colors.map(c=>{const rgb=[1,3,5].map(i=>parseInt(c.hex.slice(i,i+2),16));return '<div class="ci-color-box"><div class="ci-swatch" style="background-color:'+c.hex+'" role="img" aria-label="'+esc(c.name+' '+c.hex)+'"></div><div class="ci-color-content"><strong>'+esc(c.name)+'</strong><ul><li>R'+rgb[0]+' G'+rgb[1]+' B'+rgb[2]+'</li><li>'+c.hex.toUpperCase()+'</li></ul></div></div>'}).join('')+'</div>';
 const downloadMap=new Map();for(const item of [...(mark.downloads||[]),...signatures.map(s=>({label:s.label+' 다운로드',href:s.image}))])if(safe(item.href)&&!downloadMap.has(item.href))downloadMap.set(item.href,item.label||'다운로드');
 const downloads='<dialog class="ci-download-dialog" id="ci-download-dialog"><h2>CI 자료 내려받기</h2><ul>'+[...downloadMap].map(([href,label])=>'<li><a href="'+esc(href)+'" download>'+esc(label)+'</a></li>').join('')+'</ul><button type="button" data-ci-download-close>닫기</button></dialog>';
 const html='<div class="ci-reference">'+artwork+'<ul class="ci-description">'+(mark.details||[mark.description]).filter(Boolean).map(text=>'<li>'+esc(text)+'</li>').join('')+'</ul><h3>로고타입</h3>'+logotypes+'<h3>색상기준</h3>'+colorHTML+'<div class="ci-information">심벌마크와 로고 자료를 아래 버튼에서 내려받을 수 있습니다.</div><div class="ci-download-wrap"><button type="button" class="ci-download-button" data-ci-download-open>CI 자료 내려받기 <span aria-hidden="true">↓</span></button></div>'+downloads+'</div>';
 const file=path.join(root,'ci.html'),source=fs.readFileSync(file,'utf8').replace(/<meta name="description" content="[^"]*">/,'<meta name="description" content="'+esc(name)+'의 심벌마크(CI), 로고타입과 색상기준을 소개합니다.">');
 if(!source.includes('<!-- ci-content:start -->')||!source.includes('<!-- ci-content:end -->'))throw Error('CI content markers missing');
 fs.writeFileSync(file,source.replace(/<!-- ci-content:start -->[\s\S]*?<!-- ci-content:end -->/,'<!-- ci-content:start -->'+html+'<!-- ci-content:end -->'));
}
module.exports=build;if(require.main===module)build(root);

