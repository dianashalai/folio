import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {prepareClassifier} from '../src/lib/model.ts';
import {invoiceFields} from '../src/lib/document-insights.ts';
const model=JSON.parse(await readFile(new URL('../public/data/model.json',import.meta.url),'utf8'));
test('all 37 original training examples are retained without plaintext documents',()=>{
 assert.equal(model.exampleCount,37);assert.equal(model.examples.length,37);assert.equal(model.categories.length,5);
 assert.equal(model.vocabulary.length,model.documentFrequency.length);
 assert.ok(model.vocabulary.every(t=>/^[a-f0-9]{64}$/.test(t)));
 assert.ok(model.examples.every(e=>e.terms.every(([i,n])=>i>=0&&i<model.vocabulary.length&&n>0)));
 assert.ok(!model.examples.some(e=>'text' in e||'name' in e));
});
test('browser model matches the original classifier on independent synthetic fixtures',async()=>{
 const recognise=await prepareClassifier(model),golden=JSON.parse(await readFile(new URL('golden.json',import.meta.url),'utf8'));
 for(const fixture of golden){const text=await readFile(new URL('../public/samples/'+fixture.name,import.meta.url),'utf8');const actual=await recognise(text);assert.equal(actual.category,fixture.category);assert.ok(Math.abs(actual.score-fixture.score)<1e-12);}
});
test('empty and unrelated documents remain unclassified',async()=>{
 const recognise=await prepareClassifier(model);
 assert.equal((await recognise('')).category,null);assert.equal((await recognise('qzxvbnmlk qwxyzyxv')).category,null);
});
test('new local training creates a usable category without changing the included model',async()=>{
 const before=JSON.stringify(model),text='Zebragalaxy quokkaplanet marsupial interstellar passport';
 const recognise=await prepareClassifier(model,[{text,category:'new-local-category',trained:1}]);
 assert.equal((await recognise(text)).category,'new-local-category');assert.equal(JSON.stringify(model),before);
});
test('invoice summary uses explicit invoice dates and keeps ambiguous amounts out',()=>{
 assert.deepEqual(invoiceFields('Invoice date: 2026-11-12\nTotal amount: EUR 120.00'),{amount:120,currency:'EUR',date:'2026-11-12'});
 assert.equal(invoiceFields('Total amount: EUR 120.00\nGrand total: EUR 80.00').amount,null);
 assert.equal(invoiceFields('Invoice date: 2026-02-30\nTotal amount: EUR 120.00').date,null);
});
