const fs=require('fs'),path=require('path');
const valid=data=>data&&typeof data.title==='string'&&data.title.trim().length>0&&data.title.length<=120&&typeof data.description==='string'&&data.description.trim().length>0&&data.description.length<=500;
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function meta(html,key,value,attribute='property'){
 let found=false;const tag='<meta '+attribute+'="'+key+'" content="'+escape(value)+'">';
 html=html.replace(/<meta\b[^>]*>/gi,original=>{const attrs={};for(const m of original.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g))attrs[m[1].toLowerCase()]=m[2]??m[3];if((attrs.name||attrs.property)!==key)return original;if(found)return '';found=true;return tag;});
 return found?html:html.replace(/<\/head\s*>/i,()=>tag+'</head>');
}
function applyHTML(html,file,site,settings,image){
 if(/<meta\b[^>]*\bname=["']post-id["']/i.test(html)||/<meta\b[^>]*\bproperty=["']og:type["'][^>]*content=["']article["']/i.test(html))return html;
 if(file==='index.html')html=html.replace(/<title>[\s\S]*?<\/title>/i,()=>'<title>'+escape(settings.title)+'</title>');
 html=meta(html,'description',settings.description,'name');
 for(const [key,value]of [['og:title',settings.title],['og:description',settings.description],['og:image',image],['og:type','website'],['og:url','https://'+site+'.saevit.online/'+(file==='index.html'?'':file)]])html=meta(html,key,value);
 for(const [key,value]of [['twitter:title',settings.title],['twitter:description',settings.description],['twitter:image',image],['twitter:card','summary_large_image']])html=meta(html,key,value,'name');
 return html;
}
function apply(root,site,settings){
 if(!valid(settings))throw Error('Invalid site title or description');
 const main=fs.readFileSync(path.join(root,'index.html'),'utf8');const image=main.match(/<meta property="og:image" content="([^"]+)"/)?.[1]||'https://'+site+'.saevit.online/assets/og-'+site+'.png';
 let changed=0;for(const file of fs.readdirSync(root).filter(f=>f.endsWith('.html'))){const p=path.join(root,file),before=fs.readFileSync(p,'utf8'),after=applyHTML(before,file,site,settings,image);if(after!==before){fs.writeFileSync(p,after);changed++;}}
 fs.writeFileSync(path.join(root,'site-settings.json'),JSON.stringify({title:settings.title.trim(),description:settings.description.trim(),version:Number(settings.version)||0},null,2)+'\n');
 return changed;
}
async function refresh(root,site,client){
 const fallback=JSON.parse(fs.readFileSync(path.join(root,'site-settings-defaults.json'),'utf8'));let settings=fallback;
 const result=await client.from('site_share_settings').select('title,description,version').eq('site',site).maybeSingle();
 if(result.error){if(!['42P01','PGRST205'].includes(result.error.code))throw Error('Site information: '+result.error.message);const previous=path.join(root,'site-settings.json');if(fs.existsSync(previous)){const data=JSON.parse(fs.readFileSync(previous,'utf8'));if(valid(data))settings=data;}}
 else if(result.data){if(!valid(result.data))throw Error('Invalid stored site information');settings=result.data;}
 const count=apply(root,site,settings);console.log('Site sharing metadata synchronized: '+count+' pages');return settings;
}
module.exports={valid,meta,applyHTML,apply,refresh};