// Also used by the Node verification suite.
(function(root){
  function normalizeUrl(value,base){
    let text=String(value).trim();
    if(!text)throw new Error('URLを入力してください。');
    if(!base&&!/^[a-z][a-z\d+.-]*:/i.test(text))text='https://'+text;
    const u=new URL(text,base);
    if(!['http:','https:'].includes(u.protocol))throw new Error('http または https のURLを入力してください。');
    if(u.username||u.password)throw new Error('認証情報を含むURLは使用できません。');
    const host=u.hostname.toLowerCase().replace(/^\[|\]$/g,'');
    if(host==='localhost'||host.endsWith('.localhost')||host.endsWith('.local')||!host.includes('.')||host.includes(':')||/^\d+\.\d+\.\d+\.\d+$/.test(host))throw new Error('公開ウェブサイトのドメインを入力してください。');
    if(u.port&&!['80','443'].includes(u.port))throw new Error('通常のウェブサイトのURLを入力してください。');
    return u.href;
  }
  function parseReader(text,fallback){
    const marker='Markdown Content:';const i=text.indexOf(marker);
    if(i<0)throw new Error('ページ本文を取得できませんでした。別のURLを試してください。');
    const head=text.slice(0,i);const title=/^Title:\s*(.+)$/m.exec(head)?.[1]||new URL(fallback).hostname;
    let url=fallback;const source=/^URL Source:\s*(.+)$/m.exec(head)?.[1];
    try{if(source)url=normalizeUrl(source)}catch{}
    const markdown=text.slice(i+marker.length).trim();
    if(!markdown)throw new Error('このページには表示できる本文がありません。');
    return{title,url,markdown,fetchedAt:Date.now()};
  }
  root.RelayCore={normalizeUrl,parseReader};
})(globalThis);
