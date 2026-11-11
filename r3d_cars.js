// Speed Crisis 3D renderer - part 3: cars, effects, overlays, main draw
(()=>{'use strict';
const R3=window.R3,C=R3.C,cl=R3.cl,TAU=R3.TAU;
const cc={};const PALETTE=[[170,176,184],[62,67,76],[232,235,240],[170,24,32],[34,78,160],[78,122,106],[208,176,30],[200,98,28],[24,26,30],[110,118,128]];
function rgb(s){if(cc[s])return cc[s];let r=[136,136,136],m;
if(m=/^hsl\((\d+),(\d+)%,(\d+)%\)/.exec(s)){const h=+m[1]/360,sa=+m[2]/100*.72,l=+m[3]/100*.82,q=l<.5?l*(1+sa):l+sa-l*sa,p=2*l-q,f=t=>{t=(t+1)%1;return t<1/6?p+(q-p)*6*t:t<.5?q:t<2/3?p+(q-p)*(2/3-t)*6:p};r=PALETTE[Math.floor(h*10)%10]}
else if(s[0]==='#'){let h=s.slice(1);if(h.length===3)h=h.split('').map(x=>x+x).join('');r=[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]}
return cc[s]=r}
function glow(wx,wy,wz,rad,col,al){const q=R3.wc(wx,wy,wz);if(q[0]<C.NEAR+4)return;const ctx=SCX.ctx,s=C.F/q[0],x=C.W/2+q[1]*s,y=C.hy-q[2]*s,r=Math.max(3,rad*s);ctx.save();ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba('+col+','+al+')');g.addColorStop(.3,'rgba('+col+','+al*.35+')');g.addColorStop(1,'rgba('+col+',0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.restore()}
function ground(P,style,comp){const ctx=SCX.ctx;if(R3.path(P)){if(comp){ctx.save();ctx.globalCompositeOperation=comp}ctx.fillStyle=style;ctx.fill();if(comp)ctx.restore()}}
// ---- car model ----
R3.rgb=rgb;const BT={};
function bodyType(c){const n=c.name||'';if(BT[n])return BT[n];let t='sedan';
if(/Spyder|Roadster|Cabrio|Volante|Targa|Z4|Boxster|Speedster|Stirling|722|Cabriolet/.test(n))t='roadster';
else if(/GT500|Viper|GT3|GT2|Superleggera|SuperVeloce|Cinque|Zonda|Koenigsegg|Veyron|Agera|Sesto|CCX|Gumpert|Carrera GT|F1|MP4|ZR1|Z06|R8|Gallardo|Murcielago|Reventon|Countach|Diablo|GT-R|370Z|Evolution|Impreza|M3|Camaro|Challenger|One-77|Ford GT|Corvette|SLS|Cayman|911|959|8C|DBS|Vantage/.test(n))t='wing';
return BT[n]=t}
R3.bodyType=bodyType;
function drawCar(c,f,th,isP){const ctx=SCX.ctx,G=SCX.G,a=c.a,ca=Math.cos(a),sa=Math.sin(a),dead=c.dead,col=dead?[34,34,36]:rgb(c.color),k=th.night?.62:1,t=C.t;
const side=-(c.vx||0)*sa+(c.vy||0)*ca,roll=c.z>0?0:cl(side/380,-.15,.15),sp=c.spin||0,cs2=Math.cos(sp),sn2=Math.sin(sp),cr=Math.cos(roll),sr=Math.sin(roll);
const tf=(lx,ly,lz)=>{const zz=lz-10;let x=lx*cs2-zz*sn2,z=zz*cs2+lx*sn2;const y=ly*cr-z*sr;z=z*cr+ly*sr;return[c.x+x*ca-y*sa,c.y+x*sa+y*ca,z+10+c.z]};
const off=(dx,dy)=>(lx,ly,lz)=>tf(lx+dx,ly+dy,lz);
const rel=R3.wrap(c.a-C.ch),spr=C.hz!==1&&Math.abs(rel)<.65&&Math.abs(c.spin||0)<.3&&c.z<45&&f>16,PR=spr?()=>{}:R3.prism;
const brake=isP&&SCX.dn('KeyS','ArrowDown')&&c.v>20||c.braking;
// shadow
{const P=[],q=Math.max(0,1-c.z/90);for(let i=0;i<14;i++){const u=i/14*TAU,lx=Math.cos(u)*40,ly=Math.sin(u)*19;P.push(R3.wc(c.x+lx*ca-ly*sa+c.z*.3,c.y+lx*sa+ly*ca+c.z*.3,.35))}ground(P,'rgba(0,0,0,'+(.42*q)+')')}
// headlight pool on the road
if(c.hl&&!dead){const P=[[30,-10],[330,-150],[330,150],[30,10]].map(q=>R3.wc(c.x+q[0]*ca-q[1]*sa,c.y+q[0]*sa+q[1]*ca,.5));ground(P,'rgba(255,248,205,.09)','lighter')}
// wheels
for(const sx of[1,-1])for(const sy of[1,-1])PR(off(sx*21,sy*15.8),7.4,3.6,0,10.5,1,1,[24,24,27],1,f,[1,.9,1,1,1.2]);
// body
PR(tf,33,15,5,14,.96,.93,col,k,f,[.9,.72,.8,.8,1.12]);
// hood stripe + cabin
PR(off(-5,0),15.5,12.5,14,23,.72,.78,dead?[10,10,10]:[34,48,66],1,f,[.95,1.05,.8,.8,1]);
PR(off(-5,0),11.5,9.8,22.6,24.3,1,1,col,k,f,[1,1,1,1,1.18]);
const racer=!dead&&!c.cop&&!c.copcar&&!c.traffic;
if(racer)PR(off(-30.5,0),3.6,14.6,21,22.6,1,1,col,k*.8,f,[1,.8,.9,.9,1.1]);
if(racer){for(const sy of[1,-1])PR(off(-29,sy*9),1.2,1,14,21,1,1,col,k*.7,f)}
if(spr){const rx=c.x-ca*33,ry=c.y-sa*33,q=R3.wc(rx,ry,c.z);if(q[0]>C.NEAR+2){const s=C.F/q[0];R3.rearCar(ctx,C.W/2+q[1]*s,C.hy-q[2]*s,.36*s,{type:(c.cop||c.copcar||c.traffic)?'sedan':bodyType(c),col,f,k,brake,night:th.night,cop:c.cop||c.copcar,dead,boost:c.boosting,roll:-roll*.9,sx:Math.max(.8,Math.cos(rel)),sh:Math.sin(rel)*.18,t})}}
// police livery
if((c.cop||c.copcar)&&!dead){PR(off(0,0),33.4,15.3,5,9.5,.97,.95,[18,18,22],1,f,[.9,.7,.8,.8,1]);const fl=Math.floor(t*8)%2;
PR(off(-5,-4.8),3,4.6,24.3,27.5,1,1,fl?[255,40,40]:[40,90,255],1.4,f,[1,1,1,1,1]);PR(off(-5,4.8),3,4.6,24.3,27.5,1,1,fl?[40,90,255]:[255,40,40],1.4,f,[1,1,1,1,1]);
if(f<1800){glow(tf(-5,-5,28)[0],tf(-5,-5,28)[1],tf(-5,-5,28)[2],46,fl?'255,50,50':'60,110,255',.8);const q=tf(-5,5,28);glow(q[0],q[1],q[2],46,fl?'60,110,255':'255,50,50',.8)}}
// lights
if(!dead){for(const sy of[1,-1]){PR(off(-33.5,sy*10.4),1.1,4.7,8,11.6,1,1,[255,26,26],brake?1.7:1.15,f,[1,1.3,1,1,1]);PR(off(33.4,sy*10.4),1.1,4.7,8,11.2,1,1,[255,250,215],1.4,f,[1.2,1,1,1,1])}
if(f<2200){for(const sy of[1,-1]){const q=tf(-34.5,sy*(spr?13.6:10.4),spr?14:9.6);glow(q[0],q[1],q[2],brake?50:(th.night?34:24),'255,30,30',brake?.8:(th.night?.55:.4))}
if(th.night||c.hl)for(const sy of[1,-1]){const q=tf(34.5,sy*10.4,9.6);glow(q[0],q[1],q[2],30,'255,244,200',.5)}}
// nitro / turbo flames + exhaust
if(c.boosting&&!spr){for(const sy of[1,-1]){const ln=12+Math.random()*9,w=2.4,P=[tf(-34,sy*8-w,8),tf(-34-ln,sy*8,8),tf(-34,sy*8+w,8)].map(q=>R3.wc(q[0],q[1],q[2]));ground(P,'rgba(130,200,255,.9)','lighter');
const P2=[tf(-34,sy*8-w*.5,8),tf(-34-ln*.55,sy*8,8),tf(-34,sy*8+w*.5,8)].map(q=>R3.wc(q[0],q[1],q[2]));ground(P2,'rgba(255,255,255,.95)','lighter');const q=tf(-36,sy*8,8);glow(q[0],q[1],q[2],16,'90,170,255',.45)}}}
// saw blades
if(c.sawT>0&&!dead){for(const sy of[1,-1]){const q=tf(2,sy*22,9),r=R3.wc(q[0],q[1],q[2]);if(r[0]>C.NEAR){const s=C.F/r[0],x=C.W/2+r[1]*s,y=C.hy-r[2]*s;ctx.save();ctx.translate(x,y);ctx.scale(1,.55);ctx.rotate(t*25);ctx.fillStyle='#d8d8de';for(let i=0;i<8;i++){ctx.rotate(TAU/8);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(13*s,-3*s);ctx.lineTo(15*s,2*s);ctx.fill()}ctx.restore()}}}
// EMP disabled field
if(c.dis>0&&!dead){const q=R3.wc(c.x,c.y,14),s=C.F/Math.max(q[0],20);if(q[0]>C.NEAR){ctx.save();ctx.strokeStyle='rgba(110,220,255,'+(.5+.5*Math.sin(t*30))+')';ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(C.W/2+q[1]*s,C.hy-q[2]*s,46*s,26*s,0,0,TAU);ctx.stroke();ctx.restore()}}}
// ---- other things in the world ----
function particle(q,f,th){const ctx=SCX.ctx,pz=3+(1-q.l/q.m)*16,P=R3.wc(q.x,q.y,pz);if(P[0]<C.NEAR+2)return;const s=C.F/P[0],x=C.W/2+P[1]*s,y=C.hy-P[2]*s;let r=Math.max(.8,q.s*s*(1+(1-q.l/q.m)*.9));
let al=cl(q.l/q.m,0,1);if(q.c==='#ffc940'||q.c==='#4af'){const fl=q.c==='#4af';ctx.save();ctx.globalCompositeOperation='lighter';if(fl){r=Math.min(r,7);al*=.45}ctx.globalAlpha=al;ctx.fillStyle=q.c;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();ctx.restore()}else{ctx.globalAlpha=al*.55;ctx.fillStyle=q.c;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();ctx.globalAlpha=1}}
function heli(x,y,z,spot,th){const ctx=SCX.ctx,P=R3.wc(x,y,z),t=C.t;if(spot){const G=SCX.G.p,pp=[];for(let i=0;i<14;i++){const u=i/14*TAU;pp.push(R3.wc(G.x+Math.cos(u)*120,G.y+Math.sin(u)*120,.4))}ground(pp,'rgba(255,255,225,.2)','lighter')}
if(P[0]<C.NEAR+10)return;const s=C.F/P[0],X=C.W/2+P[1]*s,Y=C.hy-P[2]*s;ctx.save();ctx.translate(X,Y);ctx.fillStyle='#202634';ctx.beginPath();ctx.ellipse(0,0,36*s,13*s,0,0,TAU);ctx.fill();ctx.fillRect(-72*s,-3*s,40*s,6*s);ctx.fillStyle='rgba(180,200,230,.5)';ctx.beginPath();ctx.ellipse(16*s,-3*s,13*s,7*s,0,0,TAU);ctx.fill();
ctx.strokeStyle='rgba(230,235,245,.7)';ctx.lineWidth=Math.max(1,3*s);const a=t*40;for(let i=0;i<2;i++){ctx.beginPath();ctx.moveTo(Math.cos(a+i*Math.PI)*84*s,-14*s+Math.sin(a+i*Math.PI)*8*s);ctx.lineTo(-Math.cos(a+i*Math.PI)*84*s,-14*s-Math.sin(a+i*Math.PI)*8*s);ctx.stroke()}
if(spot){ctx.fillStyle=Math.floor(t*6)%2?'#f33':'#36f';ctx.beginPath();ctx.arc(-70*s,0,4*s,0,TAU);ctx.fill()}ctx.restore()}
R3.carItems=(items,th)=>{const G=SCX.G,p=G.p,far=th.far;
for(const c of G.cars){const f=R3.wc(c.x,c.y,0)[0];if(c.type==='traffic'&&false)continue;if(f<14||f>far)continue;if(c===p&&C.hz===2)continue;items.push({d:f,fn:()=>drawCar(c,f,th,c===p)})}
if(C.hz!==2&&p.dead===undefined){}
for(const o of G.obs){const f=R3.wc(o.x,o.y,0)[0];if(f<14||f>far)continue;const fk={x:o.x,y:o.y,a:o.a+1.5708,z:0,spin:0,vx:0,vy:0,v:0,color:'#f4f4f4',cop:true,dead:false};items.push({d:f,fn:()=>drawCar(fk,f,th,false)})}
for(const s of G.spikes){const f=R3.wc(s.x,s.y,0)[0];if(f<10||f>far)continue;items.push({d:f,fn:()=>{const ctx=SCX.ctx,ang=SCX.G.p.a,ca=Math.cos(ang),sa=Math.sin(ang);const fl=Math.floor(C.t*4)%2;R3.prism((lx,ly,lz)=>[s.x+lx*ca-ly*sa,s.y+lx*sa+ly*ca,lz],6,26,0,3,1,1,[205,205,212],1,f,[1,1,1,1,1.1]);
for(let i=-2;i<=2;i++){const q=R3.wc(s.x-sa*i*10,s.y+ca*i*10,3),r=R3.wc(s.x-sa*i*10,s.y+ca*i*10,10);if(q[0]>C.NEAR){const sc=C.F/q[0];ctx.strokeStyle='#ddd';ctx.lineWidth=Math.max(1,2*sc);ctx.beginPath();ctx.moveTo(C.W/2+q[1]*sc,C.hy-q[2]*sc);ctx.lineTo(C.W/2+r[1]*sc,C.hy-r[2]*sc);ctx.stroke()}}
glow(s.x,s.y,6,30,fl?(s.team==='cop'?'60,120,255':'255,60,60'):'255,255,255',.7)}})}
for(const o of G.oils){const f=R3.wc(o.x,o.y,0)[0];if(f<10||f>far)continue;items.push({d:f+300,fn:()=>{const P=[];for(let i=0;i<16;i++){const u=i/16*TAU;P.push(R3.wc(o.x+Math.cos(u)*36,o.y+Math.sin(u)*24,.5))}ground(P,'rgba(8,8,12,.82)')}})}
for(const q of G.parts){const f=R3.wc(q.x,q.y,0)[0];if(f<8||f>1600)continue;items.push({d:f,fn:()=>particle(q,f,th)})}
const pp=G.p;if(G.heli>0)items.push({d:200,fn:()=>heli(pp.x+Math.cos(pp.a)*170,pp.y+Math.sin(pp.a)*170,110+Math.sin(C.t*2)*10,false,th)});
if(G.cheli>0)items.push({d:210,fn:()=>heli(pp.x+Math.cos(pp.a)*40+Math.sin(C.t*1.3)*40,pp.y+Math.sin(pp.a)*40,150,true,th)})};
// ---- screen overlays ----
const hash=(i,f)=>{const x=Math.sin(i*127.1+f*311.7)*43758.5453;return x-Math.floor(x)};
R3.overlay=th=>{const ctx=SCX.ctx,W=C.W,H=C.H,G=SCX.G,p=G.p,k=C.k,bo=G.bo||0,fr=Math.floor(C.t*30),cx=W/2,cy=C.hy+H*.05;
if(!R3.lowq&&(k>.6||bo>.1)){const al=cl((k-.55)*.5+bo*.25,0,.3),s=1.035;ctx.save();ctx.globalAlpha=al;ctx.drawImage(ctx.canvas,W/2-W/2*s,C.hy-C.hy*s,W*s,H*s);ctx.restore()}
if(k>.45||bo>.05){const n=Math.floor(8+Math.max(0,k-.4)*36+bo*34),m=Math.min(W,H);ctx.save();ctx.lineCap='round';for(let i=0;i<n;i++){const a=hash(i,fr)*TAU,r0=m*(.3+hash(i+9,fr)*.42),ln=m*(.07+Math.max(0,k-.4)*.2+bo*.2)*(.5+hash(i+3,fr));ctx.strokeStyle=bo>.2?'rgba(150,200,255,'+(.1+hash(i+5,fr)*.22)+')':'rgba(255,255,255,'+(.06+hash(i+5,fr)*.14)+')';ctx.lineWidth=1+hash(i+7,fr)*2.2;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*r0*1.5,cy+Math.sin(a)*r0);ctx.lineTo(cx+Math.cos(a)*(r0+ln)*1.5,cy+Math.sin(a)*(r0+ln));ctx.stroke()}ctx.restore()}
if(th.rain){ctx.save();ctx.strokeStyle='rgba(190,205,240,.28)';ctx.lineWidth=1;ctx.beginPath();for(let i=0;i<150;i++){const x=hash(i,Math.floor(C.t*8)*.37)*W,y=((hash(i+50,0)*H)+C.t*1400*(.6+hash(i,2)*.6))%H;ctx.moveTo(x,y);ctx.lineTo(x-4,y+22)}ctx.stroke();ctx.restore()}
const v=ctx.createRadialGradient(cx,H*.5,Math.min(W,H)*.45,cx,H*.5,Math.hypot(W,H)*.62);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,'+(.38+k*.14)+')');ctx.fillStyle=v;ctx.fillRect(0,0,W,H);
if(bo>.02){const g=ctx.createRadialGradient(cx,H*.5,Math.min(W,H)*.3,cx,H*.5,Math.hypot(W,H)*.6);g.addColorStop(0,'rgba(40,110,255,0)');g.addColorStop(1,'rgba(40,110,255,'+(.3*bo)+')');ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}
const hp=p.hp/p.mhp;if(hp<.35&&!p.dead){ctx.fillStyle='rgba(255,0,0,'+(.1+.08*Math.sin(C.t*8))*(1-hp/.35)+')';ctx.fillRect(0,0,W,H)}
if(p.dis>0){ctx.fillStyle='rgba(90,200,255,'+(.12+.1*Math.sin(C.t*40))+')';ctx.fillRect(0,0,W,H)}};
// ---- main draw ----
let warned=false;
R3.draw=()=>{const G=SCX.G,ctx=SCX.ctx;try{ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.textAlign='left';
const thi=G.cfg.th!=null?G.cfg.th:Math.min(G.cfg.d||0,R3.THEMES.length-1),th=R3.THEMES[thi];R3.setup();R3.setFog(th.fog,th.far);
if(th.night&&G._hlc!==G.cfg){G._hlc=G.cfg;G.p.hl=true}
R3.drawSky(th,thi);R3.drawRoad(thi);
const items=[];R3.worldItems(items,thi);R3.carItems(items,th);items.sort((a,b)=>b.d-a.d);for(const it of items)it.fn();
ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';R3.overlay(th);
R3.theme=th;R3.themeName=R3.NAMES[thi];(R3.hud||SCX.hud)(th)}
catch(e){ctx.restore&&0;ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';if(!warned){warned=true;console.error('3D renderer error, using 2D view:',e)}R3.ok=false}};
R3.ok=true;
})();
