// The reader response is untrusted input. Always sanitize before inserting it.
const $=id=>document.getElementById(id);
let core;
let entries=[],position=-1,request=null,serial=0;
const cache=new Map();
const allowed=['h1','h2','h3','h4','h5','h6','p','br','hr','a','img','strong','em','del','code','pre','blockquote','ul','ol','li','table','thead','tbody','tr','th','td','sup','sub'];
const escapeAttribute=value=>String(value||'').replace(/[&"<>]/g,c=>({'&':'&amp;','"':'&quot;','<':'&lt;','>':'&gt;'}[c]));
// Keep image URLs out of src until the user enables images.
const renderer={image({href,text}){return `<img data-image-src="${escapeAttribute(href)}" alt="${escapeAttribute(text)}">`}};
function status(text){$('status').textContent=text}
function controls(){
  $('back').disabled=position<=0;
  $('forward').disabled=position>=entries.length-1;
  $('reload').disabled=position<0;
  $('copy').disabled=position<0;
  $('stop').hidden=!request;
  document.body.classList.toggle('loading',!!request);
}
function render(entry){
  $('welcome').hidden=true;$('page').hidden=false;$('error').hidden=true;
  $('address').value=entry.url;$('host').textContent=new URL(entry.url).hostname;
  $('page-title').textContent=entry.title;document.title=entry.title+' — Relay';
  $('original').href=entry.url;$('original').hidden=false;
  const fragment=DOMPurify.sanitize(marked.parse(entry.markdown,{renderer}),{ALLOWED_TAGS:allowed,ALLOWED_ATTR:['href','alt','title','start','data-image-src'],ALLOW_DATA_ATTR:false,RETURN_DOM_FRAGMENT:true});
  for(const a of fragment.querySelectorAll('a')){
    const raw=a.getAttribute('href');
    if(!raw)continue;
    try{a.href=core.normalizeUrl(raw,entry.url);a.title='この画面で読む: '+a.href}catch{a.removeAttribute('href')}
  }
  for(const img of fragment.querySelectorAll('img')){
    let src;try{const raw=img.getAttribute('data-image-src');if(!raw)throw Error();src=core.normalizeUrl(raw,entry.url);if(!src.startsWith('https:'))throw Error()}catch{img.remove();continue}
    img.removeAttribute('data-image-src');
    if($('images').checked){img.src=src;img.loading='lazy';img.referrerPolicy='no-referrer';img.addEventListener('error',()=>img.replaceWith(document.createTextNode('[画像を取得できません]')),{once:true})}
    else{const label=document.createElement('span');label.className='image-placeholder';label.textContent='画像: '+(img.alt||'画像表示をオンにすると表示');img.replaceWith(label)}
  }
  for(const table of fragment.querySelectorAll('table')){const wrap=document.createElement('div');wrap.className='table-wrap';table.replaceWith(wrap);wrap.append(table)}
  $('content').replaceChildren(fragment);
  const length=$('content').textContent.length;
  $('read-time').textContent='約'+Math.max(1,Math.ceil(length/600))+'分';
  $('count').textContent=length.toLocaleString()+'文字';
  status('取得済み · '+new Date(entry.fetchedAt).toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'}));controls();
}
async function navigate(value,{reload=false}={}){
  let url;try{url=core.normalizeUrl(value)}catch(e){$('error').textContent=e.message;$('error').hidden=false;return}
  const id=++serial;request?.abort();const controller=new AbortController();request=controller;controls();$('error').hidden=true;status('ページの本文を取得しています…');
  const timer=setTimeout(()=>controller.abort('timeout'),60000);
  try{
    const key=url.split('#')[0];let entry=reload?null:cache.get(key);
    if(!entry){
      const response=await fetch('https://r.jina.ai/'+key,{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});
      if(!response.ok)throw new Error(response.status===429?'取得回数の制限に達しました。少し待って再試行してください。':`ページを取得できませんでした（${response.status}）。サイト側の制限や取得サービスの状態を確認してください。`);
      const text=await response.text();if(text.length>2000000)throw new Error('本文が大きすぎます。別のページを試してください。');
      entry=core.parseReader(text,url);cache.set(key,entry);if(cache.size>12)cache.delete(cache.keys().next().value);
    }
    if(id!==serial)return;
    if(reload&&position>=0)entries[position]=entry;
    else{entries=entries.slice(0,position+1);entries.push(entry);if(entries.length>24)entries.shift();position=entries.length-1;}
    render(entry);$('page').scrollIntoView({block:'start',behavior:'instant'});
  }catch(e){
    if(id!==serial)return;
    const message=controller.signal.aborted?(controller.signal.reason==='timeout'?'取得がタイムアウトしました。もう一度試してください。':'取得を中止しました。'):(e instanceof TypeError?'取得サービスに接続できません。通信状況を確認し、もう一度試してください。':e.message);
    $('error').textContent=message;$('error').hidden=false;status(position>=0?'前のページを表示しています':'ページを取得できませんでした');
    if(position>=0)$('address').value=entries[position].url;
  }finally{clearTimeout(timer);if(id===serial){request=null;controls()}}
}
function move(delta){if(position+delta<0||position+delta>=entries.length)return;serial++;request?.abort();request=null;position+=delta;render(entries[position])}
$('address-form').addEventListener('submit',e=>{e.preventDefault();navigate($('address').value)});
$('back').addEventListener('click',()=>move(-1));$('forward').addEventListener('click',()=>move(1));
$('reload').addEventListener('click',()=>navigate(entries[position].url,{reload:true}));$('stop').addEventListener('click',()=>request?.abort());
$('images').addEventListener('change',()=>{if(position>=0)render(entries[position])});
$('content').addEventListener('click',e=>{const a=e.target.closest('a[href]');if(!a)return;e.preventDefault();navigate(a.href)});
document.querySelectorAll('[data-url]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.url)));
$('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(entries[position].title+'\n'+entries[position].url+'\n\n'+$('content').innerText);status('本文をクリップボードにコピーしました')}catch{status('コピーできませんでした。本文を長押しして選択・コピーしてください。')}});
core=globalThis.RelayCore;
controls();
