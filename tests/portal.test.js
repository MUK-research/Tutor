import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {Script} from 'node:vm';
test('project-owned portal metadata, assets and standalone script are valid',async()=>{
  const dir=new URL('../portal/',import.meta.url),m=JSON.parse(await readFile(new URL('metadata.json',dir),'utf8'));
  assert.equal(m.version,1);assert.equal(m.title,'Tutor');assert.ok(m.people.some(p=>p.includes('Jura Margulis')));
  await access(new URL(m.preview,dir));await access(new URL(m.embed,dir));
  const html=await readFile(new URL(m.embed,dir),'utf8');
  const code=html.match(/<script>([\s\S]*?)<\/script>/)[1];new Script(code);
  assert.doesNotMatch(code,/getUserMedia|requestMIDIAccess|localStorage|fetch\(/);
  const workflow=await readFile(new URL('../.github/workflows/pages.yml',import.meta.url),'utf8');assert.match(workflow,/cp -R library lessons portal _site/);
});
