// Speed Crisis 3D chase-camera renderer - part 1: themes, camera, projection, sky/skyline
(()=>{'use strict';
const R3=window.R3={ok:false};
const TAU=Math.PI*2,cl=(v,a,b)=>v<a?a:v>b?b:v;
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const hex=h=>{h=h.replace('#','');return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]};
R3.TAU=TAU;R3.cl=cl;R3.wrap=wrap;R3.hex=hex;
// ---- themes (one per district, 12 + 3 DLC) ----
// kind: forest|desert|city|bridge|coast|snow|canyon
const T=(kind,sky,ground,fog,o)=>Object.assign({kind,sky:sky.map(hex),ground:hex(ground),fog:hex(fog),road:[58,60,66],night:0,far:3400},o||{});
R3.THEMES=[
T('forest',['#4f86c6','#9cc4e8','#d6e6f2'],'#2f6a2e','#cfe0ea'),
T('desert',['#3f86d0','#a6cdee','#f1dcb0'],'#cfae6e','#ecd9b0',{sand:1}),
T('bridge',['#6d7f8f','#9aa8b3','#c9d1d6'],'#2f5f86','#b9c3ca',{water:1,over:1}),
T('bridge',['#2a3d73','#e0765c','#f6c177'],'#254e72','#e8a47f',{water:1,sun:1}),
T('forest',['#33497a','#c0705a','#f0b58a'],'#2f5a2c','#d89a78',{sun:1}),
T('canyon',['#3b78c0','#9cc3e3','#efcf9f'],'#a5663c','#e0c09a',{sand:1}),
T('snow',['#7e97b3','#b9cadb','#e8eef4'],'#e6edf2','#dfe7ee'),
T('coast',['#2f86d6','#8ccbf0','#d5eefa'],'#2b7fb0','#cfe6f0',{water:1,palm:1}),
T('city',['#5c6b7a','#8e9ba6','#c1c9ce'],'#4a4f56','#b7bfc4'),
T('coast',['#31457a','#ef8a62','#ffd08a'],'#2a74a6','#f0b88a',{water:1,palm:1,sun:1}),
T('forest',['#6b7e8f','#98a9b5','#c6d0d6'],'#5d7a2c','#bcc8cf'),
T('city',['#070b18','#141c36','#2c2f55'],'#16181f','#232846',{night:1,rain:1,far:2600}),
T('bridge',['#050814','#101a3a','#3a3f73'],'#0d1b30','#252b52',{night:1,water:1,far:2800}),
T('city',['#2b2a5c','#c25a7a','#ffb36b'],'#3a3d46','#d58a7c',{sun:1}),
T('bridge',['#04060f','#0c1430','#262e63'],'#0a1626','#1e2450',{night:1,water:1,rain:1,far:2800})];
R3.NAMES=['Forest','Desert','Reservoir Bridge','Coral Bay Bridge','Eagle Crest','Canyon','Snow Pass','Ocean Coast','Valley City','Mission Beach','Oakmont','Rockingham Night City','Super Sports Night Bridge','Lamborghini City Sunset','Porsche Rain Bridge'];
// ---- camera ----
const C=R3.C={x:0,y:0,h:40,ch:0,cs:1,sn:0,F:700,hy:300,W:800,H:600,NEAR:6,hz:0};
R3.cam=C;let lastT=0;
R3.setup=()=>{const G=SCX.G,p=G.p,W=SCX.W,H=SCX.H,now=performance.now()/1000,dt=cl(now-lastT,0,.05);lastT=now;
if(G._rc!==G.cfg){G._rc=G.cfg;G.ch=p.a;G.fov=H*.95;G.bo=0;G.rdi=undefined;G.shk=0}
const sp=Math.hypot(p.vx,p.vy),k=cl(Math.abs(p.v)/(p.top||400),0,1.25);
let tg=p.a;if(sp>90&&p.z===0){const va=Math.atan2(p.vy,p.vx);tg=p.a+wrap(va-p.a)*.45}
G.ch+=wrap(tg-G.ch)*Math.min(1,dt*7);
G.bo+=((p.boosting?1:0)-G.bo)*Math.min(1,dt*4);
const fv=H*(.98-.12*k-.1*G.bo);G.fov+=(fv-G.fov)*Math.min(1,dt*3);
const zi=G.zi|0,D=[100,165,-24][zi]+(zi<2?G.bo*22+k*8:0),hh=[31,92,11][zi];
C.W=W;C.H=H;C.F=G.fov;C.ch=G.ch;C.cs=Math.cos(G.ch);C.sn=Math.sin(G.ch);
C.x=p.x-C.cs*D;C.y=p.y-C.sn*D;
const t=now,shake=(k>.6?(k-.6):0)*1.4+G.bo*1.6;
C.h=hh+p.z*.55+Math.sin(t*38)*shake*.5;
C.hy=H*(zi===2?.45:.395)-cl(p.vz||0,-300,300)*.04+Math.sin(t*31)*shake+(zi<2?-p.drift*.02:0);
C.hz=zi;C.k=k;C.dt=dt;C.t=t;C.avg=(C.avg||.016)*.96+Math.max(dt,.001)*.04;R3.lowq=C.avg>.045;R3.fogF=0;
};
// world -> camera space [forward,right,up]
R3.wc=(x,y,z)=>{const dx=x-C.x,dy=y-C.y;return[dx*C.cs+dy*C.sn,-dx*C.sn+dy*C.cs,z-C.h]};
R3.sx=q=>SCX.W/2+q[1]/q[0]*C.F;R3.sy=q=>C.hy-q[2]/q[0]*C.F;
const clipNear=P=>{const out=[],N=C.NEAR;for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length],ai=a[0]>=N,bi=b[0]>=N;if(ai)out.push(a);if(ai!==bi){const t=(N-a[0])/(b[0]-a[0]);out.push([N,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t])}}return out};
R3.path=P=>{const ctx=SCX.ctx,Q=clipNear(P);if(Q.length<3)return false;const w2=C.W/2;ctx.beginPath();for(let i=0;i<Q.length;i++){const q=Q[i],x=w2+q[1]/q[0]*C.F,y=C.hy-q[2]/q[0]*C.F;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath();return true};
// fog mixing
let FOG=[200,210,220],FAR=3400;
R3.setFog=(f,far)=>{FOG=f;FAR=far};
R3.fogT=d=>{const t=cl((d-FAR*.18)/(FAR*.82),0,1);return t*t*(3-2*t)};
R3.col=(c,k,d,a)=>{const t=d?R3.fogT(d):0,r=(c[0]*k)*(1-t)+FOG[0]*t,g=(c[1]*k)*(1-t)+FOG[1]*t,b=(c[2]*k)*(1-t)+FOG[2]*t;return a===undefined?'rgb('+(r|0)+','+(g|0)+','+(b|0)+')':'rgba('+(r|0)+','+(g|0)+','+(b|0)+','+a+')'};
// ---- generic 3D prism (cars, buildings, towers) ----
// tf(lx,ly,lz)->[wx,wy,wz]; faces drawn back-to-front with culling; shade[]: front,back,right,left,top
const FACES=[[0,1,5,4],[2,3,7,6],[3,0,4,7],[1,2,6,5],[4,5,6,7]];
R3.prism=(tf,hl,hw,z0,z1,tx,ty,base,k0,fogD,sh)=>{const ctx=SCX.ctx;sh=sh||[.85,.62,.7,.55,1.05];
const L=[[hl,hw,z0],[hl,-hw,z0],[-hl,-hw,z0],[-hl,hw,z0],[hl*tx,hw*ty,z1],[hl*tx,-hw*ty,z1],[-hl*tx,-hw*ty,z1],[-hl*tx,hw*ty,z1]];
const V=L.map(v=>{const w=tf(v[0],v[1],v[2]);return R3.wc(w[0],w[1],w[2])});
let cf=0,cr=0,cu=0;for(const v of V){cf+=v[0];cr+=v[1];cu+=v[2]}cf/=8;cr/=8;cu/=8;
const fs=[];for(let i=0;i<5;i++){const f=FACES[i],a=V[f[0]],b=V[f[1]],c=V[f[2]],d=V[f[3]];
const mf=(a[0]+b[0]+c[0]+d[0])/4,mr=(a[1]+b[1]+c[1]+d[1])/4,mu=(a[2]+b[2]+c[2]+d[2])/4;
const e1=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],e2=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
let n=[e1[1]*e2[2]-e1[2]*e2[1],e1[2]*e2[0]-e1[0]*e2[2],e1[0]*e2[1]-e1[1]*e2[0]];
if(n[0]*(mf-cf)+n[1]*(mr-cr)+n[2]*(mu-cu)<0)n=[-n[0],-n[1],-n[2]];
if(n[0]*mf+n[1]*mr+n[2]*mu<0)fs.push([mf,i,f])}
fs.sort((a,b)=>b[0]-a[0]);
for(const e of fs){const P=e[2].map(i=>V[i]);if(R3.path(P)){ctx.fillStyle=R3.col(base,sh[e[1]]*k0,fogD);ctx.fill()}}
return V};
// ---- sky + horizon ----
const rng=(s=>()=>(s=s*16807%2147483647)/2147483647);
let SKY={th:-1};
function buildSky(th,ti){const r=rng(777+ti*131),B=[];for(let L=0;L<2;L++){const a=[];let x=0;while(x<TAU){const w=.025+r()*.06*(L?1:.8),h=(L?.05:.09)+r()*(L?.13:.2)*(th.kind==='city'||th.kind==='bridge'?1:0);a.push({a:x,w,h,s:r(),sp:r()>.86});x+=w*(.4+r()*.9)}B.push(a)}SKY={th:ti,B}}
const noise=a=>Math.sin(a*3+1)*.5+Math.sin(a*7.3+2)*.3+Math.sin(a*17.1)*.2;
R3.drawSky=(th,ti)=>{const ctx=SCX.ctx,W=C.W,H=C.H,hy=C.hy,F=C.F;if(SKY.th!==ti)buildSky(th,ti);
const g=ctx.createLinearGradient(0,0,0,Math.max(hy,10));g.addColorStop(0,'rgb('+th.sky[0]+')');g.addColorStop(.6,'rgb('+th.sky[1]+')');g.addColorStop(1,'rgb('+th.sky[2]+')');ctx.fillStyle=g;ctx.fillRect(0,0,W,Math.max(hy,0)+2);
if(th.night){ctx.fillStyle='rgba(255,255,255,.8)';for(let i=0;i<60;i++){const a=i*2.399,x=W/2+wrap(a-C.ch)*F,y=(i*37%100)/100*hy*.8;if(x>0&&x<W)ctx.fillRect(x,y,1.5,1.5)}}
const sa=1.1,sx=W/2+wrap(sa-C.ch)*F,sy=hy-H*(th.sun?.07:.22);
if(th.sun||th.night){const rd=H*(th.sun?.55:.25),gr=ctx.createRadialGradient(sx,sy,0,sx,sy,rd);gr.addColorStop(0,th.night?'rgba(210,225,255,.9)':'rgba(255,240,200,.95)');gr.addColorStop(.12,th.night?'rgba(150,170,255,.25)':'rgba(255,190,110,.55)');gr.addColorStop(1,'rgba(255,160,90,0)');ctx.fillStyle=gr;ctx.fillRect(0,0,W,hy+4)}
else{const gr=ctx.createRadialGradient(sx,sy,0,sx,sy,H*.3);gr.addColorStop(0,'rgba(255,255,240,.7)');gr.addColorStop(1,'rgba(255,255,240,0)');ctx.fillStyle=gr;ctx.fillRect(0,0,W,hy+4)}
// clouds
if(!th.night){const over=th.kind==='bridge'||th.kind==='city',pa=over?.5:.95;for(let i=0;i<7;i++){const a=i*.9+C.t*.0015,x=W/2+wrap(a-C.ch)*F,y=hy*(.16+(i*37%30)/100),sc=(.7+(i%3)*.35)*H/720;if(x<-260*sc||x>W+260*sc)continue;
for(let j=0;j<5;j++){const px=x+(j-2)*46*sc+(j%2)*10*sc,py=y+(j%3===1?-14:(j%2?6:0))*sc,r=(36+(j===2?22:j%3*6))*sc,g2=ctx.createRadialGradient(px-r*.2,py-r*.35,r*.1,px,py,r);g2.addColorStop(0,'rgba(255,255,255,'+pa+')');g2.addColorStop(.65,'rgba('+(over?'225,230,238':'240,245,252')+','+pa*.85+')');g2.addColorStop(1,'rgba(190,205,225,0)');ctx.fillStyle=g2;ctx.fillRect(px-r,py-r,r*2,r*2)}
ctx.fillStyle='rgba(150,170,200,'+.16*pa+')';ctx.beginPath();ctx.ellipse(x,y+28*sc,120*sc,9*sc,0,0,TAU);ctx.fill()}}
// horizon silhouettes
const fogc=th.fog,k=th.night?.35:1;
if(th.kind==='city'||th.kind==='bridge'){for(let L=0;L<2;L++){const col=L?[.5,.55,.62]:[.68,.72,.78],dark=th.night?(L?.12:.2):1;for(const b of SKY.B[L]){let dx=wrap(b.a-C.ch);if(dx<-1.3||dx>1.3)continue;const x=W/2+dx*F,w=b.w*F,h=b.h*F;if(x+w<0||x>W)continue;
ctx.fillStyle=th.night?'rgb('+(fogc[0]*(.45+L*.1)|0)+','+(fogc[1]*(.45+L*.1)|0)+','+(fogc[2]*(.55+L*.1)|0)+')':'rgb('+((fogc[0]*(L?.78:.9))|0)+','+((fogc[1]*(L?.8:.92))|0)+','+((fogc[2]*(L?.84:.94))|0)+')';ctx.fillRect(x,hy-h,w,h+3);
if(b.sp&&L===0){ctx.fillRect(x+w*.45,hy-h-h*.35,w*.1,h*.35)}
if(th.night&&w>5){ctx.fillStyle='rgba(255,214,140,.55)';for(let yy=hy-h+4;yy<hy-2;yy+=7)for(let xx=x+2;xx<x+w-2;xx+=6)if(((xx*7+yy*13)|0)%5<2)ctx.fillRect(xx,yy,2,3)}}}}
else{for(let L=0;L<2;L++){ctx.beginPath();ctx.moveTo(0,hy+2);const amp=th.kind==='snow'||th.kind==='canyon'?.2:.12;for(let x=0;x<=W;x+=8){const a=C.ch+(x-W/2)/F,h=(.1+amp*(.5+.5*noise(a*(L?1.7:1)+L*4)))*F*(L?.7:1)+(th.kind==='forest'&&L?Math.max(0,Math.sin(a*210))*F*.012:0);ctx.lineTo(x,hy-h)}ctx.lineTo(W,hy+2);ctx.closePath();
const m=L?.6:.78;ctx.fillStyle='rgb('+((fogc[0]*m+th.ground[0]*(1-m)*.5)|0)+','+((fogc[1]*m+th.ground[1]*(1-m)*.5)|0)+','+((fogc[2]*m+th.ground[2]*(1-m)*.5)|0)+')';ctx.fill();
if(th.kind==='snow'){ctx.save();ctx.clip();ctx.fillStyle='rgba(255,255,255,.55)';ctx.fillRect(0,hy-.3*F,W,.3*F-(L?0:10));ctx.restore()}}}
// ground
const gg=ctx.createLinearGradient(0,hy,0,H),gc=th.ground,f=th.fog;gg.addColorStop(0,'rgb('+f+')');gg.addColorStop(.12,'rgb('+((f[0]*.55+gc[0]*.45)|0)+','+((f[1]*.55+gc[1]*.45)|0)+','+((f[2]*.55+gc[2]*.45)|0)+')');gg.addColorStop(.5,'rgb('+gc+')');gg.addColorStop(1,'rgb('+((gc[0]*.85)|0)+','+((gc[1]*.85)|0)+','+((gc[2]*.85)|0)+')');ctx.fillStyle=gg;ctx.fillRect(0,hy,W,H-hy+2);
if(!th.water&&th.kind!=='city'){ctx.fillStyle='rgba(0,0,0,.05)';for(let ff=40;ff<2600;ff+=90){const y1=hy+C.h*F/ff,y2=hy+C.h*F/(ff+45);if(y1>H)continue;ctx.fillRect(0,y2,W,y1-y2)}}
if(th.water){ctx.strokeStyle='rgba(255,255,255,.13)';ctx.lineWidth=1.5;for(let i=0;i<26;i++){const q=(i/26+C.t*.03)%1,yy=hy+Math.pow(q,2.2)*(H-hy),ww=W*(.2+q*.7);ctx.beginPath();ctx.moveTo(W/2-ww+Math.sin(i*9+C.t)*30,yy);ctx.lineTo(W/2+ww+Math.cos(i*7+C.t)*30,yy);ctx.stroke()}}
};
})();
