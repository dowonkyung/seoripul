const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
async function check(root){
 const auth=fs.readFileSync(path.join(root,'header-auth.js'),'utf8'),home=fs.readFileSync(path.join(root,'home-banners.js'),'utf8'),sql=fs.readFileSync(path.join(root,'supabase/super-admin.sql'),'utf8');
 const start=auth.indexOf(' async function refresh(){'),end=auth.indexOf(" const management=document.createElement('dialog');",start);assert(start>=0&&end>start);
 async function run({administrator=false,highest=false,rpcError=false,member='approved',signedIn=true}={}){
  let signouts=0;const user={id:'test-user',email:'test@example.invalid'},client={auth:{getUser:async()=>({data:{user:signedIn?user:null}}),signOut:async()=>{signouts++;}},from:table=>({select:()=>({eq:()=>({maybeSingle:async()=>table==='news_admins'?{data:administrator?{user_id:user.id}:null}:{data:{status:member,display_name:'회원'}}})})}),rpc:async name=>{assert.equal(name,'is_super_admin');return rpcError?{error:{code:'PGRST202'}}:{data:highest};}};
  const context={client,state:{user:null,admin:false,superAdmin:false},refreshVersion:0,lastBlock:'',render:()=>{}};vm.createContext(context);vm.runInContext(auth.slice(start,end)+';this.checkRefresh=refresh;',context);await context.checkRefresh();return {...context.state,signouts};
 }
 let r=await run({administrator:true,highest:true});assert(r.admin&&r.superAdmin);
 r=await run({administrator:true});assert(r.admin&&!r.superAdmin);
 r=await run({administrator:true,rpcError:true});assert(r.admin&&!r.superAdmin,'Missing role migration must fail closed without breaking ordinary editing');
 r=await run();assert(r.user&&!r.admin&&!r.superAdmin);
 r=await run({member:'pending'});assert.equal(r.user,null);assert.equal(r.signouts,1);
 r=await run({signedIn:false});assert.equal(r.user,null);assert(!r.superAdmin);
 const line=auth.match(/async function openManagement\(\)\{[^\n]+/)[0];let opened=0,listed=0;const context={state:{admin:true,superAdmin:false},ready:Promise.resolve(),management:{open:false,showModal(){opened++;}},managementPage:0,listRequests:async()=>{listed++;}};vm.createContext(context);vm.runInContext(line+';this.open=openManagement;',context);await context.open();assert.equal(opened,0);context.state.superAdmin=true;await context.open();assert.equal(opened,1);assert.equal(listed,1);
 assert(auth.includes('Boolean(state.superAdmin)'));assert(auth.includes('if(reviewBusy||!state.superAdmin)return'));assert(home.includes('membershipButton.hidden=!window.HeaderAuth?.state.superAdmin'));
 assert(sql.includes("role text not null default 'admin'"));assert(sql.includes('coalesce(public.is_super_admin(),false)'));assert(sql.includes('user_id=(select auth.uid()) or (select public.is_super_admin())'));assert(!sql.includes('@naver.com'));
 console.log('PASS: highest/admin/member/pending/anonymous roles; missing migration fails closed; ordinary admin cannot open approval; RPC and row policy require highest role');
}
check(process.argv[2]||path.resolve(__dirname,'..')).catch(e=>{console.error(e);process.exitCode=1;});