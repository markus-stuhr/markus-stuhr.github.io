import json,struct
def load(p):
    d=open(p,'rb').read(); l=struct.unpack('<I',d[12:16])[0]
    j=json.loads(d[20:20+l]); o=20+l; bl=struct.unpack('<I',d[o:o+4])[0]
    return j,bytearray(d[o+8:o+8+bl])
def save(p,j,b):
    while len(b)%4: b.append(0)
    js=json.dumps(j,separators=(',',':')).encode()
    while len(js)%4: js+=b' '
    j['buffers'][0]['byteLength']=len(b)
    js=json.dumps(j,separators=(',',':')).encode()
    while len(js)%4: js+=b' '
    out=struct.pack('<III',0x46546C67,2,12+8+len(js)+8+len(b))+struct.pack('<I4s',len(js),b'JSON')+js+struct.pack('<I4s',len(b),b'BIN\0')+bytes(b)
    open(p,'wb').write(out)
N={'SCALAR':1,'VEC3':3,'VEC4':4}
def read(j,b,i):
    a=j['accessors'][i]; v=j['bufferViews'][a['bufferView']]; n=N[a['type']]
    off=v.get('byteOffset',0)+a.get('byteOffset',0)
    f=struct.unpack_from('<%df'%(a['count']*n),b,off)
    return [f[k*n:(k+1)*n] for k in range(a['count'])] if n>1 else list(f)
def add(j,b,data,typ):
    flat=[x for r in data for x in (r if typ!='SCALAR' else [r])]
    while len(b)%4: b.append(0)
    off=len(b); b+=struct.pack('<%df'%len(flat),*flat)
    j['bufferViews'].append({'buffer':0,'byteOffset':off,'byteLength':len(flat)*4})
    acc={'bufferView':len(j['bufferViews'])-1,'componentType':5126,'count':len(data),'type':typ}
    if typ=='SCALAR': acc['min']=[min(data)];acc['max']=[max(data)]
    j['accessors'].append(acc); return len(j['accessors'])-1
