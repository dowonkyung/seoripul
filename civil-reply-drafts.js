(function(){'use strict';
function open(user,post,storage=window.localStorage){
const key='civil-reply-draft:v1:'+encodeURIComponent(user)+':'+encodeURIComponent(post);
function read(){try{const value=JSON.parse(storage.getItem(key)||'null');if(!value||typeof value.department!=='string'||typeof value.body!=='string'||value.department.length>100||value.body.length>10000||!(value.editingId===null||typeof value.editingId==='string'))return null;return value}catch{return null}}
function write(value){try{storage.setItem(key,JSON.stringify({department:value.department,body:value.body,editingId:value.editingId||null}));return true}catch{return false}}
function clear(expected){try{const current=read();if(expected&&current&&(current.department!==expected.department||current.body!==expected.body||current.editingId!==expected.editingId))return false;storage.removeItem(key);return true}catch{return false}}
return {read,write,clear};
}
window.CivilReplyDrafts={open};
})();