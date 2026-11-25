const fs=require('fs');
const src=fs.readFileSync(process.argv[2],'utf8');
const data=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));
const ITEMS=data.items;
const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const a=src.indexOf('const STOP = new Set'), b=src.indexOf('function answerTyped');
eval(src.slice(a,b).replace(/const /g,'var '));
const by=n=>ITEMS.find(i=>i.n===n);
const cases=[['kelly',1,true],['kely',1,true],['pinca crile',2,true],['crile',1,false],['mosquito',10,true],['halsted',10,true],
['metzenbaum curva',34,true],['metzembaum curva',34,true],['metzenbaum',34,false],['mayo reta',31,true],['mayo',31,false],
['adson com dente',24,true],['adson sem dente',24,false],['adson',24,false],['lamina 15',55,true],['lâmina nº 15',55,true],['lamina 10',55,false],
['cabo 4',50,true],['cabo de bisturi n 4',50,true],['doyen',69,true],['doyen',71,false],['doyen intestinal',71,true],['debakey',26,true],['debakey vascular',75,true],
['sims',90,true],['sims',88,false],['cureta sims',88,true],['tentacanula',85,true],['hegar',87,false],['vela de hegar',87,true],['mayo hegar',43,true],
['potts smith',29,false],['tesoura potts smith',40,true],['baioneta',30,true],['bayoneta',30,true],['farabeuf',57,true],['farabeu',57,true],['finochieto',68,true],
['kocher',4,true],['kocker',4,true],['backaus',14,true],['allis',5,true],['babcock',6,true],['rochester pean',11,true],['pean',11,true],['ochsner',12,true]];
let bad=0;
for(const [t,n,exp] of cases){const r=judge(t,n); if(r.ok!==exp){bad++;console.log('MISMATCH',t,'->',by(n).name,'got',r.ok,'match',r.match&&by(r.match).name)}}
console.log('cases',cases.length,'mismatches',bad);
