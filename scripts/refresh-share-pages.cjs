const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto'),pages=require('./post-pages.cjs');
const root=path.resolve(__dirname,'..'),site="seoripul",origin='https://'+site+'.saevit.online',fallback=origin+'/assets/og-seoripul-header-20261020.png';
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'board-config.js'),'utf8'),ctx);const config=ctx.window[site.toUpperCase()+'_BOARD_CONFIG'];
const sdk=vm.runInThisContext(fs.readFileSync(path.join(root,'assets/vendor/supabase.js'),'utf8')+';supabase'),client=sdk.createClient(config.supabaseUrl,config.publishableKey,{auth:{persistSession:false,autoRefreshToken:false}}),prefix='seoripul_',bucketPrefix='seoripul-',files=new Map(),imageCache=new Map();
async function read(table,columns,published=false){const result=[];for(let offset=0;;offset+=500){let query=client.from(prefix+table).select(columns).order('id').range(offset,offset+499);if(published)query=query.eq('status','published');const r=await query;if(r.error){if(['42P01','PGRST205'].includes(r.error.code))return [];throw Error(table+': '+r.error.message)}result.push(...r.data);if(r.data.length<500)return result}}
const mimes={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif'},extensions={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif'};
function cache(bytes,mime){const ext=mimes[mime];if(!ext||!bytes.length||bytes.length>10*1024*1024)return null;const file='og/'+crypto.createHash('sha256').update(bytes).digest('hex')+'.'+ext;files.set(file,bytes);return origin+'/share/'+file}
async function storageImage(bucket,asset){const key=bucket+'/'+asset.storage_path;if(imageCache.has(key))return imageCache.get(key);const task=(async()=>{try{const r=await client.storage.from(bucket).createSignedUrl(asset.storage_path,300);if(r.error||!r.data?.signedUrl)return null;const u=new URL(r.data.signedUrl);if(u.origin!==new URL(config.supabaseUrl).origin)return null;const response=await fetch(u,{redirect:'error'});if(!response.ok)return null;const mime=(response.headers.get('content-type')||'').split(';')[0].trim();if(!mimes[mime]||Number(response.headers.get('content-length'))>10*1024*1024)return null;return cache(Buffer.from(await response.arrayBuffer()),mime)}catch{return null}})();imageCache.set(key,task);return task}
function directImage(value){if(!value)return null;const data=/^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/]*={0,2})$/i.exec(value);if(data)return data[2].length<=14*1024*1024?cache(Buffer.from(data[2],'base64'),data[1].toLowerCase()):null;
try{const url=new URL(value,origin+'/');if(!['http:','https:'].includes(url.protocol)||url.username||url.password)return null;if(url.origin===origin&&url.pathname.startsWith('/assets/')){const candidate=path.resolve(root,'.'+decodeURIComponent(url.pathname)),assetsRoot=path.join(root,'assets')+path.sep;if(!candidate.startsWith(assetsRoot))return null;const mime=extensions[path.extname(candidate).slice(1).toLowerCase()];return mime&&fs.existsSync(candidate)?cache(fs.readFileSync(candidate),mime):null}if(url.origin===new URL(config.supabaseUrl).origin||url.hostname==='localhost'||url.hostname==='127.0.0.1')return null;return url.href}catch{return null}}
function imageAsset(asset){return Boolean(mimes[String(asset.mime||'').split(';')[0]]||extensions[String(asset.file_name||asset.storage_path||'').split('.').pop().toLowerCase()])}
async function previewImage(row,assets){if(row.youtube_id&&/^[A-Za-z0-9_-]{11}$/.test(row.youtube_id))return 'https://i.ytimg.com/vi/'+row.youtube_id+'/hqdefault.jpg';
const own=assets.filter(a=>a.post_id===row.id).sort((a,b)=>String(a.created_at||'').localeCompare(String(b.created_at||''))),tried=new Set();
async function assetImage(asset){if(!asset||!imageAsset(asset)||tried.has(asset.storage_path))return null;tried.add(asset.storage_path);return storageImage(row.bucket,asset)}
let image=await assetImage(own.find(a=>a.storage_path===row.thumbnail_path));if(image)return image;
for(const tag of pages.imageTags(row.body_html)){image=await assetImage(own.find(a=>a.storage_path===tag['data-storage-path']));if(!image)image=directImage(tag.src);if(image)return image}
for(const asset of own.filter(a=>a.kind==='inline').concat(own.filter(a=>a.kind!=='inline'&&a.kind!=='preview'))){image=await assetImage(asset);if(image)return image}
for(const attachment of row.attachments||[]){image=directImage(attachment.data);if(image)return image}return fallback}
async function main(){
await require('./site-metadata.cjs').refresh(root,site,client);
const groups=await Promise.all([
read('news_posts','id,title,created_at,body_text,body_html',true).then(rs=>rs.map(r=>({...r,board_type:'news',bucket:bucketPrefix+'news-files'}))),
read('notice_posts','id,title,board_type,created_at,body_text,body_html',true).then(rs=>rs.map(r=>({...r,bucket:bucketPrefix+'notice-files'}))),
read('publication_posts','id,title,board_type,created_at,body_text,body_html,summary,thumbnail_path',true).then(rs=>rs.map(r=>({...r,bucket:bucketPrefix+'publication-files'}))),
read('photo_posts','id,title,created_at,body_text,body_html,summary,thumbnail_path',true).then(rs=>rs.map(r=>({...r,board_type:'photo',bucket:bucketPrefix+'photo-files'}))),
read('community_posts','id,title,board_type,created_at,body_html,attachments'),
read('video_posts','id,title,created_at,youtube_id,published_on').then(rs=>rs.map(r=>({...r,board_type:'video'})))
]);
const assetGroups=await Promise.all(['news','notice','publication','photo'].map(async group=>({bucket:bucketPrefix+group+'-files',rows:await read(group+'_assets','post_id,storage_path,kind,mime,file_name,created_at')})));
const assets=new Map(assetGroups.map(group=>[group.bucket,group.rows])),posts=groups.flat().filter(row=>pages.boards.includes(row.board_type)&&/^[0-9a-f-]{36}$/i.test(row.id));
for(const row of posts)row.share_image=await previewImage(row,assets.get(row.bucket)||[]);
const registryFile=path.join(root,'post-routes.json'),civilFile=path.join(root,'civil-board/routes.json'),previous=fs.existsSync(registryFile)?JSON.parse(fs.readFileSync(registryFile,'utf8')):null,civil=fs.existsSync(civilFile)?JSON.parse(fs.readFileSync(civilFile,'utf8')):null,registry=pages.assign(previous,[],civil);
let serverReady=true,serverRows=[];
for(let offset=0;;offset+=1000){const r=await client.rpc('public_post_routes',{p_site:site}).range(offset,offset+999);if(r.error){if(['PGRST202','42883'].includes(r.error.code)){serverReady=false;break}throw Error('Post numbering: '+r.error.message)}serverRows.push(...r.data);if(r.data.length<1000)break}
if(serverReady){
 for(const row of serverRows){const g=registry.boards[row.board],n=Number(row.number);if(!g||!Number.isSafeInteger(n)||n<1)throw Error('Invalid server route');const owner=Object.keys(g.posts).find(id=>g.posts[id]===n);if(owner&&owner!==row.post_id)throw Error('Route number conflict');if(g.posts[row.post_id]&&g.posts[row.post_id]!==n)throw Error('Existing route changed');g.posts[row.post_id]=n;g.next=Math.max(g.next,n+1)}
 const missing=posts.filter(row=>!serverRows.some(route=>route.board===row.board_type&&route.post_id===row.id));
 if(missing.length)throw Error('Published post has no server route; rerun instant-post-numbers.sql');
 for(const key of pages.boards)registry.boards[key].active=posts.filter(row=>row.board_type===key).map(row=>row.id);
}else{const fallbackRegistry=pages.assign(previous,posts,civil);Object.assign(registry,fallbackRegistry)}
const result=pages.build(root,posts,registry,origin,site);
for(const [file,html]of result.legacy)files.set(file,html);files.set('manifest.json',JSON.stringify(result.manifest,null,2)+'\n');
const destination=path.join(root,'share'),stage=path.join(root,'.share-stage');fs.rmSync(stage,{recursive:true,force:true});fs.mkdirSync(stage,{recursive:true});for(const [name,content]of files){const file=path.join(stage,name);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,content)}fs.rmSync(destination,{recursive:true,force:true});fs.renameSync(stage,destination);console.log('Post routes and previews: '+Object.keys(result.manifest).length);
}
main().catch(e=>{console.error(e.message);process.exitCode=1});
