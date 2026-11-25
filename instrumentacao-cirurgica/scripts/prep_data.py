import json
L=[json.loads(l) for l in open('data/items.jsonl')]
G={}
def put(g,ns):
    for n in ns: G[n]=g
put('hemo',[1,2,4,8,10,11,12,13,79])
put('pree',[5,6,9,16,17,18,19,20,76,77,78,80])
put('campo',[14,15])
put('disse',range(21,31))
put('tes',range(31,43))
put('porta',range(43,49))
put('bist',range(49,57))
put('afm',[57,58,59,60,61,62,63,69,70])
put('afa',range(64,69))
put('vasc',[71,72,73,74,75])
put('asp',range(81,85))
put('gine',range(85,91))
put('osso',range(91,101))
ALT={11:['Pinça Pean','Pean'],12:['Pinça Ochsner','Ochsner'],10:['Mosquito','Halsted','Pinça Halsted','Pinça Mosquito'],30:['Pinça Bayoneta'],
     74:['Buldogue','Pinça Buldogue'],85:['Tentacânula'],86:['Estilete'],87:['Vela de Hegar'],
     88:['Cureta de Sims'],61:['Válvula maleável'],89:['Espéculo de Cusco'],96:['Martelo'],
     95:['Cinzel'],51:['Cabo 7'],49:['Cabo 3'],50:['Cabo 4'],52:['Lâmina 10'],53:['Lâmina 11'],
     54:['Lâmina 12'],55:['Lâmina 15'],56:['Lâmina 20'],47:['Castroviejo'],46:['Mathieu']}
items=[];cmps=[]
name2n={}
for it in L:
    if it['kind']=='inst': name2n[it['name']]=it['n']
for it in L:
    if it['kind']=='inst':
        o={'n':it['n'],'name':it['name'],'g':G[it['n']],'sec':it['sec'],'rev':it['rev'],'det':bool(it['det'])}
        a=ALT.get(it['n'],[])+it.get('alt',[])
        if a: o['alt']=sorted(set(a))
        items.append(o)
    else:
        pr=[]
        for k,(nm,txt,box) in enumerate(it['pair']):
            pr.append({'name':nm,'txt':txt,'n':name2n['Pinça '+nm],'img':f"{it['n']:03d}{'ab'[k]}"})
        cmps.append({'n':it['n'],'name':it['name'],'sub':it['sub'] if it['n']==3 else None,'note':it['note'],'pair':pr})
assert len(G)==98 and all(i['n'] in G for i in items)
json.dump({'items':items,'cmps':cmps},open('data/app_data.json','w'),ensure_ascii=False,separators=(',',':'))
print(len(items),len(cmps),len(open('data/app_data.json').read()))
