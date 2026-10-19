(function(){
 'use strict';
 let state={user:null,admin:false,superAdmin:false},client,signupClient,refreshVersion=0,lastBlock='';
 const dialog=document.querySelector('#login-dialog');
 if(!dialog)return;
 const form=dialog.querySelector('form'),error=dialog.querySelector('#login-error');
 const c=window.SEORIPUL_BOARD_CONFIG||window.GEUMSEONG_BOARD_CONFIG;
 const site=window.GEUMSEONG_BOARD_CONFIG?'geumseong':'seoripul';
 const description=form.querySelector('p');if(description)description.textContent='승인된 회원과 관리자는 이메일로 로그인할 수 있습니다.';
 const tabs=document.createElement('div');tabs.className='auth-tabs';tabs.innerHTML='<button type="button" data-auth-mode="login" aria-pressed="true">로그인</button><button type="button" data-auth-mode="signup" aria-pressed="false">회원가입 신청</button>';
 dialog.prepend(tabs);
 const signup=document.createElement('form');signup.id='signup-form';signup.hidden=true;
 signup.innerHTML='<h2>회원가입 신청</h2><p class="auth-help">안강진구·금성도·서리풀구 공통 회원가입입니다. 관리자 승인 후 로그인할 수 있습니다.</p><label for="signup-name">이름 / 닉네임</label><input id="signup-name" name="display_name" maxlength="60" autocomplete="nickname" required><label for="signup-email">이메일</label><input id="signup-email" name="email" type="email" autocomplete="email" maxlength="254" required><label for="signup-password">비밀번호</label><input id="signup-password" name="password" type="password" minlength="8" maxlength="128" autocomplete="new-password" required><p class="auth-help">8자 이상으로 입력해 주세요.</p><label for="signup-password-confirm">비밀번호 확인</label><input id="signup-password-confirm" type="password" minlength="8" maxlength="128" autocomplete="new-password" required><label class="auth-consent"><input id="signup-consent" type="checkbox" required><span>공통 회원가입 심사를 위해 이름과 이메일을 관리자에게 제출하는 데 동의합니다.</span></label><p id="signup-result" role="status" aria-live="polite"></p><div class="editor-actions"><button type="button" data-signup-close>닫기</button><button type="submit">신청하기</button></div>';
 dialog.append(signup);
 const signupResult=signup.querySelector('#signup-result');
 function mode(value){const isSignup=value==='signup';form.hidden=isSignup;signup.hidden=!isSignup;tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.authMode===value)));error.textContent='';signupResult.textContent='';dialog.querySelector(isSignup?'#signup-name':'#admin-email').focus()}
 tabs.addEventListener('click',e=>{const b=e.target.closest('[data-auth-mode]');if(b)mode(b.dataset.authMode)});
 signup.querySelector('[data-signup-close]').onclick=()=>dialog.close();
 let publishedAuthKey=null;
 function render(){
  document.querySelectorAll('.etc-menu .login a,.mobile-login a').forEach(a=>{
   a.removeAttribute('data-page');a.href='#login';const label=a.querySelector('span');
   if(label){[...label.childNodes].filter(n=>n.nodeType===3).forEach(n=>n.remove());label.append(state.user?'로그아웃':'로그인')}else a.textContent=state.user?'로그아웃':'로그인을 해주세요';
   a.setAttribute('aria-label',state.user?'로그아웃':'로그인');
  });
  if(!state.superAdmin&&management.open)management.close();
  const authKey=JSON.stringify([state.user?.id||null,Boolean(state.admin),Boolean(state.superAdmin),state.user?.email||'',state.member?.status||'',state.member?.display_name||'']);
  if(authKey!==publishedAuthKey){publishedAuthKey=authKey;window.dispatchEvent(new CustomEvent('header-auth-change',{detail:state}))}
 }
 async function refresh(){
  const version=++refreshVersion;let next={user:null,admin:false,superAdmin:false},block='';
  if(client){
   const r=await client.auth.getUser();if(r.data?.user){
    const user=r.data.user,a=await client.from('news_admins').select('user_id').eq('user_id',user.id).maybeSingle();
    if(a.error)throw Error('계정 권한을 확인하지 못했습니다. 다시 시도해 주세요.');
    if(a.data){let highest=false;try{const s=await client.rpc('is_super_admin');highest=!s.error&&s.data===true}catch{}next={user,admin:true,superAdmin:highest};}
    else{
     const m=await client.from('membership_requests').select('status,display_name').eq('user_id',user.id).maybeSingle();
     if(m.error)block='회원 승인 상태를 확인하지 못했습니다. 관리자에게 문의해 주세요.';
     else if(m.data?.status==='approved')next={user,admin:false,superAdmin:false,member:m.data};
     else block=m.data?.status==='rejected'?'가입 신청이 승인되지 않았습니다. 관리자에게 문의해 주세요.':'회원가입 승인 대기 중입니다. 관리자 승인 후 로그인해 주세요.';
     if(!next.user)await client.auth.signOut({scope:'local'});
    }
   }
  }
  if(version===refreshVersion){state=next;if(block)lastBlock=block;render()}
  return {user:next.user,admin:next.admin,superAdmin:next.superAdmin,block};
 }
 const management=document.createElement('dialog');management.id='membership-dialog';
 management.innerHTML='<h2>회원가입 신청 관리</h2><div class="membership-tools"><label>신청 상태 <select id="membership-filter"><option value="pending">승인 대기</option><option value="approved">승인 완료</option><option value="rejected">거절</option></select></label><button type="button" data-membership-refresh>새로고침</button></div><p role="status" aria-live="polite"></p><div class="membership-table-wrap"><table><caption class="hd-element">회원가입 신청자 이름, 이메일, 신청일, 처리 상태</caption><thead><tr><th>이름 / 닉네임</th><th>이메일</th><th>신청일</th><th>상태</th><th>처리</th></tr></thead><tbody></tbody></table></div><div class="membership-footer"><button type="button" data-membership-prev>이전</button><button type="button" data-membership-next>다음</button><button type="button" data-membership-close>닫기</button></div>';
 document.body.append(management);
 let managementPage=0,managementCount=0,listVersion=0,reviewBusy=false;
 const managementStatus=management.querySelector('[role="status"]');
 const statusNames={pending:'승인 대기',approved:'승인 완료',rejected:'거절'};
 async function listRequests(){
  const version=++listVersion;managementStatus.textContent='신청 목록을 불러오는 중입니다.';
  management.querySelector('tbody').replaceChildren();
  if(!state.superAdmin){managementStatus.textContent='최고관리자 로그인이 필요합니다.';return}
  const filter=management.querySelector('select').value;
  const r=await client.from('membership_requests').select('user_id,email,display_name,status,requested_at',{count:'exact'}).eq('status',filter).order('requested_at',{ascending:false}).order('user_id').range(managementPage*20,managementPage*20+19);
  if(version!==listVersion)return;
  if(r.error){managementStatus.textContent='회원가입 저장소 설정이 필요합니다. MEMBERSHIP_SETUP.md를 확인해 주세요.';return}
  managementCount=r.count||0;managementStatus.textContent='총 '+managementCount+'건';
  management.querySelector('[data-membership-prev]').disabled=managementPage===0;
  management.querySelector('[data-membership-next]').disabled=(managementPage+1)*20>=r.count;
  const tbody=management.querySelector('tbody');
  if(!r.data.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=5;td.style.textAlign='center';td.textContent='해당하는 신청이 없습니다.';tr.append(td);tbody.append(tr)}
  for(const row of r.data){
   const tr=document.createElement('tr');
   for(const value of [row.display_name,row.email,new Date(row.requested_at).toLocaleString('ko-KR'),statusNames[row.status]]){const td=document.createElement('td');td.textContent=value;tr.append(td)}
   const td=document.createElement('td'),controls=document.createElement('div');controls.className='membership-controls';
   for(const [status,label]of [['approved','승인'],['rejected','거절']]){
    if(row.status===status)continue;const button=document.createElement('button');button.type='button';button.textContent=label;
    button.onclick=async()=>{
     if(reviewBusy||!state.superAdmin)return;reviewBusy=true;management.querySelectorAll('button,select').forEach(b=>b.disabled=true);
     try{const result=await client.rpc('review_membership',{p_user:row.user_id,p_status:status,p_expected:row.status});if(result.error)throw result.error;await listRequests();managementStatus.textContent=label+' 처리했습니다. '+managementStatus.textContent}
     catch(e){managementStatus.textContent='처리하지 못했습니다: '+e.message}
     finally{reviewBusy=false;management.querySelectorAll('button,select').forEach(b=>b.disabled=false);management.querySelector('[data-membership-prev]').disabled=managementPage===0;management.querySelector('[data-membership-next]').disabled=(managementPage+1)*20>=managementCount}
    };controls.append(button);
   }td.append(controls);tr.append(td);tbody.append(tr);
  }
 }
 async function openManagement(){await ready;if(!state.superAdmin)return;if(!management.open)management.showModal();managementPage=0;await listRequests()}
 management.querySelector('[data-membership-close]').onclick=()=>management.close();
 management.querySelector('[data-membership-refresh]').onclick=()=>listRequests();
 management.querySelector('select').onchange=()=>{managementPage=0;listRequests()};
 management.querySelector('[data-membership-prev]').onclick=()=>{if(managementPage){managementPage--;listRequests()}};
 management.querySelector('[data-membership-next]').onclick=()=>{managementPage++;listRequests()};
 management.addEventListener('close',()=>{++listVersion;management.querySelector('tbody').replaceChildren();managementStatus.textContent=''});
 const ready=(async()=>{
  if(c?.supabaseUrl&&c?.publishableKey){
   client=window.BoardStore?.client||window.supabase.createClient(c.supabaseUrl,c.publishableKey,{auth:{storageKey:site+'-admin',persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
   signupClient=window.supabase.createClient(c.supabaseUrl,c.publishableKey,{auth:{storageKey:site+'-signup',persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
   try{await refresh()}catch(e){error.textContent=e.message;render()}
   client.auth.onAuthStateChange(()=>setTimeout(()=>refresh().catch(()=>{state={user:null,admin:false,superAdmin:false};render()}),0));
  }else render();return state;
 })();
 async function open(){await ready;mode('login');error.textContent=client?'':'사이트의 로그인 연결 설정이 필요합니다.';if(!dialog.open)dialog.showModal();dialog.querySelector('#admin-email').focus()}
 document.addEventListener('click',async e=>{
  const a=e.target.closest('.etc-menu .login a,.mobile-login a');if(!a)return;e.preventDefault();e.stopImmediatePropagation();await ready;
  if(state.user){const r=await client.auth.signOut();if(r.error){await open();error.textContent='로그아웃하지 못했습니다. 다시 시도해 주세요.';return}await refresh()}else await open();
 },true);
 dialog.querySelector('#cancel-login').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>{form.reset();signup.reset();error.textContent='';signupResult.textContent=''});
 form.onsubmit=async e=>{
  e.preventDefault();await ready;const button=form.querySelector('[type=submit]');button.disabled=true;error.textContent='';lastBlock='';
  try{
   if(!client)throw Error('사이트의 로그인 연결 설정이 필요합니다.');
   const r=await client.auth.signInWithPassword({email:dialog.querySelector('#admin-email').value.trim(),password:dialog.querySelector('#admin-password').value});dialog.querySelector('#admin-password').value='';
   if(r.error)throw Error(r.error.code==='email_not_confirmed'?'이메일 인증을 먼저 완료해 주세요.':'이메일 또는 비밀번호를 확인해 주세요.');
   const result=await refresh();if(!result.user)throw Error(result.block||lastBlock||'관리자 승인 후 로그인할 수 있습니다.');dialog.close();
  }catch(e){if(client&&!state.user)await client.auth.signOut({scope:'local'});error.textContent=e.message}
  finally{button.disabled=false}
 };
 signup.onsubmit=async e=>{
  e.preventDefault();await ready;const button=signup.querySelector('[type=submit]');button.disabled=true;signupResult.textContent='';
  try{
   if(!signupClient)throw Error('회원가입 연결 설정이 필요합니다.');
   const name=signup.querySelector('#signup-name').value.trim(),email=signup.querySelector('#signup-email').value.trim(),password=signup.querySelector('#signup-password').value;
   if(!name||name.length>60)throw Error('이름 / 닉네임을 확인해 주세요.');
   if(password.length<8)throw Error('비밀번호를 8자 이상 입력해 주세요.');
   if(password!==signup.querySelector('#signup-password-confirm').value)throw Error('비밀번호 확인이 일치하지 않습니다.');
   if(!signup.querySelector('#signup-consent').checked)throw Error('회원가입 심사를 위한 정보 제출에 동의해 주세요.');
   const schema=await signupClient.rpc('membership_ready');if(schema.error||!schema.data)throw Error('회원가입 신청 준비 중입니다. 관리자에게 문의해 주세요.');
   const result=await signupClient.auth.signUp({email,password,options:{data:{display_name:name}}});
   if(result.error){const code=result.error.code;throw Error(code==='signup_disabled'?'현재 회원가입 신청이 비활성화되어 있습니다. 관리자에게 문의해 주세요.':code==='over_email_send_rate_limit'||code==='over_request_rate_limit'?'요청이 많습니다. 잠시 후 다시 신청해 주세요.':code==='user_already_exists'?'이미 등록된 이메일입니다. 로그인 화면에서 확인해 주세요.':'신청하지 못했습니다. 입력 정보와 이메일 수신 설정을 확인한 뒤 다시 시도해 주세요.')}
   await signupClient.auth.signOut({scope:'local'});signup.reset();
   signupResult.textContent='회원가입 신청을 접수했습니다.\n이메일 인증 안내가 도착했다면 인증을 완료해 주세요. 관리자 승인 후 로그인할 수 있습니다.\n이미 가입한 이메일인 경우 기존 계정을 사용해 주세요.';
  }catch(e){signupResult.textContent=e.message}
  finally{signup.querySelector('#signup-password').value='';signup.querySelector('#signup-password-confirm').value='';button.disabled=false}
 };
 window.HeaderAuth={ready,open,openManagement,get state(){return state},get client(){return client}};
 if(new URLSearchParams(location.search).get('login')==='1')open();
})();
