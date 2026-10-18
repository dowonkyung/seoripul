const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
(async()=>{
 for(const site of ['seoripul']){
  const html=fs.readFileSync(require('path').join(__dirname,'..','photo-write.html'),'utf8'),code=fs.readFileSync(require('path').join(__dirname,'..','photo-editor.js'),'utf8');
  const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]));
  const missing=[...code.matchAll(/\$\('#([^']+)'\)/g)].map(x=>x[1]).filter(id=>!ids.has(id));assert.deepEqual(missing,[]);
  assert(/<input id="photo-files"[^>]*\bhidden>/.test(html));assert(/<button type="button" id="photo-add"/.test(html));assert(!html.includes('id="geumseong-photo-files"'));
  let chooser=0,renders=0,changed=0,lastStatus='';
  const controls={'#photo-add':{},'#photo-files':{click(){chooser++}}};
  const ctx={$:s=>controls[s],FileReader:class{readAsDataURL(file){this.result='data:'+file.type+';base64,aW1hZ2U=';this.onload()}},render(){renders++},changed(){changed++},status:s=>lastStatus=s,message:e=>e.message};
  const hook=code.slice(code.indexOf('const readData='),code.indexOf('function syncAuth()'));
  vm.runInNewContext('let photos=[],pending=false;'+hook+';this.getPhotos=()=>photos;',ctx);
  controls['#photo-add'].onclick();assert.equal(chooser,1);
  const target={files:[{name:'first.png',type:'image/png',size:20},{name:'second.jpg',type:'image/jpeg',size:30}],value:'selected'};
  await controls['#photo-files'].onchange({target});assert.equal(ctx.getPhotos().length,2);assert.equal(ctx.getPhotos()[0].name,'first.png');assert.equal(target.value,'');assert.equal(renders,1);assert.equal(changed,1);
  await controls['#photo-files'].onchange({target:{files:[{name:'invalid.txt',type:'text/plain',size:20}],value:'selected'}});assert.equal(ctx.getPhotos().length,2);assert(lastStatus.includes('PNG'));
  controls['#photo-add'].onclick();assert.equal(chooser,2);
 }
 console.log('PASS: photo editor DOM IDs match; only custom photo-add button is visible; chooser wiring; multiple image reads; validation; retry after rejection.');
})().catch(e=>{console.error(e);process.exitCode=1});


