/* P5d: user-confirmed local JSON backup. No server writes or credential transfer. */
window.VitaliaLocalTransfer = (function () {
  const categories = ['fasting', 'water', 'preferences', 'reminders', 'avatar', 'memory'];
  const limit = 5 * 1024 * 1024;
  const copy = value => JSON.parse(JSON.stringify(value));
  const labels = {
    pt:{title:'Transferir meus dados locais',info:'Faça o backup no VitalIA do Chrome e importe no Android usando a mesma conta. O arquivo contém dados pessoais: guarde-o com cuidado. Nada será enviado ao servidor.',fasting:'Histórico de jejum',water:'Clima e atividade da hidratação',preferences:'Idioma e aparência',reminders:'Horários de lembretes',avatar:'Avatar (opcional)',memory:'Memória local do Coach (opcional)',prepare:'Preparar exportação',download:'Confirmar e salvar JSON',import:'Escolher arquivo JSON',confirm:'Confirmar importação',own:'Confirmo que estes dados locais pertencem à minha conta. Revisei a prévia. A importação preserva dados existentes; jejuns são mesclados sem repetir registros equivalentes.',kept:'Preservado no destino',restore:'Adicionar no destino',merge:'Mesclar sem remover registros existentes',empty:'Sem dados para transferir',done:'Importação concluída. Feche e abra o app para atualizar a tela. Se necessário, desfaça a última importação aqui.',saved:'Backup preparado. Revise as categorias e confirme para salvar.',undo:'Desfazer última importação',undone:'Importação desfeita. Feche e abra o app.',error:'Não foi possível concluir. Confira se o arquivo é deste VitalIA e da mesma conta. Nada existente será substituído.',conflict:'Os dados mudaram depois da prévia. Reabra esta tela para revisar. Nenhuma alteração nova foi aplicada.',reminder:'A permissão de notificações deve ser ativada no Android. Leituras antigas de clima não são restauradas como clima atual. Só a última importação pode ser desfeita.',account:'Conta de destino',records:'registros',exporting:'Salvando arquivo…'},
    en:{title:'Transfer my local data',info:'Create the backup in VitalIA for Chrome and import it on Android with the same account. This file contains personal data: keep it safe. Nothing is sent to the server.',fasting:'Fasting history',water:'Hydration climate and activity',preferences:'Language and appearance',reminders:'Reminder times',avatar:'Avatar (optional)',memory:'Local Coach memory (optional)',prepare:'Prepare export',download:'Confirm and save JSON',import:'Choose JSON file',confirm:'Confirm import',own:'I confirm that these local data belong to my account and I reviewed the preview. Existing data are preserved; fasting records are merged without equivalent duplicates.',kept:'Kept on destination',restore:'Add to destination',merge:'Merge without removing existing records',empty:'No data to transfer',done:'Import complete. Close and reopen the app to refresh the screen. You can undo the last import here.',saved:'Backup prepared. Review the categories and confirm to save.',undo:'Undo last import',undone:'Import undone. Close and reopen the app.',error:'Could not complete. Check that this file is from VitalIA and the same account. Existing data will not be replaced.',conflict:'Data changed after the preview. Reopen this screen to review. No new changes were applied.',reminder:'Enable notification permission on Android. Old weather readings are not restored as current weather. Only the last import can be undone.',account:'Destination account',records:'records',exporting:'Saving file…'},
    es:{title:'Transferir mis datos locales',info:'Crea la copia en VitalIA de Chrome e impórtala en Android con la misma cuenta. El archivo contiene datos personales: guárdalo con cuidado. No se envía nada al servidor.',fasting:'Historial de ayuno',water:'Clima y actividad de hidratación',preferences:'Idioma y apariencia',reminders:'Horarios de recordatorios',avatar:'Avatar (opcional)',memory:'Memoria local del Coach (opcional)',prepare:'Preparar exportación',download:'Confirmar y guardar JSON',import:'Elegir archivo JSON',confirm:'Confirmar importación',own:'Confirmo que estos datos locales pertenecen a mi cuenta y revisé la vista previa. Se conservan los datos existentes; los ayunos se combinan sin registros equivalentes duplicados.',kept:'Conservado en destino',restore:'Añadir en destino',merge:'Combinar sin eliminar registros existentes',empty:'Sin datos para transferir',done:'Importación completada. Cierra y abre la app para actualizar la pantalla. Puedes deshacer la última importación aquí.',saved:'Copia preparada. Revisa las categorías y confirma para guardar.',undo:'Deshacer última importación',undone:'Importación deshecha. Cierra y abre la app.',error:'No se pudo completar. Comprueba que el archivo sea de VitalIA y de la misma cuenta. No se reemplazan los datos existentes.',conflict:'Los datos cambiaron después de la vista previa. Abre esta pantalla de nuevo para revisar. No se aplicaron cambios nuevos.',reminder:'Activa el permiso de notificaciones en Android. No se restauran lecturas de clima antiguas como actuales. Solo se puede deshacer la última importación.',account:'Cuenta de destino',records:'registros',exporting:'Guardando archivo…'},
    ru:{title:'Перенести локальные данные',info:'Создайте копию в VitalIA для Chrome и импортируйте её в Android с той же учётной записью. Файл содержит личные данные: храните его безопасно. На сервер ничего не отправляется.',fasting:'История голодания',water:'Климат и активность для воды',preferences:'Язык и оформление',reminders:'Время напоминаний',avatar:'Аватар (по желанию)',memory:'Локальная память Coach (по желанию)',prepare:'Подготовить экспорт',download:'Подтвердить и сохранить JSON',import:'Выбрать файл JSON',confirm:'Подтвердить импорт',own:'Подтверждаю, что локальные данные принадлежат моей учётной записи и я проверил предварительный просмотр. Существующие данные сохраняются; история объединяется без одинаковых записей.',kept:'Сохранено в приложении',restore:'Добавить в приложение',merge:'Объединить без удаления существующих записей',empty:'Нет данных для переноса',done:'Импорт завершён. Закройте и откройте приложение для обновления экрана. Здесь можно отменить последний импорт.',saved:'Копия подготовлена. Проверьте категории и подтвердите сохранение.',undo:'Отменить последний импорт',undone:'Импорт отменён. Закройте и откройте приложение.',error:'Не удалось завершить. Проверьте, что файл создан в VitalIA для той же учётной записи. Существующие данные не заменяются.',conflict:'После предварительного просмотра данные изменились. Откройте экран снова. Новые изменения не применены.',reminder:'Разрешите уведомления в Android. Старые погодные измерения не считаются текущими. Можно отменить только последний импорт.',account:'Учётная запись назначения',records:'записей',exporting:'Сохранение файла…'}
  };
  for(const [lang,text]of Object.entries({pt:'Operação cancelada. Nada foi alterado.',en:'Operation cancelled. Nothing changed.',es:'Operación cancelada. No se cambió nada.',ru:'Операция отменена. Ничего не изменено.'}))labels[lang].cancelled=text;
  for(const [lang,text]of Object.entries({pt:'Incluir no arquivo',en:'Include in the file',es:'Incluir en el archivo',ru:'Включить в файл'}))labels[lang].selected=text;
  function fail(code='INVALID'){throw Object.assign(new Error(code),{code});}
  function exact(value, keys){if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(key=>!keys.includes(key)))fail();}
  function safe(value, depth=0){
    if(depth>10)fail();
    if(typeof value==='string'){
      if(value.length>1500000)fail();
      if(!value.startsWith('data:image/')){
        if(value.length>100000||/sb_secret_[A-Za-z0-9_-]{16}/.test(value))fail();
        for(const token of value.split(/[^A-Za-z0-9_.-]+/)){const parts=token.split('.');for(let i=0;i+2<parts.length;i++)if(parts[i].startsWith('eyJ')&&parts[i].length>=23&&parts[i+1].length&&parts[i+2].length)fail();}
      }
      return;
    }
    if(value==null||typeof value==='boolean')return;
    if(typeof value==='number'){if(!Number.isFinite(value))fail();return;}
    if(typeof value!=='object'||Object.keys(value).length>5000)fail();
    for(const [key,child]of Object.entries(value)){if(/^(?:__proto__|prototype|constructor|access_token|refresh_token|password|senha|pin|api_?key|secret|session|consent|streak|xp)$/i.test(key))fail();safe(child,depth+1);}
  }
  function avatarImage(uri){
    const match=/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(uri);if(!match)fail();let bytes;
    try{bytes=Uint8Array.from(atob(match[2]),char=>char.charCodeAt(0));}catch{fail();}
    let width=0,height=0;const word=i=>bytes[i]*256+bytes[i+1],big=i=>bytes[i]*16777216+bytes[i+1]*65536+bytes[i+2]*256+bytes[i+3];
    if(match[1]==='png'&&bytes.length>=24&&[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v)){width=big(16);height=big(20);}
    if(match[1]==='jpeg'&&bytes[0]===255&&bytes[1]===216){for(let i=2;i+8<bytes.length;){if(bytes[i++]!==255)fail();while(bytes[i]===255)i++;const marker=bytes[i++];if(marker===218||marker===217)break;const size=word(i);if(size<2||i+size>bytes.length)fail();if(marker>=192&&marker<=207&&![196,200,204].includes(marker)){height=word(i+3);width=word(i+5);break;}i+=size;}}
    if(match[1]==='webp'&&bytes.length>=30&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP'){
      const chunk=String.fromCharCode(...bytes.slice(12,16));if(chunk==='VP8X'){width=1+bytes[24]+bytes[25]*256+bytes[26]*65536;height=1+bytes[27]+bytes[28]*256+bytes[29]*65536;}
      if(chunk==='VP8 '&&bytes[23]===157&&bytes[24]===1&&bytes[25]===42){width=(bytes[26]+bytes[27]*256)&16383;height=(bytes[28]+bytes[29]*256)&16383;}
      if(chunk==='VP8L'&&bytes[20]===47){width=1+bytes[21]+((bytes[22]&63)<<8);height=1+(bytes[22]>>6)+(bytes[23]<<2)+((bytes[24]&15)<<10);}
    }
    if(!Number.isFinite(width)||!Number.isFinite(height)||width<1||height<1||width>512||height>512)fail();
  }
  function validateData(name,value){
    safe(value);
    if(name==='fasting'){
      if(!Array.isArray(value)||value.length>1000)fail();
      for(const row of value){exact(row,['protocol','hours','date']);if(!/^(?:\d{1,3}:\d{1,3}|OMAD)$/.test(row.protocol)||!/^\d+(?:\.\d+)?$/.test(String(row.hours))||Number(row.hours)>8760||typeof row.date!=='string'||row.date.length>60||!/^[-\p{L}\p{N}\s/.,]+$/u.test(row.date))fail();}
    }else if(name==='water'){
      exact(value,['climate','activityMinutes']);if(!['normal','hot','very_hot','cold'].includes(value.climate)||!Number.isFinite(value.activityMinutes)||value.activityMinutes<0||value.activityMinutes>1440)fail();
    }else if(name==='preferences'){
      exact(value,['dark','lang']);if(value.dark!==undefined&&typeof value.dark!=='boolean')fail();if(value.lang!==undefined&&!['pt','en','es','ru'].includes(value.lang))fail();
    }else if(name==='reminders'){
      exact(value,['enabled','times']);if(typeof value.enabled!=='boolean')fail();exact(value.times,['breakfast','morning_snack','lunch','afternoon_snack','dinner','evening_snack']);if(Object.values(value.times).some(t=>!/^([01]\d|2[0-3]):[0-5]\d$/.test(t)))fail();
    }else if(name==='avatar'){
      exact(value,['type','photo','emoji']);if(!['photo','emoji'].includes(value.type))fail();if(value.type==='photo'){if(typeof value.photo!=='string'||value.photo.length>1500000)fail();avatarImage(value.photo);}if(value.type==='emoji'&&(typeof value.emoji!=='string'||[...value.emoji].length>16||/[<>"'&]/.test(value.emoji)))fail();
    }else if(name==='memory'){
      exact(value,['events','profile','goal','preferences','language']);if(JSON.stringify(value).length>100000)fail();if(value.events!==undefined&&(!Array.isArray(value.events)||value.events.length>60))fail();
    }else fail();
    return value;
  }
  function parse(raw,uid){
    if(typeof raw!=='string'||new TextEncoder().encode(raw).length>limit)fail();
    let value;try{value=JSON.parse(raw);}catch{fail();}
    safe(value);exact(value,['format','version','owner','createdAt','origin','data']);
    if(!/^[a-f0-9-]{36}$/i.test(uid)||value.format!=='vitalia-local-backup'||value.version!==1||value.owner!==uid||!['web','android'].includes(value.origin)||!Number.isFinite(Date.parse(value.createdAt)))fail();
    exact(value.data,categories);for(const [name,data]of Object.entries(value.data))validateData(name,data);
    return value;
  }
  const scoped=(base,uid)=>base+'_'+uid;
  function read(storage,key){const raw=storage.getItem(key);if(raw===null)return null;try{return JSON.parse(raw);}catch{fail();}}
  function exportData(storage,uid,selected,origin='web'){
    const data={};
    for(const name of selected){if(!categories.includes(name))fail();let value=null;
      if(name==='fasting')value=read(storage,'v_fasting_history');
      if(name==='water'){const source=read(storage,'v_water_context');if(source)value={climate:source.climate,activityMinutes:source.activityMinutes||0};}
      if(name==='preferences'){const dark=storage.getItem('v_dark'),lang=storage.getItem(scoped('v_lang',uid))||storage.getItem('v_lang');value={...(dark!==null?{dark:dark!=='false'}:{}),...(lang?{lang}:{})};}
      if(name==='reminders')value=read(storage,scoped('v_meal_reminders',uid));
      if(name==='avatar'){const type=storage.getItem(scoped('vitalia_profile_avatar_type',uid));if(type)value=type==='photo'?{type,photo:storage.getItem(scoped('vitalia_profile_photo',uid))}:{type,emoji:storage.getItem(scoped('vitalia_profile_emoji',uid))};}
      if(name==='memory')value=read(storage,'vitalia_coach_memory_'+uid);
      if(value!==null)data[name]=copy(validateData(name,value));
    }
    const backup={format:'vitalia-local-backup',version:1,owner:uid,createdAt:new Date().toISOString(),origin,data};return parse(JSON.stringify(backup),uid);
  }
  function allowedKeys(uid){return ['v_fasting_history','v_water_context','v_dark','v_lang',scoped('v_lang',uid),scoped('v_meal_reminders',uid),scoped('vitalia_profile_avatar_type',uid),scoped('vitalia_profile_photo',uid),scoped('vitalia_profile_emoji',uid),'vitalia_coach_memory_'+uid];}
  function plan(storage,uid,backup,selected=Object.keys(backup.data)){
    backup=parse(JSON.stringify(backup),uid);const changes=[],summary=[];
    const add=(key,after)=>{const before=storage.getItem(key);if(before!==after)changes.push({key,before,after});};
    for(const name of selected){if(!categories.includes(name)||!(name in backup.data))fail();const value=backup.data[name];let status='kept';
      if(name==='fasting'){
        const previous=read(storage,'v_fasting_history')||[];validateData('fasting',previous);const merged=copy(previous),seen=new Set(previous.map(x=>JSON.stringify([x.protocol,Number(x.hours),x.date])));
        for(const row of value){const id=JSON.stringify([row.protocol,Number(row.hours),row.date]);if(!seen.has(id)){merged.push(row);seen.add(id);}}
        if(merged.length>1000)fail();if(merged.length!==previous.length){add('v_fasting_history',JSON.stringify(merged));status=previous.length?'merge':'restore';}
      }else if(name==='preferences'){
        if(value.dark!==undefined&&storage.getItem('v_dark')===null){add('v_dark',String(value.dark));status='restore';}
        if(value.lang&&storage.getItem('v_lang')===null&&storage.getItem(scoped('v_lang',uid))===null){add('v_lang',value.lang);add(scoped('v_lang',uid),value.lang);status='restore';}
      }else{
        const pairs=name==='water'?[['v_water_context',JSON.stringify({...value,weatherLabel:'manual'})]]:name==='reminders'?[[scoped('v_meal_reminders',uid),JSON.stringify(value)]]:name==='memory'?[['vitalia_coach_memory_'+uid,JSON.stringify(value)]]:value.type==='photo'?[[scoped('vitalia_profile_avatar_type',uid),'photo'],[scoped('vitalia_profile_photo',uid),value.photo]]:[[scoped('vitalia_profile_avatar_type',uid),'emoji'],[scoped('vitalia_profile_emoji',uid),value.emoji]];
        const guard=name==='avatar'?['vitalia_profile_avatar_type','vitalia_profile_photo','vitalia_profile_emoji'].map(base=>scoped(base,uid)):pairs.map(([key])=>key);
        if(guard.every(key=>storage.getItem(key)===null)){for(const [key,raw]of pairs)add(key,raw);status='restore';}
      }
      summary.push({category:name,status,count:name==='fasting'?value.length:null});
    }
    return {owner:uid,changes,summary};
  }
  const journalKey=uid=>scoped(VITALIA_LOCAL_TRANSFER_JOURNAL_KEY,uid);
  function journal(storage,uid){const value=read(storage,journalKey(uid));if(!value)return null;exact(value,['owner','state','changes']);if(value.owner!==uid||!['pending','applied'].includes(value.state)||!Array.isArray(value.changes)||value.changes.length>12)fail();for(const row of value.changes){exact(row,['key','before','after']);if(!allowedKeys(uid).includes(row.key)||(row.before!==null&&typeof row.before!=='string')||typeof row.after!=='string')fail();}return value;}
  function restore(storage,changes){for(const row of changes)storage.removeItem(row.key);for(const row of changes)if(row.before!==null)storage.setItem(row.key,row.before);}
  function recover(storage,uid){const value=journal(storage,uid);if(value?.state!=='pending')return false;if(value.changes.some(row=>![row.before,row.after].includes(storage.getItem(row.key))))fail('CONFLICT');restore(storage,value.changes);storage.removeItem(journalKey(uid));return true;}
  function apply(storage,uid,draft,confirmed){
    if(!confirmed||draft.owner!==uid||!Array.isArray(draft.changes))fail();recover(storage,uid);
    for(const row of draft.changes)if(!allowedKeys(uid).includes(row.key)||storage.getItem(row.key)!==row.before)fail('CONFLICT');
    if(!draft.changes.length)return false;
    const value={owner:uid,state:'pending',changes:copy(draft.changes)};storage.setItem(journalKey(uid),JSON.stringify(value));
    const written=[];
    try{for(const row of value.changes){if(storage.getItem(row.key)!==row.before)fail('CONFLICT');storage.setItem(row.key,row.after);written.push(row);}value.state='applied';storage.setItem(journalKey(uid),JSON.stringify(value));}
    catch(error){const reversible=written.filter(row=>storage.getItem(row.key)===row.after);restore(storage,reversible);if(written.length===reversible.length)storage.removeItem(journalKey(uid));throw error;}
    return true;
  }
  function undo(storage,uid,confirmed){if(!confirmed)fail();const value=journal(storage,uid);if(!value)return false;if(value.changes.some(row=>storage.getItem(row.key)!==row.after))fail('CONFLICT');restore(storage,value.changes);storage.removeItem(journalKey(uid));return true;}
  async function account(){const client=getVitaliaSupabaseClient(),session=(await client.auth.getSession())?.data?.session;if(!session?.user?.id||session.user.id!==currentUserId())fail('ACCOUNT');return session.user.id;}
  async function open(){
    try {
    const uid=await account(),l=labels[APP.lang]||labels.en,recovered=recover(localStorage,uid);
    openModal(l.title,'<div id="local-transfer-panel"></div>');const host=document.getElementById('local-transfer-panel');
    host.style.cssText='font-size:14px;line-height:1.55;font-weight:400';
    const node=(tag,text,parent=host)=>{const el=document.createElement(tag);if(text)el.textContent=text;parent.appendChild(el);return el;};
    node('p',l.info);node('p',l.account+': '+(APP.user.email||uid));node('p',l.reminder);
    const checks={};for(const name of categories){const label=node('label','');label.style.cssText='display:flex;gap:10px;align-items:center;padding:10px 0';const input=node('input','',label);input.type='checkbox';input.style.cssText='accent-color:var(--green);flex-shrink:0';input.checked=!['avatar','memory'].includes(name);checks[name]=input;node('span',l[name],label);}
    const preview=node('div','');preview.setAttribute('role','status');
    const confirmation=node('label','');confirmation.style.cssText='display:flex;gap:10px;align-items:flex-start;padding:14px 0';const confirm=node('input','',confirmation);confirm.type='checkbox';confirm.style.cssText='accent-color:var(--green);flex-shrink:0;margin-top:3px';node('span',l.own,confirmation);
    const status=node('p','');status.setAttribute('role','status');
    const selected=()=>categories.filter(name=>checks[name].checked);
    const controls={};let busy=false;
    const refreshImportedData=()=>{APP.fastingHistory=read(localStorage,'v_fasting_history')||[];APP.waterContext=read(localStorage,'v_water_context')||{climate:'normal',activityMinutes:0};};
    if(recovered)refreshImportedData();
    const syncControls=()=>{const hasUndo=!!journal(localStorage,uid);for(const el of Object.values(controls))el.disabled=busy;confirmation.style.display=backup||draft||hasUndo?'flex':'none';if(controls.download)controls.download.style.display=backup?'inline-flex':'none';if(controls.confirm)controls.confirm.style.display=draft?'inline-flex':'none';if(controls.undo)controls.undo.style.display=hasUndo?'inline-flex':'none';if(!busy){if(controls.download)controls.download.disabled=!backup||!confirm.checked;if(controls.confirm)controls.confirm.disabled=!draft?.changes.length||!confirm.checked;if(controls.undo)controls.undo.disabled=!confirm.checked||!hasUndo;}};
    const button=(name,fn)=>{const el=node('button',l[name]);controls[name]=el;el.type='button';el.className='btn '+(['download','confirm'].includes(name)?'btn-primary':'btn-outline')+' btn-full';el.style.cssText='margin-top:10px;min-height:48px;white-space:normal';el.onclick=async()=>{busy=true;syncControls();try{if(await account()!==uid)fail('ACCOUNT');await fn();}catch(error){status.textContent=error?.code==='CONFLICT'?l.conflict:error?.code==='CANCELLED'?l.cancelled:l.error;}finally{busy=false;syncControls();}};return el;};
    let backup=null,draft=null,source=null;
    const show=rows=>{preview.replaceChildren();for(const row of rows)node('p',l[row.category]+': '+l[row.status]+(row.count===null?'':' · '+row.count+' '+l.records),preview);};
    button('prepare',()=>{source=null;draft=null;backup=exportData(localStorage,uid,selected(),window.Capacitor?.isNativePlatform?.()?'android':'web');show(Object.keys(backup.data).map(category=>({category,status:'selected',count:category==='fasting'?backup.data[category].length:null})));confirm.checked=false;status.textContent=l.saved;});
    button('download',async()=>{if(!backup||!confirm.checked)fail();status.textContent=l.exporting;const json=JSON.stringify(backup,null,2),filename='VitalIA-local-backup-'+new Date().toISOString().slice(0,10)+'.json';
      if(window.Capacitor?.isNativePlatform?.())await window.VitaliaNative.LocalBackup.save({json,filename});else{const url=URL.createObjectURL(new Blob([json],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download=filename;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}status.textContent=l.saved;
    });
    const file=node('input','');file.type='file';file.accept='.json,application/json';file.hidden=true;
    button('import',()=>{backup=null;draft=null;source=null;confirm.checked=false;file.click();});
    file.onchange=async()=>{busy=true;syncControls();try{const chosen=file.files?.[0];if(!chosen)return;if(chosen.size>limit)fail();if(await account()!==uid)fail('ACCOUNT');source=parse(await chosen.text(),uid);draft=plan(localStorage,uid,source,selected().filter(name=>name in source.data));show(draft.summary);confirm.checked=false;}catch{source=null;draft=null;status.textContent=l.error;}finally{file.value='';busy=false;syncControls();}};
    for(const input of Object.values(checks))input.onchange=()=>{confirm.checked=false;backup=null;try{if(source){draft=plan(localStorage,uid,source,selected().filter(name=>name in source.data));show(draft.summary);}}catch{draft=null;status.textContent=l.error;}syncControls();};
    button('confirm',()=>{if(!draft||!confirm.checked)fail();const changed=apply(localStorage,uid,draft,true);if(changed)refreshImportedData();status.textContent=changed?l.done:l.empty;draft=null;source=null;confirm.checked=false;});
    button('undo',()=>{undo(localStorage,uid,confirm.checked);refreshImportedData();status.textContent=l.undone;confirm.checked=false;});
    confirm.onchange=syncControls;syncControls();
    document.getElementById('modal-sheet').scrollTop=0;
    } catch { toast((labels[APP.lang]||labels.en).error,'info',5000); }
  }
  return {open,parse,exportData,plan,apply,undo,recover,labels,categories};
})();
