/* P4: standard Heart Rate Service. No raw samples leave this module. */
(function(root){
 'use strict';
 function decode(value){
  if(!(value instanceof DataView)||value.byteLength<2)return null;
  const flags=value.getUint8(0);let p=1;
  const read=()=>{if(p+2>value.byteLength)throw Error('truncated');const n=value.getUint16(p,true);p+=2;return n;};
  try{
   const bpm=flags&1?read():value.getUint8(p++);if(bpm<25||bpm>250)return null;
   const contactSupported=!!(flags&4),contact=contactSupported?!!(flags&2):null;
   const energy=flags&8?read():null,rr=[];
   if(flags&16)while(p<value.byteLength)rr.push(read()*1000/1024);
   return {bpm,contactSupported,contact,energy,rr};
  }catch{return null;}
 }
 function zone(bpm,age){if(!Number.isFinite(age)||age<18||age>100)return null;const p=bpm/(220-age);return p<.6?1:p<.7?2:p<.8?3:p<.9?4:5;}
 class Session{
  constructor(age,clock=()=>Date.now()){this.age=age;this.clock=clock;this.start=clock();this.last=null;this.count=0;this.sum=0;this.max=null;this.min=null;this.zones=[0,0,0,0,0];this.recent=[];this.lastAt=null;}
  add(value){const d=decode(value);if(!d||d.contact===false)return null;const now=this.clock();this.tick(now);this.last=d.bpm;this.lastAt=now;this.count++;this.sum+=d.bpm;this.max=Math.max(this.max||0,d.bpm);this.min=Math.min(this.min||250,d.bpm);this.recent.push({at:now,bpm:d.bpm});this.recent=this.recent.filter(s=>s.at>=now-60000);return {...d,zone:zone(d.bpm,this.age)};}
  tick(now=this.clock()){if(this.lastAt!=null){const elapsed=Math.max(0,Math.min(now-this.lastAt,5000))/1000;const z=zone(this.last,this.age);if(z)this.zones[z-1]+=elapsed;this.lastAt=now;}}
  summary(){this.tick();return {kind:'ble_hr_summary',duration_seconds:Math.max(0,Math.round((this.clock()-this.start)/1000)),sample_count:this.count,hr_avg:this.count?Math.round(this.sum/this.count):null,hr_min:this.min,hr_max:this.max,zones_seconds:this.zones.map(Math.round),estimated:true};}
 }
 root.VitaliaBle={decode,zone,Session};
})(typeof window!=='undefined'?window:globalThis);
