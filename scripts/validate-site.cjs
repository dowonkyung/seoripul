const fs=require('fs'),path=require('path'),assert=require('assert/strict'),cp=require('child_process');const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
for(const f of fs.readdirSync(root).filter(f=>/\.(js|mjs)$/.test(f)))cp.execFileSync(process.execPath,['--check',path.join(root,f)]);
assert.equal(read('CNAME').trim(),'seoripul.saevit.online');
assert.match(read('photo-write.html'),/id="photo-files"[^>]*hidden/);
assert.match(read('photo-editor.js'),/#photo-files/);
assert.doesNotMatch(read('photo-write.html'),/id="seoripul-photo-files"/);
for(const f of ['board-store.js','photo-store.js','community.js','site-search-engine.js','organization-directory.js','job-search.js','mayor-office.js']){
const s=read(f);assert.doesNotMatch(s,/(?<!seoripul_)\b(?:news_posts|notice_posts|publication_posts|photo_posts|photo_assets|video_posts|community_posts|organization_directory)\b/,f+' database isolation');
assert.doesNotMatch(s,/seoripul_seoripul_/);
}
assert.match(read('header-auth.js'),/news_admins/);assert.match(read('header-auth.js'),/membership_ready/);
const reg=JSON.parse(read('post-routes.json'));for(const b of Object.values(reg.boards)){assert.deepEqual(b.posts,{});assert.equal(b.next,1)}
assert.deepEqual(JSON.parse(read('share/manifest.json')),{});
for(const f of fs.readdirSync(root).filter(f=>f.endsWith('.html'))){const s=read(f);assert.doesNotMatch(s,/angangjin\.saevit\.online|안강진|송은석/,f);for(const m of s.matchAll(/(?:src|href)="([^"#?]+)(?:\?[^"#]*)?(?:#[^"]*)?"/g)){const u=m[1];if(/^(?:https?:|data:|\/\/|mailto:|tel:|#)/.test(u)||u==='#none')continue;const p=path.resolve(root,u.replace(/^\//,''));assert.ok(p.startsWith(root));assert.ok(fs.existsSync(p),f+' missing '+u)}}
const setup=read('supabase/seoripul-setup.sql');assert.doesNotMatch(setup,/drop policy if exists (?:news|photo|notice|publication)_files_/);assert.doesNotMatch(setup,/insert into public\.post_route_(?:counters|numbers) values\('(?:angangjin|geumseong)'/);
console.log('Syntax, local links, photo picker, database isolation and empty routes passed');

