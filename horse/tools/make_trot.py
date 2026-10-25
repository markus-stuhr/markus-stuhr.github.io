# Baut aus der Walk-Animation des Quaternius-Pferds einen Trab:
# Vorderbeine zeitversetzt, damit diagonale Beinpaare gleichzeitig fussen,
# Beinausschlag verstaerkt, Koerper federt staerker, Zyklus kuerzer.
import sys,os,math,copy; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__))); from glb import *
src,dst=sys.argv[1],sys.argv[2]
j,b=load(src); nodes=j['nodes']
walk=[a for a in j['animations'] if a['name']=='Walk'][0]
FRONT_SHIFT=0.29; LEG_GAIN=1.35; BOB_GAIN=2.2; DUR=0.68

def sample(t,v,x,T):
    x%=T
    for i in range(len(t)-1):
        if t[i]<=x<=t[i+1]:
            f=(x-t[i])/(t[i+1]-t[i]) if t[i+1]>t[i] else 0
            return lerp(v[i],v[i+1],f)
    return v[-1]
def lerp(a,c,f):
    if isinstance(a,float): return a+(c-a)*f
    if len(a)==4:
        d=sum(p*q for p,q in zip(a,c))
        if d<0: c=[-q for q in c]
        r=[p+(q-p)*f for p,q in zip(a,c)]; n=math.sqrt(sum(q*q for q in r)); return [q/n for q in r]
    return [p+(q-p)*f for p,q in zip(a,c)]
def qmul(a,c):
    ax,ay,az,aw=a;bx,by,bz,bw=c
    return [aw*bx+ax*bw+ay*bz-az*by,aw*by-ax*bz+ay*bw+az*bx,aw*bz+ax*by-ay*bx+az*bw,aw*bw-ax*bx-ay*by-az*bz]
def qpow(q,k):
    if q[3]<0: q=[-x for x in q]
    w=max(-1,min(1,q[3])); a=math.acos(w); s=math.sin(a)
    if s<1e-6: return [0,0,0,1]
    ax=[x/s for x in q[:3]]; s2=math.sin(a*k); return [ax[0]*s2,ax[1]*s2,ax[2]*s2,math.cos(a*k)]
def qmean(vs):
    r=[sum(v[i] for v in vs) for i in range(4)]; n=math.sqrt(sum(x*x for x in r)); return [x/n for x in r]

trot={'name':'Trot','channels':[],'samplers':[]}
for c in walk['channels']:
    s=walk['samplers'][c['sampler']]; nm=nodes[c['target']['node']]['name']; path=c['target']['path']
    t=read(j,b,s['input']); v=[list(x) if not isinstance(x,float) else x for x in read(j,b,s['output'])]
    T=t[-1]; n=len(t)
    shift=FRONT_SHIFT*T if nm.startswith(('Front','FF.','IKFront')) else 0
    out=[sample(t,v,ti-shift,T) for ti in t] if n>1 else v
    leg=('Leg' in nm or 'Shoulder' in nm) and path=='rotation' and n>1
    if leg:
        m=qmean(out); mi=[-m[0],-m[1],-m[2],m[3]]
        out=[qmul(m,qpow(qmul(mi,q),LEG_GAIN)) for q in out]
    if nm=='Body' and path=='translation' and n>1:
        my=sum(o[1] for o in out)/n
        out=[[o[0],my+(o[1]-my)*BOB_GAIN+0.04,o[2]] for o in out]
    nt=[ti*DUR/T for ti in t]
    ins=add(j,b,nt,'SCALAR'); outs=add(j,b,out,'SCALAR' if isinstance(out[0],float) else ('VEC4' if len(out[0])==4 else 'VEC3'))
    trot['samplers'].append({'input':ins,'output':outs,'interpolation':s.get('interpolation','LINEAR')})
    trot['channels'].append({'sampler':len(trot['samplers'])-1,'target':copy.deepcopy(c['target'])})
j['animations']=[a for a in j['animations'] if a['name']!='Trot']+[trot]
save(dst,j,b); print('ok',len(trot['channels']),'Kanaele')
