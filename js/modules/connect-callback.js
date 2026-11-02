(function(){
 'use strict';
 const params=new URLSearchParams(location.search),state=params.get('state');
 const payload={type:'vitalia-connect-oauth',state,code:params.get('code'),error:params.get('error')};
 history.replaceState(null,'',location.pathname);
 if(!state||!/^[a-f\d-]{36}$/i.test(state))return;
 if(window.opener)window.opener.postMessage(payload,location.origin);
 if(typeof window.BroadcastChannel==='function'){const channel=new window.BroadcastChannel('vitalia-connect-oauth');channel.postMessage(payload);setTimeout(()=>channel.close(),1000);}
 setTimeout(()=>window.close(),1500);
})();
