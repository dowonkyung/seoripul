const fs=require('fs'),path=require('path');
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function assign(previous,rows){
const posts={...(previous?.posts||{})},numbers=new Set();
for(const [id,n] of Object.entries(posts)){if(!uuid.test(id)||!Number.isSafeInteger(n)||n<1||numbers.has(n))throw Error('Invalid civil route registry');numbers.add(n)}
let next=Math.max(Number.isSafeInteger(previous?.next)?previous.next:1,1,...[...numbers].map(n=>n+1));
const current=rows.filter(row=>row.board_type==='civil-board'&&uuid.test(row.id)).sort((a,b)=>String(a.created_at||'').localeCompare(String(b.created_at||''))||a.id.localeCompare(b.id));
for(const row of current)if(!Object.hasOwn(posts,row.id))posts[row.id]=next++;
return {version:1,next,posts,active:current.map(row=>row.id)};
}
function build(root,rows,origin,siteName,fallback,description){
const destination=path.join(root,'civil-board'),registryFile=path.join(destination,'routes.json');
const previous=fs.existsSync(registryFile)?JSON.parse(fs.readFileSync(registryFile,'utf8')):null;
const registry=assign(previous,rows),template=fs.readFileSync(path.join(root,'civil-board.html'),'utf8');
function page(row){
let html=template.replace('<head>','<head><base href="/">');
const pagePath=row?'/civil-board/'+registry.posts[row.id]+'/':'/civil-board/';html=html.replace('class="skip" href="#main"','class="skip" href="'+pagePath+'#main"');
if(!row)return html;
const n=registry.posts[row.id],url=origin+'/civil-board/'+n+'/',title=row.title+' | '+siteName;
html=html.replace(/<body\b/,'<body data-civil-post-id="'+row.id+'" data-civil-post-number="'+n+'"');
html=html.replace(/<title>[\s\S]*?<\/title>/,'<title>'+esc(title)+'</title>');
function meta(key,value,attribute='property'){const tag='<meta '+attribute+'="'+key+'" content="'+esc(value)+'">',pattern=new RegExp('<meta '+attribute+'="'+key+'"[^>]*>','g');if(pattern.test(html))html=html.replace(pattern,()=>tag);else html=html.replace('</head>',tag+'</head>')}
meta('description',description,'name');meta('og:title',title);meta('og:description',description);meta('og:image',fallback);meta('og:type','article');meta('og:url',url);meta('twitter:title',title,'name');meta('twitter:image',fallback,'name');meta('twitter:card','summary_large_image','name');
html=html.replace(/<link rel="canonical"[^>]*>/g,'');html=html.replace('</head>','<link rel="canonical" href="'+url+'"></head>');return html;
}
fs.mkdirSync(destination,{recursive:true});fs.writeFileSync(path.join(destination,'index.html'),page(null));
const activeNumbers=new Set(registry.active.map(id=>String(registry.posts[id])));
for(const name of fs.readdirSync(destination))if(/^[1-9]\d*$/.test(name)&&!activeNumbers.has(name))fs.rmSync(path.join(destination,name),{recursive:true,force:true});
for(const row of rows.filter(r=>r.board_type==='civil-board'&&registry.active.includes(r.id))){const folder=path.join(destination,String(registry.posts[row.id]));fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(path.join(folder,'index.html'),page(row))}
fs.writeFileSync(registryFile,JSON.stringify(registry,null,2)+'\n');return registry;
}
module.exports={assign,build};
