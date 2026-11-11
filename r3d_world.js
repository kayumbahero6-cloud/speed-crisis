// Speed Crisis 3D renderer - part 2: road, scenery, bridges, ramps, water, finish line
(()=>{'use strict';
const R3=window.R3,C=R3.C,cl=R3.cl,TAU=R3.TAU;
const rng=s=>()=>(s=s*16807%2147483647)/2147483647;
let D=null,DK='',SEQ=[];
// ---- dense track (a point every ~30 units) + scenery ----
function ensure(thi){const T=SCX.T,n=SCX.n,pts=T.pts,key=n+'|'+(SCX.total|0)+'|'+(pts[7]?pts[7][0]|0:0)+'|'+thi;if(key===DK)return D;DK=key;
const X=[],Y=[];for(let i=0;i<n;i++){const j=(i+1)%n,k=Math.max(1,Math.ceil(T.seg[i]/30));for(let s=0;s<k;s++){const t=s/k;X.push(pts[i][0]+(pts[j][0]-pts[i][0])*t);Y.push(pts[i][1]+(pts[j][1]-pts[i][1])*t)}}
const N=X.length,A=[],NX=[],NY=[];for(let m=0;m<N;m++){const a=Math.atan2(Y[(m+1)%N]-Y[(m+N-1)%N],X[(m+1)%N]-X[(m+N-1)%N]);A.push(a);NX.push(-Math.sin(a));NY.push(Math.cos(a))}
D={N,X,Y,A,NX,NY,obj:[],tw:[]};gen(D,thi);return D}
function gen(D,thi){const th=R3.THEMES[thi],r=rng(4321+thi*77+D.N),N=D.N,RW=SCX.RW,o=D.obj;
const put=(m,s,off,q)=>o.push(Object.assign({x:D.X[m]+D.NX[m]*s*off,y:D.Y[m]+D.NY[m]*s*off,a:D.A[m],side:s,m},q));
for(let m=0;m<N;m++)for(const s of[-1,1]){const e=RW/2;
switch(th.kind){
case'forest':case'snow':if(m%2===0&&r()<.88)put(m,s,e+70+r()*650,{t:th.kind==='snow'?'pine':'tree',h:90+r()*140,w:40+r()*40,s:r()});if(r()<.05)put(m,s,e+55+r()*60,{t:'rock',h:20+r()*30,w:30+r()*40,s:r()});break;
case'desert':if(m%3===0&&r()<.55)put(m,s,e+60+r()*400,{t:'rock',h:20+r()*40,w:30+r()*60,s:r()});if(m%7===0&&r()<.7)put(m,s,e+320+r()*700,{t:'mesa',h:160+r()*320,w:60+r()*90,s:r()});if(m%5===0&&r()<.4)put(m,s,e+60+r()*300,{t:'cactus',h:60+r()*60,w:30,s:r()});break;
case'canyon':if(m%2===0)put(m,s,e+75+r()*110,{t:'mesa',h:140+r()*360,w:40+r()*50,s:r()});if(m%3===1&&r()<.4)put(m,s,e+52+r()*30,{t:'rock',h:25+r()*30,w:40+r()*30,s:r()});break;
case'coast':if(m%3===0&&r()<.55)put(m,s,e+46+r()*34,{t:'palm',h:110+r()*50,w:70,s:r()});if(m%11===0&&r()<.3)put(m,s,e+90+r()*160,{t:'rock',h:30+r()*40,w:50+r()*50,s:r()});break;
case'city':if(m%2===0){const hw=24+r()*30;put(m,s,e+58+hw,{t:'bldg',h:130+r()*520,w:hw,s:r()})}if(m%4===1&&r()<.8){const hw=30+r()*40;put(m,s,e+140+hw+r()*80,{t:'bldg',h:300+r()*700,w:hw,s:r()})}if(m%4===0)put(m,s,e+14,{t:'lamp',h:95,w:10,s:r()});break;
case'bridge':if(m%3===0)put(m,s,e+12,{t:'lamp',h:100,w:10,s:r()});break}}
const country=['forest','desert','coast','snow','canyon'].includes(th.kind),e=RW/2,wa=a=>Math.atan2(Math.sin(a),Math.cos(a));
for(let m=0;m<N;m++){const turn=wa(D.A[(m+5)%N]-D.A[m]);
if(Math.abs(turn)>.15&&m%2===0)put(m,turn>0?-1:1,e+30,{t:'chev',dir:turn>0?1:-1,s:0,h:34,w:46});
if(country){if(m%4===0)for(const s of[-1,1])put(m,s,e+26,{t:'stake',h:26,w:4,s:0});
if(th.kind!=='canyon'&&m%3===0&&r()<.5)put(m,r()<.5?-1:1,e+34+r()*150,{t:'bush',h:18+r()*14,w:34+r()*24,s:r()});
if(m%55===13&&th.kind!=='snow')put(m,r()<.5?-1:1,e+600+r()*900,{t:'windmill',h:300,w:80,s:r()})}
if(m>=4&&m<=40&&m%9===4)for(const s of[-1,1])put(m,s,e+105,{t:'stand',h:62,w:44,l:100,s:r()});
if((m<=36||m>N-24)&&m%4===0)for(const s of[-1,1])put(m,s,e+22,{t:'banner',h:15,w:30,s:r()})}
if(th.kind==='bridge')for(let m=10;m<N;m+=26)D.tw.push(m)}
// ---- road ----
const SH={forest:[[128,112,76],44],snow:[[235,240,245],44],desert:[[222,196,140],70],canyon:[[190,130,90],60],coast:[[220,200,150],64],city:[[128,130,134],44],bridge:[[152,154,158],20]};
function findIdx(d,G,p){let best=1e18,bm=0;const N=d.N,chk=m=>{m=((m%N)+N)%N;const dx=d.X[m]-p.x,dy=d.Y[m]-p.y,q=dx*dx+dy*dy;if(q<best){best=q;bm=m}};
if(G.rdi===undefined)for(let m=0;m<N;m++)chk(m);else for(let k=-16;k<=16;k++)chk(G.rdi+k);G.rdi=bm;return bm}
const pt=(d,m,o,z)=>R3.wc(d.X[m]+d.NX[m]*o,d.Y[m]+d.NY[m]*o,z||0);
R3.drawRoad=thi=>{const th=R3.THEMES[thi],d=ensure(thi),ctx=SCX.ctx,G=SCX.G,p=G.p,RW=SCX.RW,hw=RW/2,N=d.N;
const rdi=findIdx(d,G,p);R3.rdi=rdi;R3.D=d;
{R3.corner=null;const wa=a=>Math.atan2(Math.sin(a),Math.cos(a));for(let i=2;i<80;i++){const m=(rdi+i)%N,t=wa(d.A[(m+5)%N]-d.A[m]);if(Math.abs(t)>.14){let sev=0;for(let j=0;j<12;j++){const mm=(m+j)%N;sev=Math.max(sev,Math.abs(wa(d.A[(mm+5)%N]-d.A[mm])))}R3.corner={m,dir:t>0?1:-1,dist:i*30*.73,sev};break}}}
SEQ.length=0;let i=rdi-7,c=0;while(c<190){SEQ.push(((i%N)+N)%N);i+=c<46?1:c<100?2:4;c++}
const sh=SH[th.kind]||SH.forest,roadC=th.rain?[38,42,54]:th.night?[46,48,58]:th.road,far=th.far;
const f0=[];for(const m of SEQ)f0.push(pt(d,m,0)[0]);
for(let k=SEQ.length-2;k>=0;k--){const m1=SEQ[k],m2=SEQ[k+1];const fm=(f0[k]+f0[k+1])/2;if(f0[k]>far*1.05&&f0[k+1]>far*1.05)continue;if(f0[k]<-60&&f0[k+1]<-60)continue;
const st=((m2-m1+N)%N)||1,par=Math.floor((m1/st))&1;
const quad=(o1,o2,z)=>[pt(d,m1,o1,z),pt(d,m1,o2,z),pt(d,m2,o2,z),pt(d,m2,o1,z)];
const fill=(P,col)=>{if(R3.path(P)){ctx.fillStyle=col;ctx.fill();ctx.strokeStyle=col;ctx.lineWidth=1;ctx.stroke()}};
if(th.kind==='forest'&&fm<far*.9){const FC=[[96,150,52],[132,168,64],[214,176,52],[226,138,44],[74,128,54],[158,176,78]];for(const s of[-1,1])for(let b=0;b<3;b++){const hsh=h2(Math.floor(m1/11)+s*40,b*7),c=FC[(hsh*FC.length)|0],o1=s>0?hw+sh[1]+b*150:-(hw+sh[1]+b*150+150),o2=o1+150;fill(quad(o1,o2,0),R3.col(c,par?1:.9,fm))}}
// shoulders
fill(quad(hw,hw+sh[1],0),R3.col(sh[0],par?1:.93,fm));fill(quad(-hw-sh[1],-hw,0),R3.col(sh[0],par?1:.93,fm));
// kerbs
if(th.kind!=='bridge'){const kc=par?[225,225,225]:[200,40,40];fill(quad(hw,hw+9,0),R3.col(kc,1,fm));fill(quad(-hw-9,-hw,0),R3.col(kc,1,fm))}
// asphalt
const nz=.92+(((Math.sin(m1*12.9898)*43758.5453)%1+1)%1)*.1;fill(quad(-hw,hw,0),R3.col(roadC,(par?1:.95)*nz,fm));
if(fm<far*.75){const fa=1-fm/far;for(const lc of[-hw*.66,0,hw*.66])fill(quad(lc-9,lc+9,.02),'rgba(0,0,0,'+(.1*fa)+')');
const blk=Math.floor(m1/9);if(blk%3===0&&th.kind!=='snow'){const so=((blk*7919)%100)/100*hw*1.5-hw*.75;fill(quad(so,so+3,.03),'rgba(0,0,0,'+(.22*fa)+')');fill(quad(so+9,so+12,.03),'rgba(0,0,0,'+(.2*fa)+')')}}
if(fm<far*.9){const lc=th.night?[235,235,215]:[240,240,235];
fill(quad(-hw+4,-hw+8,0),R3.col(lc,1,fm));fill(quad(hw-8,hw-4,0),R3.col(lc,1,fm));
if(!par&&st<3&&fm<far*.55)fill(quad(-3,3,.04),'rgba(70,225,255,'+(.85*(1-fm/far/.55))+')');
if(!par&&st<3){const yc=[250,205,70];fill(quad(-hw/3-1.4,-hw/3+1.4,0),R3.col(lc,1,fm));fill(quad(hw/3-1.4,hw/3+1.4,0),R3.col(lc,1,fm))}
{const al=(th.rain?.2:th.night?.1:.07)*(.2+.8*Math.min(1,fm/far));fill(quad(-hw,hw,.05),th.night?'rgba(150,170,255,'+al+')':'rgba(210,225,245,'+al+')')}}}
// start / finish checkers
{const T=SCX.T,x=T.pts[0][0],y=T.pts[0][1],a=T.ang[0],cs=Math.cos(a),sn=Math.sin(a);
for(let row=0;row<2;row++)for(let col=0;col<10;col++){const u0=-8+row*8,u1=u0+8,l0=-hw+col*RW/10,l1=l0+RW/10;
const P=[[u0,l0],[u0,l1],[u1,l1],[u1,l0]].map(q=>R3.wc(x+cs*q[0]-sn*q[1],y+sn*q[0]+cs*q[1],.3));const f=P[0][0];if(f<far&&f>-40&&R3.path(P)){ctx.fillStyle=R3.col((row+col)%2?[245,245,245]:[20,20,20],1,f);ctx.fill()}}}
// water hazards
for(const w of SCX.T.waters){const co=Math.cos(w.a),si=Math.sin(w.a),hl=w.l/2,hww=Math.min(w.w/2,500),q=(u,l,z)=>R3.wc(w.x+co*u-si*l,w.y+si*u+co*l,z);
const P=[q(-hl,-hww,.6),q(-hl,hww,.6),q(hl,hww,.6),q(hl,-hww,.6)];if(P[0][0]>far&&P[2][0]>far)continue;if(R3.path(P)){const f=Math.max(60,q(0,0,0)[0]);ctx.fillStyle=R3.col([40,110,180],1,f*.6);ctx.fill();
ctx.save();ctx.clip();ctx.strokeStyle='rgba(190,230,255,.55)';ctx.lineWidth=2;for(let k=-5;k<=5;k++){const l=k*90+Math.sin(C.t*2+k)*10,A=q(-hl,l,.7),B=q(hl,l,.7);if(R3.path([A,B,[B[0],B[1]+3,B[2]],[A[0],A[1]+3,A[2]]])){ctx.stroke()}}ctx.restore()}}
};
// ---- world items (objects sorted far -> near with cars etc.) ----
const PAL=[[150,155,162],[120,135,150],[170,160,145],[100,110,125],[140,125,115],[165,170,180]];
function building(o,f,th){const ctx=SCX.ctx,cs=Math.cos(o.a),sn=Math.sin(o.a),hl=29,hw=o.w,pal=PAL[(o.s*PAL.length)|0],k=th.night?.32:1;
const V=R3.prism((lx,ly,lz)=>[o.x+lx*cs-ly*sn,o.y+lx*sn+ly*cs,lz],hl,hw,0,o.h,1,1,pal,k,f,[.8,.62,.72,.6,1.1]);
if(f>2300||V.some(v=>v[0]<18))return;const faces=[[2,3,7,6],o.side>0?[1,2,6,5]:[3,0,4,7]];
for(const fc of faces){const a=V[fc[0]],b=V[fc[1]],c=V[fc[2]],d=V[fc[3]];
// only draw if face is roughly facing camera: reuse normal sign
const e1=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],e2=[d[0]-a[0],d[1]-a[1],d[2]-a[2]],n=[e1[1]*e2[2]-e1[2]*e2[1],e1[2]*e2[0]-e1[0]*e2[2],e1[0]*e2[1]-e1[1]*e2[0]];
const out=(n[0]*(a[0]+c[0])+n[1]*(a[1]+c[1])+n[2]*(a[2]+c[2]));
const ctr=[(V[0][0]+V[6][0])/2,(V[0][1]+V[6][1])/2,(V[0][2]+V[6][2])/2],mid=[(a[0]+c[0])/2,(a[1]+c[1])/2,(a[2]+c[2])/2],dir=n[0]*(mid[0]-ctr[0])+n[1]*(mid[1]-ctr[1])+n[2]*(mid[2]-ctr[2]);
const sg=dir<0?-1:1;if(out*sg>=0)continue;
const lerp=(p,q,t)=>[p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t,p[2]+(q[2]-p[2])*t];
const nf=Math.max(4,Math.min(f<900?14:9,(o.h/24)|0)),nc=f<900?5:1;
for(let fl=0;fl<nf;fl++){const v0=(fl+.28)/nf,v1=(fl+.72)/nf;
for(let cc=0;cc<nc;cc++){const hsh=(o.m*131+fl*17+cc*7+((o.s*1000)|0))%11;let lit=th.night?hsh<5:true;if(!lit)continue;
const u0=nc===1?.06:(cc+.2)/nc,u1=nc===1?.94:(cc+.8)/nc;
const bl=lerp(a,b,u0),br=lerp(a,b,u1),tl=lerp(d,c,u0),tr=lerp(d,c,u1);
const P=[lerp(bl,tl,v0),lerp(br,tr,v0),lerp(br,tr,v1),lerp(bl,tl,v1)];
if(R3.path(P)){ctx.fillStyle=th.night?R3.col([255,208,130],hsh<2?1:.75,f,.9):R3.col([70,95,125],.9+hsh*.02,f);ctx.fill()}}}}}
function mesa(o,f,th){const cs=Math.cos(o.a),sn=Math.sin(o.a),cn=th.kind==='canyon'?[168,98,64]:[190,128,86];R3.prism((lx,ly,lz)=>[o.x+lx*cs-ly*sn,o.y+lx*sn+ly*cs,lz],o.w*1.1,o.w,0,o.h,.78,.78,cn,.8+o.s*.3,f,[.8,.6,.7,.55,1.15])}
function bb(o,f,r){const s=C.F/f;return[C.W/2+r*s,C.hy+C.h*s,s]}
function tree(o,f,r,th){const ctx=SCX.ctx,[bx,by,s]=bb(o,f,r),h=o.h*s,w=o.w*s;SHD(ctx,bx,by,w,h,f);const k=.75+o.s*.5,gc=th.night?[18,48,26]:th.sun?[60,86,40]:[44,110,44];
ctx.fillStyle=R3.col([80,56,34],th.night?.3:1,f);ctx.fillRect(bx-w*.07,by-h*.4,w*.14,h*.4);
for(const q of[[0,.62,.5],[-.22,.5,.36],[.22,.52,.36],[0,.82,.38]]){ctx.fillStyle=R3.col(gc,k*(.8+q[1]*.3),f);ctx.beginPath();ctx.ellipse(bx+q[0]*w,by-h*q[1],w*q[2],h*.22,0,0,TAU);ctx.fill()}}
function pine(o,f,r,th){const ctx=SCX.ctx,[bx,by,s]=bb(o,f,r),h=o.h*s,w=o.w*s*.8;SHD(ctx,bx,by,w,h,f);const sn=th.kind==='snow';
ctx.fillStyle=R3.col([70,50,34],1,f);ctx.fillRect(bx-w*.05,by-h*.25,w*.1,h*.25);
for(let i=0;i<4;i++){const y1=by-h*(.15+i*.2),y0=y1-h*.34,ww=w*(.5-i*.1);ctx.fillStyle=R3.col(sn?[225,235,242]:[30,86,52],.8+i*.06,f);ctx.beginPath();ctx.moveTo(bx,y0);ctx.lineTo(bx+ww,y1);ctx.lineTo(bx-ww,y1);ctx.fill();if(sn){ctx.fillStyle=R3.col([40,92,62],1,f);ctx.beginPath();ctx.moveTo(bx-ww*.55,y1-h*.04);ctx.lineTo(bx+ww*.55,y1-h*.04);ctx.lineTo(bx+ww,y1);ctx.lineTo(bx-ww,y1);ctx.fill()}}}
function rock(o,f,r,th){const ctx=SCX.ctx,[bx,by,s]=bb(o,f,r),h=o.h*s,w=o.w*s;ctx.fillStyle=R3.col(th.sand?[160,130,100]:[118,120,124],.8+o.s*.3,f);ctx.beginPath();ctx.ellipse(bx,by-h*.3,w*.6,h*.6,0,Math.PI,TAU);ctx.lineTo(bx+w*.6,by);ctx.lineTo(bx-w*.6,by);ctx.fill();ctx.fillStyle=R3.col([255,255,255],1,f,.12);ctx.beginPath();ctx.ellipse(bx-w*.15,by-h*.5,w*.25,h*.2,0,0,TAU);ctx.fill()}
function cactus(o,f,r,th){const ctx=SCX.ctx,[bx,by,s]=bb(o,f,r),h=o.h*s,w=o.w*s,c=R3.col([60,120,70],1,f);ctx.fillStyle=c;ctx.fillRect(bx-w*.12,by-h,w*.24,h);ctx.fillRect(bx-w*.5,by-h*.6,w*.4,w*.16);ctx.fillRect(bx-w*.5,by-h*.85,w*.16,h*.3);ctx.fillRect(bx+w*.1,by-h*.5,w*.4,w*.16);ctx.fillRect(bx+w*.34,by-h*.75,w*.16,h*.3)}
function palm(o,f,r,th){const ctx=SCX.ctx,[bx,by,s]=bb(o,f,r),h=o.h*s,w=o.w*s;ctx.strokeStyle=R3.col([120,90,60],1,f);ctx.lineWidth=Math.max(1,w*.09);ctx.beginPath();ctx.moveTo(bx,by);ctx.quadraticCurveTo(bx+w*.12,by-h*.5,bx+w*.05,by-h);ctx.stroke();ctx.strokeStyle=R3.col([50,130,60],1,f);ctx.lineWidth=Math.max(1,w*.05);for(let i=0;i<7;i++){const a=i/7*TAU;ctx.beginPath();ctx.moveTo(bx+w*.05,by-h);ctx.quadraticCurveTo(bx+w*.05+Math.cos(a)*w*.35,by-h-w*.12,bx+w*.05+Math.cos(a)*w*.55,by-h+w*.16+Math.abs(Math.sin(a))*w*.12);ctx.stroke()}}
function lamp(o,f,r,th){const ctx=SCX.ctx,[bx,by,s]=bb(o,f,r),h=o.h*s,w=Math.max(1,3*s),dir=-o.side;ctx.fillStyle=R3.col([90,92,98],1,f);ctx.fillRect(bx-w/2,by-h,w,h);ctx.fillRect(Math.min(bx,bx+dir*28*s),by-h,28*s,w);
if(th.night||th.sun){const lx=bx+dir*28*s,ly=by-h,rd=Math.max(5,Math.min(60*s,90));ctx.save();ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(lx,ly,0,lx,ly,rd);g.addColorStop(0,'rgba(255,225,160,.6)');g.addColorStop(.25,'rgba(255,200,120,.18)');g.addColorStop(1,'rgba(255,180,100,0)');ctx.fillStyle=g;ctx.fillRect(lx-rd,ly-rd,rd*2,rd*2);ctx.restore()}}
const h2=(a,b)=>{const x=Math.sin(a*127.1+b*311.7)*43758.5453;return x-Math.floor(x)};
const SHD=(ctx,bx,by,w,h,f)=>{ctx.fillStyle='rgba(0,0,0,'+(.22*(1-R3.fogT(f)))+')';ctx.beginPath();ctx.ellipse(bx+w*.28,by,w*.55,h*.045+1,0,0,TAU);ctx.fill()};
function chev(o,f,r,th){const ctx=SCX.ctx,[bx,by,s]=bb(o,f,r),w=o.w*s,h=o.h*s,y0=by-22*s;ctx.fillStyle=R3.col([48,48,52],1,f);ctx.fillRect(bx-w*.4,y0,Math.max(1,w*.06),22*s);ctx.fillRect(bx+w*.34,y0,Math.max(1,w*.06),22*s);
ctx.fillStyle=R3.col([250,208,30],1,f);ctx.fillRect(bx-w/2,y0-h,w,h);ctx.strokeStyle=R3.col([20,20,20],1,f);ctx.lineWidth=Math.max(1,2*s);ctx.strokeRect(bx-w/2,y0-h,w,h);
ctx.lineWidth=Math.max(1.2,5.5*s);ctx.lineJoin='miter';for(const dx of[-.2,.12]){const x=bx+dx*w;ctx.beginPath();ctx.moveTo(x-o.dir*w*.1,y0-h*.85);ctx.lineTo(x+o.dir*w*.1,y0-h*.5);ctx.lineTo(x-o.dir*w*.1,y0-h*.15);ctx.stroke()}}
function stake(o,f,r,th){const ctx=SCX.ctx,[bx,by,s]=bb(o,f,r),h=o.h*s,w=Math.max(1,o.w*s);ctx.fillStyle=R3.col([30,30,34],1,f);ctx.fillRect(bx-w/2,by-h,w,h);ctx.fillStyle=R3.col([240,240,240],1,f);ctx.fillRect(bx-w/2,by-h,w,h*.22)}
function bush(o,f,r,th){const ctx=SCX.ctx,[bx,by,s]=bb(o,f,r),h=o.h*s,w=o.w*s,c=o.s<.35?[210,150,40]:o.s<.7?[96,126,44]:[62,104,52];SHD(ctx,bx,by,w,h,f);for(const q of[[-.28,.5,.34],[.25,.46,.3],[0,.7,.38]]){ctx.fillStyle=R3.col(c,.75+q[1]*.4,f);ctx.beginPath();ctx.ellipse(bx+q[0]*w,by-h*q[1],w*q[2],h*.34,0,0,TAU);ctx.fill()}}
function windmill(o,f,r,th){const ctx=SCX.ctx,[bx,by,s]=bb(o,f,r),h=o.h*s,w=o.w*s;ctx.fillStyle=R3.col([234,228,214],1,f);ctx.beginPath();ctx.moveTo(bx-w*.32,by);ctx.lineTo(bx+w*.32,by);ctx.lineTo(bx+w*.18,by-h*.68);ctx.lineTo(bx-w*.18,by-h*.68);ctx.fill();ctx.fillStyle=R3.col([150,72,52],1,f);ctx.beginPath();ctx.moveTo(bx-w*.24,by-h*.68);ctx.lineTo(bx,by-h*.88);ctx.lineTo(bx+w*.24,by-h*.68);ctx.fill();
const cx=bx,cy=by-h*.76,L=h*.6;ctx.strokeStyle=R3.col([242,240,232],1,f);ctx.lineWidth=Math.max(1,w*.07);for(let i=0;i<4;i++){const a=C.t*.45+i*Math.PI/2;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(a)*L,cy+Math.sin(a)*L);ctx.stroke()}}
function banner(o,f,r,th){const ctx=SCX.ctx,[bx,by,s]=bb(o,f,r),w=o.w*s,h=o.h*s;ctx.fillStyle=R3.col([40,40,44],1,f);ctx.fillRect(bx-w*.46,by-h-8*s,Math.max(1,w*.04),h+8*s);ctx.fillRect(bx+w*.42,by-h-8*s,Math.max(1,w*.04),h+8*s);
const y=by-h-8*s;ctx.fillStyle=R3.col(o.s<.5?[18,18,20]:[238,238,240],1,f);ctx.fillRect(bx-w/2,y,w,h);const n=8,q=w/n;ctx.fillStyle=R3.col(o.s<.5?[240,240,240]:[20,20,20],1,f);for(let i=0;i<n;i++)for(let j=0;j<2;j++)if((i+j)%2)ctx.fillRect(bx-w/2+i*q,y+j*h/2,q,h/2);ctx.fillStyle=R3.col([225,40,40],1,f);ctx.fillRect(bx-w/2,y+h-h*.14,w,h*.14)}
function stand(o,f,th){const ctx=SCX.ctx,cs=Math.cos(o.a),sn=Math.sin(o.a),k=th.night?.35:1,tf=(lx,ly,lz)=>[o.x+lx*cs-ly*sn,o.y+lx*sn+ly*cs,lz];
const V=R3.prism(tf,o.l/2,o.w,0,o.h,.95,.5,[148,150,156],k,f,[.8,.62,.72,.6,1.05]);R3.prism((lx,ly,lz)=>tf(lx,ly,lz+o.h+24),o.l/2+4,o.w*.8,0,5,1,1,[215,52,46],k,f);
if(f>1500||V.some(v=>v[0]<20))return;const fc=o.side>0?[1,2,6,5]:[3,0,4,7],a=V[fc[0]],b=V[fc[1]],c=V[fc[2]],d=V[fc[3]];
const lerp=(p,q,t)=>[p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t,p[2]+(q[2]-p[2])*t],nr=f<900?4:1,nc=f<900?18:1;
for(let i=0;i<nr;i++)for(let j=0;j<nc;j++){const u0=j/nc,u1=(j+.8)/nc,v0=(i+.1)/nr,v1=(i+.85)/nr,bl=lerp(a,b,u0),br=lerp(a,b,u1),tl=lerp(d,c,u0),tr=lerp(d,c,u1),P=[lerp(bl,tl,v0),lerp(br,tr,v0),lerp(br,tr,v1),lerp(bl,tl,v1)];
if(R3.path(P)){const q=h2(o.m*7+i,j+o.s*50),cl=nc===1?[150,110,100]:q<.2?[220,60,60]:q<.4?[240,200,60]:q<.6?[70,110,200]:q<.8?[235,235,235]:[60,60,70];ctx.fillStyle=R3.col(cl,.9,f);ctx.fill()}}}
const DRAW={bldg:building,mesa,tree,pine,rock,cactus,palm,lamp,chev,stake,bush,windmill,banner,stand};
// suspension bridge towers + cables
function tower(m,d,th){const ctx=SCX.ctx,RW=SCX.RW,hw=RW/2+26,a=d.A[m],cs=Math.cos(a),sn=Math.sin(a),k=th.night?.35:1,TH=520,col=th.night?[120,125,140]:[190,196,204];
const tf=(cx,cy)=>(lx,ly,lz)=>[cx+lx*cs-ly*sn,cy+lx*sn+ly*cs,lz];const fc=R3.wc(d.X[m],d.Y[m],0)[0];
for(const s of[-1,1]){const cx=d.X[m]+d.NX[m]*s*hw,cy=d.Y[m]+d.NY[m]*s*hw;R3.prism(tf(cx,cy),13,11,0,TH,.8,.8,col,k,fc)}
for(const z of[TH*.62,TH*.9]){R3.prism(tf(d.X[m],d.Y[m]),9,hw,z,z+22,1,1,col,k,fc)}
ctx.lineCap='round';const cab=th.night?'rgba(200,205,230,.85)':'rgba(220,225,232,.95)';
for(const s of[-1,1]){const off=s*(RW/2+20);let prev=null;for(let j=-24;j<=24;j+=2){const mm=((m+j)%d.N+d.N)%d.N,z=14+(TH-14)*Math.pow(Math.abs(j)/24,2),P=R3.wc(d.X[mm]+d.NX[mm]*off,d.Y[mm]+d.NY[mm]*off,z);const Q=R3.wc(d.X[mm]+d.NX[mm]*off,d.Y[mm]+d.NY[mm]*off,14);
if(P[0]>R3.cam.NEAR+2){const x=C.W/2+P[1]/P[0]*C.F,y=C.hy-P[2]/P[0]*C.F,x2=C.W/2+Q[1]/Q[0]*C.F,y2=C.hy-Q[2]/Q[0]*C.F;ctx.strokeStyle=R3.col([200,205,215],1,P[0],.35);ctx.lineWidth=Math.min(3,Math.max(.6,1.2*C.F/P[0]));ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke();
if(prev){ctx.strokeStyle=cab;ctx.lineWidth=Math.min(7,Math.max(1,4*C.F/P[0]));ctx.beginPath();ctx.moveTo(prev[0],prev[1]);ctx.lineTo(x,y);ctx.stroke()}prev=[x,y]}else prev=null}}}
R3.worldItems=(items,thi)=>{const th=R3.THEMES[thi],d=D,far=th.far,hwR=C.W/2/C.F,RW=SCX.RW;
if(['forest','desert','snow'].includes(th.kind)){const off=RW/2+(SH[th.kind]?SH[th.kind][1]:44)+10;for(let k=0;k<SEQ.length-1;k++){const m1=SEQ[k],m2=SEQ[k+1],f1=R3.wc(d.X[m1],d.Y[m1],0)[0];if(f1>far*.8||f1<-60)continue;
for(const s of[-1,1])items.push({d:f1+4,fn:()=>{const ctx=SCX.ctx,o=s*off,col=R3.col(th.kind==='snow'?[225,230,235]:[128,98,66],1,f1),ln=(P,Q,wd)=>{if(P[0]>C.NEAR+1&&Q[0]>C.NEAR+1){ctx.strokeStyle=col;ctx.lineWidth=Math.min(4,Math.max(.7,wd*C.F/Math.max(P[0],20)));ctx.beginPath();ctx.moveTo(C.W/2+P[1]/P[0]*C.F,C.hy-P[2]/P[0]*C.F);ctx.lineTo(C.W/2+Q[1]/Q[0]*C.F,C.hy-Q[2]/Q[0]*C.F);ctx.stroke()}};
ln(pt(d,m1,o,0),pt(d,m1,o,26),3.2);ln(pt(d,m1,o,24),pt(d,m2,o,24),1.6);ln(pt(d,m1,o,13),pt(d,m2,o,13),1.6)}})}}
{const cn=R3.corner;if(cn){const P=R3.wc(d.X[cn.m],d.Y[cn.m],0),f=P[0];if(f>70&&f<far)items.push({d:f,fn:()=>{const ctx=SCX.ctx,s=C.F/f,x=C.W/2+P[1]*s,y=C.hy+(C.h-85)*s,gy=C.hy+C.h*s,sz=Math.max(11,Math.min(26,260*s));
ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,gy);ctx.stroke();ctx.fillStyle='#ff3b30';ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-sz*.55,y-sz);ctx.lineTo(x+sz*.55,y-sz);ctx.lineTo(x,y);ctx.closePath();ctx.fill();ctx.stroke();
const t=Math.round(cn.dist/10)*10+'m';ctx.font='bold '+Math.round(sz*.62)+'px system-ui';const tw=ctx.measureText(t).width;ctx.fillStyle='rgba(10,20,40,.78)';ctx.fillRect(x-tw/2-6,y-sz-sz*.8-4,tw+12,sz*.8);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText(t,x,y-sz-sz*.2-4);ctx.textAlign='left'}})}}
for(const o of d.obj){const dx=o.x-C.x,dy=o.y-C.y,f=dx*C.cs+dy*C.sn;if(f<10||f>far)continue;const r=-dx*C.sn+dy*C.cs;const sz=(o.w||40)*1.6+(o.t==='bldg'?60:0);if(Math.abs(r)>f*hwR*1.15+sz)continue;
const fn=DRAW[o.t];items.push({d:f,fn:()=>fn(o,f,r,th)})}
for(const m of d.tw){const f=R3.wc(d.X[m],d.Y[m],0)[0];if(f<-600||f>far)continue;items.push({d:f+80,fn:()=>tower(m,d,th)})}
if(th.kind==='bridge'){const hw=RW/2;for(let k=0;k<SEQ.length-1;k++){const m1=SEQ[k],m2=SEQ[k+1],f1=R3.wc(d.X[m1],d.Y[m1],0)[0];if(f1>far||f1<-80)continue;
for(const s of[-1,1])items.push({d:f1+15,fn:()=>{const ctx=SCX.ctx,o0=s*(hw+2),o1=s*(hw+8),o2=s*(hw+16),f=Math.max(30,f1),dk=th.night?.42:1,pf=(P,c)=>{if(R3.path(P)){ctx.fillStyle=R3.col(c,dk,f);ctx.fill();ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=.8;ctx.stroke()}};
pf([pt(d,m1,o0,0),pt(d,m2,o0,0),pt(d,m2,o1,8),pt(d,m1,o1,8)],[128,131,136]);
pf([pt(d,m1,o1,8),pt(d,m2,o1,8),pt(d,m2,o1,21),pt(d,m1,o1,21)],[174,177,182]);
pf([pt(d,m1,o1,21),pt(d,m2,o1,21),pt(d,m2,o2,21),pt(d,m1,o2,21)],[208,211,216]);
if(k%4===0)pf([pt(d,m1,o1,12),pt(d,m2,o1,12),pt(d,m2,o1,16),pt(d,m1,o1,16)],th.night?[255,150,40]:[230,120,30]);}})}}
// finish gantry
{const T=SCX.T,x=T.pts[0][0],y=T.pts[0][1],a=T.ang[0],cs=Math.cos(a),sn=Math.sin(a),nx=-sn,ny=cs,f=R3.wc(x,y,0)[0];if(f>-120&&f<far){items.push({d:f+10,fn:()=>{const ctx=SCX.ctx,hw=RW/2+14,tf=(sx)=>(lx,ly,lz)=>[x+nx*sx*hw+lx*cs-ly*sn,y+ny*sx*hw+lx*sn+ly*cs,lz];
for(const s of[-1,1])R3.prism(tf(s),8,8,0,150,1,1,[60,64,72],1,f);
const P=[[0,-hw,150],[0,hw,150],[0,hw,190],[0,-hw,190]].map(q=>R3.wc(x+cs*q[0]-sn*q[1],y+sn*q[0]+cs*q[1],q[2]));if(R3.path(P)){ctx.fillStyle=R3.col([25,28,36],1,f);ctx.fill()}
for(let i=0;i<20;i++){const l0=-hw+i*2*hw/20,l1=l0+2*hw/20,Q=[[l0,150],[l1,150],[l1,165],[l0,165]].map(q=>R3.wc(x-sn*q[0],y+cs*q[0],q[1]));if(R3.path(Q)){ctx.fillStyle=i%2?'#fff':'#111';ctx.fill()}}
ctx.fillStyle='#ff3b30';const c=R3.wc(x,y,175);if(c[0]>10){const s=C.F/c[0];ctx.font='bold '+Math.max(8,22*s)+'px system-ui';ctx.textAlign='center';ctx.fillText('SPEED CRISIS',C.W/2+c[1]*s,C.hy-c[2]*s);ctx.textAlign='left'}}})}}
// ramps
for(const rp of SCX.T.ramps){const f=R3.wc(rp.x,rp.y,0)[0];if(f<-120||f>far)continue;items.push({d:f,fn:()=>{const ctx=SCX.ctx,co=Math.cos(rp.a),si=Math.sin(rp.a),w=RW/2-10,q=(u,l,z)=>R3.wc(rp.x+co*u-si*l,rp.y+si*u+co*l,z),fm=Math.max(40,f);
for(const s of[-1,1]){if(R3.path([q(-50,s*w,0),q(50,s*w,30),q(50,s*w,0)])){ctx.fillStyle=R3.col([150,120,30],.8,fm);ctx.fill()}}
if(R3.path([q(-50,-w,0),q(50,-w,30),q(50,w,30),q(-50,w,0)])){ctx.fillStyle=R3.col([232,184,48],1,fm);ctx.fill()}
for(let k=0;k<5;k++){const u0=-40+k*20,z0=(u0+50)*.3+.8,z1=(u0+57)*.3+.8,P=[q(u0,-w,z0),q(u0+7,-w,z1),q(u0+7,w,z1),q(u0,w,z0)];if(R3.path(P)){ctx.fillStyle=R3.col([30,30,30],1,fm);ctx.fill()}}}})}
};
})();
