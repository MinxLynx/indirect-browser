// Uses an existing Git Credential Manager sign-in; never saves or prints tokens.
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const cwd=fileURLToPath(new URL('../',import.meta.url));
const env={...process.env,GIT_TERMINAL_PROMPT:'0',GCM_INTERACTIVE:'never'};
const credential=spawnSync('git',['-c','credential.interactive=false','credential','fill'],{input:'protocol=https\nhost=github.com\n\n',encoding:'utf8',env});
const token=/^password=(.+)$/m.exec(credential.stdout||'')?.[1];
if(!token)throw Error('Saved GitHub sign-in unavailable');
async function api(path,method='GET',body){
  const response=await fetch('https://api.github.com'+path,{method,headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'RelaySetup'},body:body?JSON.stringify(body):undefined});
  const text=await response.text();const data=text?JSON.parse(text):{};
  if(!response.ok)throw Error(method+' '+path+': '+response.status+' '+(data.message||''));
  return data;
}
const user=await api('/user');const name='indirect-browser';const repoPath='/repos/'+user.login+'/'+name;
if(process.argv.includes('--status')){
  const pages=await api(repoPath+'/pages');const runs=await api(repoPath+'/actions/runs?per_page=3');
  console.log(JSON.stringify({url:pages.html_url,status:pages.status,runs:runs.workflow_runs.map(r=>({id:r.id,status:r.status,conclusion:r.conclusion,url:r.html_url}))}));
  process.exit(0);
}
// Refuse to alter a pre-existing repository on the initial publication.
const check=await fetch('https://api.github.com'+repoPath,{headers:{Authorization:'Bearer '+token,'User-Agent':'RelaySetup'}});
if(check.status!==404)throw Error('Repository already exists or could not be checked; no changes made');
const repo=await api('/user/repos','POST',{name,description:'Relay — iPhone-friendly indirect web reader with link navigation',private:false,auto_init:false});
function git(args){const result=spawnSync('git',args,{cwd,env,encoding:'utf8'});if(result.status!==0)throw Error('Git command failed: '+args[0]+' '+result.stderr);return result.stdout.trim()}
git(['init','-b','main']);
git(['config','user.name',user.login]);
git(['config','user.email',user.id+'+'+user.login+'@users.noreply.github.com']);
git(['remote','add','origin',repo.clone_url]);
git(['add','.']);git(['commit','-m','Create Relay indirect web reader']);
git(['push','-u','origin','main']);
await api(repoPath+'/pages','POST',{build_type:'workflow'});
// A manual dispatch ensures the first run sees Pages enabled.
await api(repoPath+'/actions/workflows/pages.yml/dispatches','POST',{ref:'main'});
console.log(JSON.stringify({repository:repo.html_url,expectedPage:'https://'+user.login.toLowerCase()+'.github.io/'+name+'/'}));
