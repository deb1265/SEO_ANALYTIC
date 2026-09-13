import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const manifest=JSON.parse(readFileSync('.github/release.json','utf8'));
const pkg=JSON.parse(readFileSync('package.json','utf8'));
if(!/^v\d+\.\d+(?:\.\d+)?$/.test(manifest.tag))throw new Error('Release tag must be a stable numeric version.');
const version=manifest.tag.slice(1).split('.');while(version.length<3)version.push('0');
if(version.join('.')!==pkg.version||manifest.version!==pkg.version)throw new Error('Release and package versions do not match.');
if(!/^docs\/releases\/v[\d.]+\.md$/.test(manifest.notes))throw new Error('Invalid release notes path.');
readFileSync(manifest.notes,'utf8');
if(!/^[0-9a-f]{40}$/.test(process.env.GITHUB_SHA||''))throw new Error('An exact release commit is required.');
const existing=spawnSync('gh',['release','view',manifest.tag,'--json','url'],{encoding:'utf8'});
if(existing.status===0){console.log('Release already exists:',JSON.parse(existing.stdout).url);process.exit(0);}
const result=spawnSync('gh',['release','create',manifest.tag,'--target',process.env.GITHUB_SHA,'--title',manifest.name,'--notes-file',manifest.notes,'--latest'],{stdio:'inherit'});
if(result.error)throw result.error;
process.exit(result.status??1);
