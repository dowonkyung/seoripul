const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
async function check(root){
const auth=fs.readFileSync(path.join(root,'header-auth.js'),'utf8'),community=fs.readFileSync(path.join(root,'community.js'),'utf8');
const listeners=[];let events=0,postLoads=0,removed=0;
const view={querySelectorAll(){return [{remove(){removed++}}]}};
const context={state:{user:{id:'admin-a',email:'admin@example.test'},admin:true},document:{querySelectorAll:()=>[]},management:{open:false},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail}},JSON,Boolean};
context.window={HeaderAuth:{get state(){return context.state}},addEventListener(type,fn){assert.equal(type,'header-auth-change');listeners.push(fn)},dispatchEvent(event){events++;for(const fn of listeners)fn(event)}};
vm.createContext(context);
const renderStart=auth.indexOf(' let publishedAuthKey=')>=0?auth.indexOf(' let publishedAuthKey='):auth.indexOf(' function render(){');
const renderEnd=auth.indexOf(' async function refresh(){',renderStart);
vm.runInContext(auth.slice(renderStart,renderEnd)+';this.emitRender=render;',context);
context.emitRender();assert.equal(events,1);
context.id='post-id';context.admin=()=>Boolean(context.state.admin);context.$=()=>view;context.status=message=>{throw Error(message)};
context.showPost=async()=>{postLoads++};
const listenerEnd=community.indexOf('let page=1,size=10;');
const listenerStart=community.lastIndexOf('if(id){',listenerEnd);
await vm.runInContext('(async()=>{'+community.slice(listenerStart,listenerEnd)+'})()',context);
assert.equal(postLoads,1);
for(let i=0;i<50;i++){context.state={user:{id:'admin-a',email:'admin@example.test',last_sign_in_at:String(i)},admin:true};context.emitRender()}
assert.equal(events,1,'Repeated sign-in/token confirmation must not emit a UI change');
for(let i=0;i<20;i++)context.window.dispatchEvent({type:'header-auth-change',detail:context.state});
assert.equal(postLoads,1,'Duplicate events must not rebuild the post/reply form');assert.equal(removed,0);
context.state={user:{id:'admin-a',email:'updated@example.test'},admin:true};context.emitRender();assert.equal(postLoads,1,'Email update must not rebuild reply form');
context.state={user:{id:'admin-a',email:'updated@example.test'},admin:false};context.emitRender();assert.equal(postLoads,2,'Admin revocation must update the view');assert.equal(removed,1);
context.state={user:{id:'admin-b',email:'other@example.test'},admin:true};context.emitRender();assert.equal(postLoads,3,'Switching users must update controls');
context.state={user:null,admin:false};context.emitRender();assert.equal(postLoads,4,'Logout must clear privileged controls');
console.log('PASS: 50 unchanged login confirmations and 20 duplicate events do not redraw; account and role changes still refresh and clear privileged controls');
}
check(process.argv[2]||path.resolve(__dirname,'..')).catch(e=>{console.error(e);process.exitCode=1});

