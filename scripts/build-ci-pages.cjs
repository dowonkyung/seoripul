const fs=require('fs'),path=require('path'),vm=require('vm');
function build(root){
 const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'symbols-config.js'),'utf8'),ctx);
 const entry=Object.entries(ctx.window).find(([key])=>key.endsWith('_SYMBOLS'));if(!entry)throw Error('CI configuration missing');
 const site=entry[0].split('_')[0].toLowerCase(),config=entry[1],mark=config.mark,ci=config.ci||{};
 const name={angangjin:'안강진구',geumseong:'금성도',seoripul:'서리풀구'}[site]||'지자체';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function asset(value){if(typeof value!=='string'||!value.startsWith('assets/')||/[\\\0?#]/.test(value)||value.split('/').includes('..'))return '';const file=path.resolve(root,value),base=path.resolve(root)+path.sep;if(!file.startsWith(base)||!fs.existsSync(file)||!fs.statSync(file).isFile())return '';return value}
 function imageBox(value,label,extra=''){const src=asset(value);return '<div class="ci-image-box'+extra+'" aria-label="'+esc(label+(src?'':' 이미지 준비 중'))+'">'+(src?'<img class="ci-provided-image" src="'+esc(src)+'" alt="'+esc(name+' '+label)+'">':'')+'</div>'}
 const artwork=imageBox(ci.symbolImage,'심벌마크'),logotypes=imageBox(ci.logotypeImage,'로고타입',' ci-logotype-box');
 const colors=(mark.colors||[]).filter(c=>/^#[a-f0-9]{6}$/i.test(c.hex));
 const colorHTML='<div class="ci-color-wrap">'+colors.map(c=>{const rgb=[1,3,5].map(i=>parseInt(c.hex.slice(i,i+2),16));return '<div class="ci-color-box"><div class="ci-swatch" style="background-color:'+c.hex+'" role="img" aria-label="'+esc(c.name+' '+c.hex)+'"></div><div class="ci-color-content"><strong>'+esc(c.name)+'</strong><ul><li>R'+rgb[0]+' G'+rgb[1]+' B'+rgb[2]+'</li><li>'+c.hex.toUpperCase()+'</li></ul></div></div>'}).join('')+'</div>';
 const ai=asset(ci.aiFile),download=ai?'<a class="ci-download-button" href="'+esc(ai)+'" download="'+esc(path.basename(ai))+'">CI 자료 내려받기 <span aria-hidden="true">↓</span></a>':'<button type="button" class="ci-download-button" disabled aria-disabled="true" title="AI 파일 준비 중">CI 자료 내려받기 <span aria-hidden="true">↓</span></button>';
 const html='<div class="ci-reference">'+artwork+'<ul class="ci-description">'+(mark.details||[mark.description]).filter(Boolean).map(text=>'<li>'+esc(text)+'</li>').join('')+'</ul><h3>로고타입</h3>'+logotypes+'<h3>색상기준</h3>'+colorHTML+'<div class="ci-information">CI 자료를 AI 파일로 내려받을 수 있습니다.</div><div class="ci-download-wrap">'+download+'</div></div>';
 const file=path.join(root,'ci.html');let source=fs.readFileSync(file,'utf8');
 if(!source.includes('<!-- ci-content:start -->')||!source.includes('<!-- ci-content:end -->'))throw Error('CI content markers missing');
 source=source.replace(/<meta name="description" content="[^"]*">/,'<meta name="description" content="'+esc(name)+'의 심벌마크(CI), 로고타입과 색상기준을 소개합니다.">').replace(/<script src="ci\.js(?:\?[^"]*)?" defer><\/script>/,'');
 fs.writeFileSync(file,source.replace(/<!-- ci-content:start -->[\s\S]*?<!-- ci-content:end -->/,'<!-- ci-content:start -->'+html+'<!-- ci-content:end -->'));
}
module.exports=build;if(require.main===module)build(path.resolve(__dirname,'..'));

