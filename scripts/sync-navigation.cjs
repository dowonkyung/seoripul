// Run from any directory: node scripts/sync-navigation.cjs
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'navigation-config.js'),'utf8'),context);
require('./build-ci-pages.cjs')(root);
const navigation=context.window.SEORIPUL_NAVIGATION;
const assets=['style.css','reference-layout.css','footer-reference.css','board-reference.css','history.css','mayor-greeting.css','mayors.css','notice.css','organization-directory.css','symbols.css','ci.css','ci.js','symbols-config.js','sitemap-reference.css','news-preview.js','refinements.css','photo-editor.js','photo-store.js','photo-context.js','photo-ui.js','photo.css','board.css','header-auth.js','header-auth.css','post-routes.js','civil-route.js','civil-reply-drafts.js','home-banners.js','home-banners.css','header-mayor.css','mayor-office.css','site-search-results.js','post-share.js','board-table-reference.css','civil.css','community.js','photo-board.js','video-gallery.js','page-actions.js','navigation-config.js','app.js','board-shared.js','board-links.js','lnb.css','header-mayor.js','mayor-header.js','mayor-office.js','office-sitemap.css','mayor-office-config.js','photo-nav.js','video-nav.js','activity-nav.js','media-nav.js','activity.css','board-context.js','board.js','board-store.js','organization.css','news-footer.css','site-search-engine.js','search-contents.js','site-search.js','site-search.css'];
const version=crypto.createHash('sha256').update(assets.map(p=>fs.readFileSync(path.join(root,p),'utf8')).join('\n')).digest('hex').slice(0,12);
let total=0;
for(const name of fs.readdirSync(root).filter(n=>n.endsWith('.html'))){
const file=path.join(root,name),original=fs.readFileSync(file,'utf8');let html=original.replaceAll('href="symbols.html"','href="ci.html"');
if(!assets.some(asset=>html.includes(asset)))continue;
if(!html.includes('src="post-routes.js'))html=html.replace(/<script\b/,'<script src="post-routes.js" defer></script><script');
if(!html.includes('navigation-config.js'))html=html.replace(/<script\b/,'<script src="navigation-config.js" defer></script><script');
const side=navigation.renderSide(name);
if(side)html=html.replace(/<nav class="lnb-list"[^>]*>[\s\S]*?<\/nav>/,'<nav class="lnb-list" aria-label="'+navigation.sideFor(name).section+' 하위 메뉴">'+side+'</nav>');
if(html.includes('lnb-list')&&!html.includes('href="lnb.css'))html=html.replace('</head>','<link rel="stylesheet" href="lnb.css"></head>');
for(const asset of assets){const escaped=asset.replace(/\./g,'\\.');html=html.replace(new RegExp('((?:src|href)="'+escaped+')(?:\\?[^"]*)?"','g'),'$1?v='+version+'"')}
if(html!==original){fs.writeFileSync(file,html);total++}
}
console.log('Navigation synchronized: '+total+' pages; asset version '+version);
