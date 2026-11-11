(()=>{'use strict';
const $=id=>document.getElementById(id),cv=$('c'),ctx=cv.getContext('2d'),ui=$('ui');
const TAU=Math.PI*2,cl=(v,a,b)=>v<a?a:v>b?b:v,rnd=(a,b)=>a+Math.random()*(b-a);
let W=800,H=600;const rs=()=>{W=cv.width=innerWidth;H=cv.height=innerHeight};addEventListener('resize',rs);rs();
const SER=['Sports','Performance','Super','Exotic','Hyper'],RW=190,LAPS=3;
const CARS=buildCars();
const UPN={eng:['Engine','+4% top speed & acceleration'],nit:['Nitro Tank','longer, faster-recharging nitro'],arm:['Armor Plating','+25 health, less crash damage'],jmp:['Jump Jacks','higher/longer stunt jumps (needed to clear water gaps)'],saw:['Saw Blades','more slash damage, faster recharge']};
let S=null;try{S=JSON.parse(localStorage.getItem('speedcrisis'))}catch(e){}
S=S||{cash:2000,own:['c0'],car:'c0',up:{eng:0,nit:0,arm:0,jmp:0,saw:0}};
if(!CARS.find(c=>c[0]===S.car)){S.car='c0';S.own=['c0']}S.own=S.own.filter(id=>CARS.some(c=>c[0]===id));if(!S.own.length)S.own=['c0'];S.eq=S.eq||{emp:0,spike:0,jam:0,turbo:0,block:0};if(S.paint===undefined&&!S.paintSet)S.paint='#8a949c';
S.cash=99999999;const eqL=k=>S.eq[k]>=50?3:S.eq[k]>=15?2:1;
const save=()=>{S.cash=99999999;try{localStorage.setItem('speedcrisis',JSON.stringify(S))}catch(e){}};
// ---------- track ----------
let pts=[],n,cum=[],seg=[],total=0,ang=[],ramps=[],waters=[],decor=[],bb,SCS=[];
function buildTrack(sd0){pts.length=0;cum.length=0;seg.length=0;ang.length=0;ramps.length=0;waters.length=0;decor.length=0;SCS.length=0;total=0;let sd=sd0;const r=()=>(sd=sd*16807%2147483647)/2147483647;
const p1=r()*TAU,p2=r()*TAU,K=48,C=[],k1=2+Math.floor(r()*3),k2=4+Math.floor(r()*3),a1=700+r()*500,a2=300+r()*350,asp=1.1+r()*.3;
for(let i=0;i<K;i++){const t=i/K*TAU,R=3600+a1*Math.sin(k1*t+p1)+a2*Math.sin(k2*t+p2);C.push([Math.cos(t)*R*asp,Math.sin(t)*R])}
const cr=(a,b,c,d,t)=>.5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);
for(let i=0;i<K;i++){const a=C[(i+K-1)%K],b=C[i],c=C[(i+1)%K],d=C[(i+2)%K];for(let s=0;s<5;s++){const t=s/5;pts.push([cr(a[0],b[0],c[0],d[0],t),cr(a[1],b[1],c[1],d[1],t)])}}
n=pts.length;
for(let i=0;i<n;i++){const j=(i+1)%n,dx=pts[j][0]-pts[i][0],dy=pts[j][1]-pts[i][1];seg[i]=Math.hypot(dx,dy);cum[i]=total;total+=seg[i];ang[i]=Math.atan2(dy,dx)}
[30,90,150,205].forEach(i=>{const a=ang[i];ramps.push({x:pts[i][0],y:pts[i][1],a});waters.push({x:pts[i][0]+Math.cos(a)*210,y:pts[i][1]+Math.sin(a)*210,a,l:160,w:900})});
for(let i=0;i<n;i++)for(let k=0;k<3;k++){const s=r()<.5?-1:1,o=RW/2+90+r()*700,a=ang[i]+1.5708,t=r();decor.push({x:pts[i][0]+Math.cos(a)*o*s+r()*80,y:pts[i][1]+Math.sin(a)*o*s+r()*80,t:t<.65?0:t<.8?1:2,s:18+r()*30,h:r()})}
{const cand=[];for(let i=15;i<n-60;i++){if([30,90,150,205].some(r=>i<r+8&&i+28>r-8))continue;const j=i+28,d=Math.hypot(pts[j][0]-pts[i][0],pts[j][1]-pts[i][1]);cand.push([d/(cum[j]-cum[i]),i])}cand.sort((a,b)=>a[0]-b[0]);for(const c of cand)if(SCS.length<3&&SCS.every(q=>Math.abs(q.a-c[1])>60))SCS.push({a:c[1],b:c[1]+28})}
bb=[Math.min(...pts.map(p=>p[0])),Math.min(...pts.map(p=>p[1])),Math.max(...pts.map(p=>p[0])),Math.max(...pts.map(p=>p[1]))]}
buildTrack(11);
// ---------- audio ----------
let AC,eng,eg,sir,sg;
function audioInit(){if(AC)return;try{AC=new(window.AudioContext||window.webkitAudioContext)();eng=AC.createOscillator();eng.type='sawtooth';eg=AC.createGain();eg.gain.value=0;const f=AC.createBiquadFilter();f.frequency.value=450;eng.connect(f);f.connect(eg);eg.connect(AC.destination);eng.start();sir=AC.createOscillator();sir.type='square';sg=AC.createGain();sg.gain.value=0;sir.connect(sg);sg.connect(AC.destination);sir.start()}catch(e){AC=null}}
function thud(){if(!AC)return;try{const o=AC.createOscillator(),g=AC.createGain();o.frequency.value=80;g.gain.setValueAtTime(.25,AC.currentTime);g.gain.exponentialRampToValueAtTime(.001,AC.currentTime+.25);o.connect(g);g.connect(AC.destination);o.start();o.stop(AC.currentTime+.3)}catch(e){}}
function audioUpdate(){if(!AC||!G)return;const on=G.run&&!G.paused;eg.gain.value=on?.06:0;eng.frequency.value=45+Math.abs(G.p.v)*.32+(G.p.boosting?25:0);const c=on&&(G.mode!=='cop')&&G.cars.some(c=>c.type==='cop'&&!c.dead);sg.gain.value=c?.008:0;sir.frequency.value=650+Math.sin(performance.now()/260)*230}
// ---------- state ----------
let G=null;const K={};
const team=c=>(c.type==='cop'||(c.type==='player'&&G.mode==='cop'))?'cop':'race';
const msg=t=>{G.msg=t;G.msgT=2.2};
const MAXCD={turbo:22,emp:16,jam:20,spike:10,block:25,heli:30,jump:3,saw:9,oil:8};
function puff(x,y,c,s){if(G.parts.length<500)G.parts.push({x,y,vx:rnd(-30,30),vy:rnd(-30,30),l:.7,m:.7,c,s:(s||1)*rnd(4,9)})}
function spark(x,y){for(let i=0;i<3;i++)if(G.parts.length<500)G.parts.push({x,y,vx:rnd(-200,200),vy:rnd(-200,200),l:.35,m:.35,c:'#ffc940',s:3})}
function flame(c){if(G.parts.length<500)G.parts.push({x:c.x-Math.cos(c.a)*24,y:c.y-Math.sin(c.a)*24,vx:-Math.cos(c.a)*120,vy:-Math.sin(c.a)*120,l:.3,m:.3,c:'#4af',s:6})}
function spikes(c){const a=c.a,rows=c.ctl&&eqL('spike')>=3?[80,170]:[80];for(const d of rows){const bx=c.x-Math.cos(a)*d,by=c.y-Math.sin(a)*d;for(const o of[-55,0,55])G.spikes.push({x:bx-Math.sin(a)*o,y:by+Math.cos(a)*o,team:team(c),l:40,pl:!!c.ctl})}}
function blockAt(idx,tm,rr){const i=((idx%n)+n)%n,a=ang[i]+1.5708,g=Math.floor(rnd(0,4));[-82,-45,-8,29,66].forEach((o,k)=>{if(k===g||k===g+1)return;G.obs.push({x:pts[i][0]+Math.cos(a)*o,y:pts[i][1]+Math.sin(a)*o,r:rr||17,a,l:40})})}
function nearest(c){let best=1e18,bi=c.idx,bt=0;
const tst=i=>{i=(i+n)%n;const j=(i+1)%n,ax=pts[i][0],ay=pts[i][1],dx=pts[j][0]-ax,dy=pts[j][1]-ay;let t=cl(((c.x-ax)*dx+(c.y-ay)*dy)/(dx*dx+dy*dy),0,1);const px=ax+dx*t-c.x,py=ay+dy*t-c.y,d=px*px+py*py;if(d<best){best=d;bi=i;bt=t}};
for(let k=-12;k<=12;k++)tst(c.idx+k);
for(const q of SCS)if(c.idx>=q.a-2&&c.idx<=q.b)for(let k=-6;k<=6;k++)tst(q.b+k);
c.dist=Math.sqrt(best);
for(const q of SCS){const ax=pts[q.a][0],ay=pts[q.a][1],dx=pts[q.b][0]-ax,dy=pts[q.b][1]-ay,t=cl(((c.x-ax)*dx+(c.y-ay)*dy)/(dx*dx+dy*dy),0,1),d=Math.hypot(ax+dx*t-c.x,ay+dy*t-c.y);if(d<42)c.dist=Math.min(c.dist,d)}
if(c.idx>n-30&&bi<30)c.lap++;else if(c.idx<30&&bi>n-30)c.lap--;c.idx=bi;c.prog=c.lap*total+cum[bi]+bt*seg[bi]}
function resetRoad(c){const i=c.idx;c.x=pts[i][0];c.y=pts[i][1];c.a=ang[i];c.vx=c.vy=c.v=0;c.stuck=0;c.z=0;c.vz=0}
function mk(type,idx,off,lap,o){const i=((idx%n)+n)%n,a=ang[i]+1.5708;
const c=Object.assign({type,x:pts[i][0]+Math.cos(a)*off,y:pts[i][1]+Math.sin(a)*off,a:ang[i],vx:0,vy:0,v:0,z:0,vz:0,spin:0,spinV:0,air:0,idx:i,lap,hp:100,mhp:100,nit:.5,nitUse:.3,nitReg:.04,dis:0,flat:0,sawT:0,sawCd:rnd(2,8),grip:5.5,bust:0,dist:0,stuck:0,aiNit:0,lane:rnd(-45,45),hl:false,dead:false,fin:0,prog:0,drift:0,turbo:0,boosting:false,busted:false,spT:rnd(6,12)},o);
c.baseTop=c.top;nearest(c);return c}
// ---------- start ----------
function start(cfg){audioInit();cfg=Object.assign({},cfg);lastCfg=cfg;
const ser=cfg.ser,side=cfg.side,mode=side==='cop'?'cop':cfg.cops?'pursuit':'race';
G={mode,ser,cfg,t:0,count:3.5,begin:3.5,run:true,paused:false,cars:[],parts:[],spikes:[],oils:[],obs:[],stunt:0,finN:0,zi:0,cd:{turbo:0,emp:0,jam:0,spike:0,block:0,heli:0,jump:0,saw:0,oil:0},hsp:3,heli:0,cheli:0,chT:20,evT:12,rbT:30,heliSp:3,eT:20,plock:0,lock:null,msg:'',msgT:0,time:cfg.limit||180,busts:0,wr:0,copT:4,pen:0,pt:0,uses:cfg.equip?{emp:10,spike:10,jam:5,turbo:5,block:5,heli:3,oil:8}:{},par:Math.round(cfg.miles*5.2),gc:cfg.gc,tc:cfg.tc};
if(cfg.arms){for(const k in G.uses)G.uses[k]=Math.ceil(G.uses[k]*1.5);G.copT=0}ui.className='h';buildTrack(11+(cfg.d||0)*7+(cfg.d>14?(cfg.d*131)%97:0));const U=S.up,al=c=>c[7]==='B'||c[7]===(side==='cop'?'C':'R');
let cd=CARS.find(c=>c[0]===S.car);
if(cfg.preview){const l=CARS.filter(c=>c[2]===Math.min(4,ser+1)&&al(c));cd=l[Math.floor(Math.random()*l.length)]}
else if(!al(cd))cd=CARS.find(c=>S.own.includes(c[0])&&al(c))||CARS.find(al);
const pl={ctl:true,name:cd[1],color:S.paint||cd[6],grip:cd[11],top:cd[3]*(1+.04*U.eng),acc:cd[4]*(1+.03*U.eng),hp:100+25*U.arm,mhp:100+25*U.arm,nitUse:.3*(1-.1*U.nit),lane:0};
const base=430+ser*45,rb=new RegExp(cfg.brand||'.'),rp0=CARS.filter(c=>(cfg.brand||c[2]===ser)&&rb.test(c[1])&&(c[7]==='B'||c[7]==='R')),rp=rp0.length?rp0:CARS.filter(c=>c[2]===ser&&(c[7]==='B'||c[7]==='R'));
const rival=(idx,off,lap,sp)=>{const k=rp[Math.floor(Math.random()*rp.length)];return mk('racer',idx,off,lap,{name:k[1],color:k[6],grip:k[11],top:sp*rnd(.94,1.02),acc:330+ser*22})};
if(mode==='cop'){G.p=mk('player',2,0,0,pl);G.p.copcar=true;G.cars.push(G.p);
for(let k=0;k<cfg.sus;k++)G.cars.push(rival(16+k*2,(k%2?1:-1)*45,0,(445+ser*40)*(cfg.fast||1)));
for(let k=0;k<(cfg.sus>1?2:cfg.sus?1:0);k++)G.cars.push(mk('cop',0-k*2,(k?1:-1)*50,-1,{name:'Police',color:'#f4f4f4',top:440+ser*40,acc:380+ser*20,cop:true}));
for(let k=0;k<(cfg.traffic||0);k++)G.cars.push(mk('traffic',12+k*24,(k%2?1:-1)*45,0,{name:'Traffic',color:'#889',top:200,acc:200,sawCd:1e9,traffic:true}))}
else{const R=cfg.rivals+1,ps=Math.min(4,R-1);for(let k=0;k<R;k++){const idx=n-1-Math.floor(k/2),off=(k%2?1:-1)*45;if(k===ps){G.p=mk('player',idx,off,-1,pl);G.cars.push(G.p)}else G.cars.push(rival(idx,off,-1,base))}}
G.target=G.p.prog+cfg.miles*2200;G.p.tHp=G.p.hp;G.cx=G.p.x;G.cy=G.p.y;G.cz=.5}
// ---------- abilities ----------
function press(code){if(!G)return;
if(code==='Escape'&&G.run){G.paused=!G.paused;return}
if(G.paused&&code==='KeyQ'){menu();return}
if(!G.run||G.paused||G.count>0)return;
const p=G.p,cd=G.cd,cop=G.mode==='cop',u=G.uses;
if(code==='KeyV')G.zi=(G.zi+1)%3;
if(code==='KeyE')p.hl=!p.hl;
if(code==='KeyR')resetRoad(p);
if(code==='KeyZ'&&!cd.saw){cd.saw=Math.max(3,9-S.up.saw);p.sawT=4;msg('SAW BLADES OUT')}
if((code==='ShiftLeft'||code==='ShiftRight')&&!cd.jump&&p.z===0){cd.jump=3;p.vz=230+S.up.jmp*80;p.z=.1;p.air=0;p.spin=0}
const k={KeyI:cop?'heli':'turbo',KeyJ:'emp',KeyL:cop?'block':'jam',KeyK:'spike',KeyO:cop?'':'oil'}[code];if(!k||cd[k])return;
if(!G.cfg.equip){msg('NO EQUIPMENT IN THIS EVENT');return}
if(!(u[k]>0)){msg('OUT OF '+k.toUpperCase());return}
const use=()=>{u[k]--;if(k==='jam'||k==='turbo'||k==='block')S.eq[k]++};
if(k==='heli'){cd.heli=30;use();G.heli=10;msg('HELICOPTER DEPLOYED - SUSPECTS SLOWED')}
else if(k==='turbo'){cd.turbo=22;use();p.turbo=2+eqL('turbo');p.tHp=p.hp;msg('TURBO!')}
else if(k==='jam'){cd.jam=20;use();p.jam=4+eqL('jam')*2;G.plock=0;G.spikes=G.spikes.filter(s=>!(s.team==='cop'&&Math.hypot(s.x-p.x,s.y-p.y)<700));msg('JAMMER ON - POLICE EQUIPMENT DOWN')}
else if(k==='oil'){cd.oil=8;use();const a=p.a;for(const d of[70,130,190])G.oils.push({x:p.x-Math.cos(a)*d,y:p.y-Math.sin(a)*d,team:'race',l:25});msg('OIL SLICK DROPPED')}
else if(k==='spike'){cd.spike=10;use();spikes(p);msg('SPIKE STRIP DROPPED')}
else if(k==='block'){const s=G.cars.filter(c=>c.type==='racer'&&!c.busted&&!c.dead).sort((a,b)=>b.prog-a.prog)[0];if(s){cd.block=25;use();blockAt(s.idx+7,'cop',17+(eqL('block')-1)*2.5);msg('ROADBLOCK CALLED IN')}}
else if(k==='emp'){let t=null,bd=650;for(const o of G.cars){if(o===p||o.dead||o.type==='traffic'||(cop&&team(o)==='cop'))continue;const dx=o.x-p.x,dy=o.y-p.y,d=Math.hypot(dx,dy);if(d<bd&&dx*Math.cos(p.a)+dy*Math.sin(p.a)>0){bd=d;t=o}}
if(t){G.lock={o:t,t:6-eqL('emp')};cd.emp=16;use();msg('EMP LOCKING...')}else if(G.cheli>0){G.cheli=0;G.chT=40;cd.emp=16;use();msg('HELICOPTER SCARED OFF')}else msg('NO EMP TARGET AHEAD')}}
function lockStep(dt){const p=G.p;
if(G.lock){const L=G.lock,o=L.o,dx=o.x-p.x,dy=o.y-p.y;if(o.dead||Math.hypot(dx,dy)>760||dx*Math.cos(p.a)+dy*Math.sin(p.a)<-60){G.lock=null;msg('EMP LOCK LOST')}else{L.t-=dt;if(L.t<=0){o.dis=3.5;for(let i=0;i<10;i++)spark(o.x,o.y);G.lock=null;S.eq.emp++;msg('EMP HIT!')}}}
if(G.plock>0){if(p.jam>0||(dn('Space')&&Math.abs(p.v)>150)){G.plock=0;msg('EMP LOCK ESCAPED')}else{G.plock-=dt;if(G.plock<=0){p.dis=3;msg('EMP HIT YOU!');for(let i=0;i<10;i++)spark(p.x,p.y)}}}}
addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(!K[e.code])press(e.code);K[e.code]=1});
addEventListener('keyup',e=>{K[e.code]=0});
const dn=(...c)=>c.some(x=>K[x]);
// ---------- physics ----------
function land(c){c.z=0;c.vz=0;if(c.ctl&&c.air>.3){const fl=Math.floor(Math.abs(c.spin)/TAU+.25),cash=Math.round(c.air*350*(1+fl*1.5));G.stunt+=cash;c.nit=Math.min(1,c.nit+.15+fl*.2);msg('STUNT +$'+cash+(fl?' - '+fl+' FLIP'+(fl>1?'S':''):''));thud()}
c.spin=0;c.air=0;for(let i=0;i<4;i++)puff(c.x,c.y,'#cba',1.4)}
function stepCar(c,dt,inp){const air=c.z>0;c.dis=Math.max(0,c.dis-dt);c.flat=Math.max(0,c.flat-dt);c.sawT=Math.max(0,c.sawT-dt);c.turbo=Math.max(0,c.turbo-dt);c.oilT=Math.max(0,(c.oilT||0)-dt);if(c.oilT>0)c.a+=Math.sin(performance.now()/90)*1.2*dt;c.jam=Math.max(0,(c.jam||0)-dt);
const top=c.top*(c.dis>0?.25:c.flat>0?.6:1);c.boosting=false;
if(!air){const fx=Math.cos(c.a),fy=Math.sin(c.a);let f=c.vx*fx+c.vy*fy,l=-c.vx*fy+c.vy*fx,b=1;
if(c.dis<=0&&c.turbo>0){b=1.6;c.boosting=true}else if(c.dis<=0&&inp.nit&&c.nit>0&&f>40){b=1.4;c.nit-=dt*c.nitUse;c.boosting=true}else c.nit=Math.min(1,c.nit+dt*((c.cop||c.copcar)?.07*cl(f/top,0,1):c.ctl?(c.drift>130?.1:.008):.03)*(c.ctl?1+S.up.nit*.2:1));
const tt=top*b;if(inp.th)f+=c.acc*b*cl(1-f/tt,-.5,1)*dt*(c.dis>0?.3:1);
if(inp.br){f-=(f>5?1000:260)*dt;if(f<-170)f=-170}
f-=f*.12*dt;if(c.dist>RW/2+10){const lim=tt*.5;if(f>lim)f-=(f-lim)*2.5*dt}
if(inp.hb)f-=f*.6*dt;l-=l*cl(c.grip*(inp.hb?.15:1)*(c.oilT>0?.12:1)*dt,0,1);
const sf=cl(Math.abs(f)/130,0,1)*(1-.4*cl(Math.abs(f)/top,0,1));c.a+=inp.st*2.5*(f>=0?1:-1)*sf*dt*(inp.hb?1.5:1);
const ux=Math.cos(c.a),uy=Math.sin(c.a);c.vx=ux*f-uy*l;c.vy=uy*f+ux*l;c.v=f;c.drift=Math.abs(l)}
else if(c.ctl)c.spin+=c.spinV*dt;
c.x+=c.vx*dt;c.y+=c.vy*dt;
if(c.z>0||c.vz>0){c.vz-=900*dt;c.z+=c.vz*dt;c.air+=dt;if(c.z<=0)land(c)}}
function aiInp(c,dt){let ax,ay,tg=c.chase;
if(tg&&!tg.dead&&!tg.busted){ax=tg.x+tg.vx*.3;ay=tg.y+tg.vy*.3}
else{const la=(c.idx+3+Math.floor(Math.abs(c.v)/150))%n,a=ang[la]+1.5708;ax=pts[la][0]+Math.cos(a)*c.lane;ay=pts[la][1]+Math.sin(a)*c.lane}
let d=Math.atan2(ay-c.y,ax-c.x)-c.a;d=Math.atan2(Math.sin(d),Math.cos(d));
const i={st:cl(d*2.5,-1,1),th:Math.abs(d)<1.4?1:0,br:Math.abs(d)>1.1&&c.v>240?1:0,hb:Math.abs(d)>1.3&&c.v>200?1:0,nit:0};
if(c.aiNit>0){c.aiNit-=dt;i.nit=1}else if(c.nit>.8&&Math.random()<dt*.25)c.aiNit=2;
if(c.chase&&Math.hypot(ax-c.x,ay-c.y)>450)i.nit=1;
c.sawCd-=dt;if(c.sawCd<=0){for(const o of G.cars)if(o!==c&&!o.dead&&(c.type==='racer'||team(o)!==team(c))&&Math.hypot(o.x-c.x,o.y-c.y)<65){c.sawT=3;c.sawCd=9;break}}
if(G.mode==='cop'&&c.type==='racer'){c.spT-=dt;if(c.spT<=0){c.spT=rnd(12,20);if(Math.hypot(G.p.x-c.x,G.p.y-c.y)<500)spikes(c)}}
if(Math.abs(c.v)<35&&G.count<=0)c.stuck+=dt;else c.stuck=0;if(c.stuck>2.2)resetRoad(c);
return i}
function hurt(c,d){c.hp-=d*(c.ctl?1-.08*S.up.arm:1)}
function wreck(c){if(c.dead)return;c.dead=true;for(let i=0;i<14;i++)spark(c.x,c.y);for(let i=0;i<8;i++)puff(c.x,c.y,'#222',2);thud();if(c.type==='cop'&&G.mode!=='cop'){G.wr++;msg('COP WRECKED!')}}
function env(c,dt){if(c.hp<=0){wreck(c);return}if(c.z>0)return;
for(const r of ramps)if(Math.abs(c.x-r.x)<60&&Math.abs(c.y-r.y)<60&&c.v>170&&Math.cos(c.a-r.a)>.5){c.vz=c.ctl?190+S.up.jmp*70:c.type==='racer'?330:270;c.z=.1;c.air=0;c.spin=0;if(c.ctl)msg('RAMP JUMP!')}
for(const w of waters){const dx=c.x-w.x,dy=c.y-w.y,co=Math.cos(w.a),si=Math.sin(w.a),lx=dx*co+dy*si,ly=-dx*si+dy*co;if(Math.abs(lx)<w.l/2&&Math.abs(ly)<w.w/2){c.hp-=22*dt;c.vx*=1-1.8*dt;c.vy*=1-1.8*dt;if(Math.random()<dt*25)puff(c.x,c.y,'#9cf',1)}}
for(const s of G.spikes)if(!s.dead&&s.team!==team(c)&&c.flat<=0&&Math.hypot(s.x-c.x,s.y-c.y)<30){s.dead=true;if(s.pl)S.eq.spike++;c.flat=4;c.hp-=8;if(c.ctl)msg('TIRES BLOWN!');thud()}
for(const o of G.oils)if(o.team!==team(c)&&!(c.oilT>0)&&Math.hypot(o.x-c.x,o.y-c.y)<34){c.oilT=2.2;if(c.ctl)msg('OIL SLICK!')}}
function sawHit(a,b,nx,ny,d,dt){if(a.sawT>0&&d<52){const rx=-Math.sin(a.a),ry=Math.cos(a.a);if(Math.abs(nx*rx+ny*ry)>.55){hurt(b,(a.ctl?40*(1+.35*S.up.saw):32)*dt);spark((a.x+b.x)/2,(a.y+b.y)/2)}}}
function collide(){const A=G.cars;
for(let i=0;i<A.length;i++){const a=A[i];if(a.dead)continue;
for(let j=i+1;j<A.length;j++){const b=A[j];if(b.dead||a.z>8||b.z>8)continue;const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1;if(d>70)continue;const nx=dx/d,ny=dy/d;
sawHit(a,b,nx,ny,d,G.dt);sawHit(b,a,-nx,-ny,d,G.dt);
if(d<34){const ov=34-d;if(G.cfg.rr&&G.pt<=0&&((a.ctl&&b.traffic)||(b.ctl&&a.traffic))){G.pen+=3;G.pt=1;msg('VEHICLE HIT +3s')}a.x-=nx*ov/2;a.y-=ny*ov/2;b.x+=nx*ov/2;b.y+=ny*ov/2;const rv=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(rv<0){const q=-1.5*rv/2;a.vx-=nx*q;a.vy-=ny*q;b.vx+=nx*q;b.vy+=ny*q;hurt(a,-rv*.035);hurt(b,-rv*.035);if(-rv>120)thud();spark((a.x+b.x)/2,(a.y+b.y)/2)}}}
for(const o of G.obs){const dx=a.x-o.x,dy=a.y-o.y,d=Math.hypot(dx,dy);if(a.z<8&&d<o.r+17&&d>0){const nx=dx/d,ny=dy/d;a.x+=nx*(o.r+17-d);a.y+=ny*(o.r+17-d);const vn=a.vx*nx+a.vy*ny;if(vn<0){a.vx-=1.5*vn*nx;a.vy-=1.5*vn*ny;hurt(a,-vn*.045);if(-vn>100)thud();spark(a.x,a.y)}}}}}
function cam(){}
function ranking(){return G.cars.filter(c=>c.type==='player'||c.type==='racer').sort((a,b)=>(b.fin?1e9-b.fin:b.prog)-(a.fin?1e9-a.fin:a.prog))}
// ---------- update ----------
function update(dt){G.dt=dt;G.t+=dt;const live=G.count<=0;if(G.count>0)G.count-=dt;
for(const k in G.cd)G.cd[k]=Math.max(0,G.cd[k]-dt);G.msgT-=dt;G.pt-=dt;G.heli=Math.max(0,G.heli-dt);G.cheli=Math.max(0,G.cheli-dt);
const p=G.p,cop=G.mode==='cop';
for(const c of G.cars){
if(c.dead){c.vx*=1-2*dt;c.vy*=1-2*dt;c.x+=c.vx*dt;c.y+=c.vy*dt;if(Math.random()<dt*8)puff(c.x,c.y,'#333',1.5);continue}
let inp;
if(!live||c.busted)inp={th:0,br:1,st:0,hb:0,nit:0};
else if(c.ctl){inp={th:dn('KeyW','ArrowUp'),br:dn('KeyS','ArrowDown'),st:(dn('KeyD','ArrowRight')?1:0)-(dn('KeyA','ArrowLeft')?1:0),hb:dn('Space'),nit:dn('Enter')};c.spinV=inp.st*8}
else{inp=aiInp(c,dt);
if(c.type==='racer'){let m=1;if(cop){if(G.heli>0)m=.88}else m=1+cl((p.prog-c.prog)/9000,-.05,.07);c.top=c.baseTop*m}
if(c.type==='cop'){if(cop){if(!c.rt||(c.rt-=dt)<=0){c.rt=1.5;const s=G.cars.filter(o=>o.type==='racer'&&!o.busted&&!o.dead).sort((a,b)=>Math.hypot(a.x-c.x,a.y-c.y)-Math.hypot(b.x-c.x,b.y-c.y))[0];c.chase=s}}
else c.top=c.baseTop*(p.jam>0?.75:G.cheli>0?1.08:1)}}
const tb=c.turbo,od=c.dist;stepCar(c,dt,inp);nearest(c);env(c,dt);
if(c.ctl){if(tb>0&&c.turbo<=0&&c.hp>=c.tHp){G.stunt+=500;msg('PERFECT TURBO +$500')}if(G.cfg.rr&&od<=RW/2+40&&c.dist>RW/2+40){G.pen+=2;msg('WALL HIT +2s')}}
if(c.drift>130&&c.z===0&&Math.random()<dt*30)puff(c.x,c.y,'#ccc',.6);if(c.boosting)flame(c)}
collide();lockStep(dt);
G.parts=G.parts.filter(q=>{q.l-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;return q.l>0});
G.spikes=G.spikes.filter(s=>!s.dead&&(s.l-=dt)>0);G.obs=G.obs.filter(o=>(o.l-=dt)>0);G.oils=G.oils.filter(o=>(o.l-=dt)>0);
if(live){
if(!cop){
const cops=G.cars.filter(c=>c.type==='cop'&&!c.dead);
if(G.mode==='pursuit'&&G.t>G.begin+(G.cfg.arms?1:8)){G.copT-=dt;if(cops.length<Math.min(5,2+G.ser)&&G.copT<=0){G.copT=6;let i=p.idx-5,lap=p.lap;if(i<0){i+=n;lap--}const c=mk('cop',i,rnd(-50,50),lap,{name:'Police',color:'#f4f4f4',top:(440+G.ser*45)*.97,acc:380+G.ser*20,cop:true,chase:p});const f=Math.cos(c.a),g=Math.sin(c.a);c.vx=f*320;c.vy=g*320;c.v=320;G.cars.push(c)}
if(cops.length&&p.jam<=0){G.evT-=dt;G.rbT-=dt;G.chT-=dt;G.eT-=dt;if(G.eT<=0&&!G.plock){G.eT=rnd(22,32);if(cops.some(c=>Math.hypot(c.x-p.x,c.y-p.y)<450)){G.plock=4;msg('EMP LOCK ON YOU! JAM / HANDBRAKE')}}
if(G.evT<=0){G.evT=rnd(12,18);const i=(p.idx+7)%n,a=ang[i]+1.5708;for(const o of[-55,0,55])G.spikes.push({x:pts[i][0]+Math.cos(a)*o,y:pts[i][1]+Math.sin(a)*o,team:'cop',l:40});msg('SPIKE STRIP AHEAD!')}
if(G.rbT<=0){G.rbT=30;blockAt(p.idx+11);msg('ROADBLOCK AHEAD!')}
if(G.chT<=0){G.chT=45;G.cheli=12;G.heliSp=2;msg('POLICE HELICOPTER')}
if(G.cheli>0){G.heliSp-=dt;if(G.heliSp<=0){G.heliSp=3.5;const i=(p.idx+6)%n,a=ang[i]+1.5708;for(const o of[-55,0,55])G.spikes.push({x:pts[i][0]+Math.cos(a)*o,y:pts[i][1]+Math.sin(a)*o,team:'cop',l:30})}}}
let near=0;for(const c of cops)if(Math.hypot(c.x-p.x,c.y-p.y)<85&&p.z<5)near++;
p.stopT=Math.abs(p.v)<12?(p.stopT||0)+dt:0;p.bust=cl(p.bust+(near?near*.32:-.1)*dt+(p.stopT>2?.4*dt:0),0,1);if(p.bust>=1)end('busted')}
for(const c of G.cars)if((c.type==='player'||c.type==='racer')&&c.prog>=G.target&&!c.fin){c.fin=++G.finN;if(c===p)end('win')}
}else{
G.time-=dt;if(G.cfg.fast&&G.heli>0)G.time+=dt;if(G.heli>0){G.hsp-=dt;if(G.hsp<=0){G.hsp=3.5;const l=G.cars.filter(c=>c.type==='racer'&&!c.busted&&!c.dead).sort((a,b)=>b.prog-a.prog)[0];if(l){const i=(l.idx+6)%n,a=ang[i]+1.5708;for(const o of[-55,0,55])G.spikes.push({x:pts[i][0]+Math.cos(a)*o,y:pts[i][1]+Math.sin(a)*o,team:'cop',l:30})}}}
if(G.cfg.arms){G.eT-=dt;if(G.eT<=0&&!G.plock){G.eT=rnd(18,26);if(G.cars.some(q=>q.type==='racer'&&!q.dead&&Math.hypot(q.x-p.x,q.y-p.y)<450)){G.plock=4;msg('EMP LOCK ON YOU! HANDBRAKE')}}}
let rem=0;if(!G.cfg.sus){if(p.prog>=G.target){G.finN=1;end('win')}}else{
for(const s of G.cars){if(s.type!=='racer'||s.busted)continue;if(s.dead){s.busted=true;G.busts++;continue}rem++;let near=0;for(const c of G.cars)if(c!==s&&!c.dead&&(c.type==='cop'||c===p)&&Math.hypot(c.x-s.x,c.y-s.y)<90)near++;s.bust=cl(s.bust+(near?near*.3:-.15)*dt,0,1);if(s.bust>=1){s.busted=true;G.busts++;msg('SUSPECT BUSTED!');rem--}}
if(rem<=0)end('win');else if(G.time<=0)end('time')}}
if(p.dead)end('wrecked')}
// camera
const zb=[.75,.55,.4][G.zi]*(1-.2*cl(Math.abs(p.v)/p.top,0,1.3));G.cz+=(zb-G.cz)*Math.min(1,dt*2);
G.cx+=(p.x+p.vx*.4-G.cx)*Math.min(1,dt*5);G.cy+=(p.y+p.vy*.4-G.cy)*Math.min(1,dt*5)}
// ---------- end ----------
function end(res){if(!G.run)return;G.run=false;const m=1+G.ser*.6,cf=G.cfg,tm=G.t-G.begin+G.pen;let rew=0,txt='';
if(G.mode==='cop'){if(!cf.sus){if(res==='win'){rew=Math.round(2500*m*cl(G.par/tm,.3,1.6));txt='RAPID RESPONSE '+tm.toFixed(1)+'s (PAR '+G.par+'s)'}else txt='YOUR CAR WAS WRECKED'}
else{rew=Math.round(G.busts*1200*m+(res==='win'?3000*m:0));txt=res==='win'?'ALL SUSPECTS BUSTED!':res==='time'?'TIME UP':'YOUR CAR WAS WRECKED'}}
else if(res==='win'){if(cf.clock){rew=Math.round(3000*m*cl(G.par/tm,.3,1.6)*(cf.cops?1.5:1)+G.wr*300);txt='TIME '+tm.toFixed(1)+'s (PAR '+G.par+'s)'}else{rew=Math.round([4000,2500,1500,900,500,300][G.finN-1]*m*(cf.cops?1.5:1)+G.wr*300);txt='FINISHED - POSITION '+G.finN+'/'+(cf.rivals+1)}}
else txt=res==='busted'?'BUSTED!':'WRECKED!';
rew+=G.stunt;S.cash+=rew;S.bounty=(S.bounty||0)+Math.round(rew/10);S.rec=S.rec||{};const rk=cf.title+'|'+cf.side;S.rec[rk]=Math.max(S.rec[rk]||0,rew);save();const al=autolog(rk,S.rec[rk],m);
setTimeout(()=>{if(!G||G.run)return;ui.className='';ui.innerHTML=`<div class=card style="text-align:center"><h1>${txt}</h1><p class=sub>${cf.title||''} - Reward: $${rew}${G.stunt?' (stunts $'+G.stunt+')':''} - Cash: $${S.cash}</p>${al}<p><button class=go onclick="SC.again()">RETRY</button><button onclick="SC.garage()">GARAGE</button><button onclick="SC.menu()">MENU</button></div>`},1100)}
// ---------- draw ----------
function drawCar(c){const t=performance.now()/1000;ctx.save();ctx.translate(c.x+4+c.z*.4,c.y+5+c.z*.6);ctx.rotate(c.a);ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(-22,-11,44,22);ctx.restore();
ctx.save();ctx.translate(c.x,c.y-c.z*.25);ctx.rotate(c.a+c.spin);const sc=1+c.z/260;ctx.scale(sc,sc);
if(c.hl&&!c.dead){ctx.fillStyle='rgba(255,255,170,.15)';ctx.beginPath();ctx.moveTo(18,-6);ctx.lineTo(150,-45);ctx.lineTo(150,45);ctx.lineTo(18,6);ctx.fill()}
ctx.fillStyle=c.dead?'#222':c.color;ctx.fillRect(-21,-10,42,20);
if(c.cop||c.copcar){ctx.fillStyle='#111';ctx.fillRect(-21,-10,42,5);ctx.fillRect(-21,5,42,5);ctx.fillRect(-21,-3,8,6)}
ctx.fillStyle=c.dead?'#111':'#1b2a3a';ctx.fillRect(2,-8,10,16);ctx.fillRect(-14,-8,8,16);
ctx.fillStyle='#fff3a0';ctx.fillRect(19,-9,3,4);ctx.fillRect(19,5,3,4);ctx.fillStyle='#c00';ctx.fillRect(-22,-9,2,4);ctx.fillRect(-22,5,2,4);
if((c.cop||c.copcar)&&!c.dead){const f=Math.floor(t*8)%2;ctx.fillStyle=f?'#f22':'#26f';ctx.fillRect(-3,-8,5,8);ctx.fillStyle=f?'#26f':'#f22';ctx.fillRect(-3,0,5,8)}
if(c.sawT>0){ctx.fillStyle='#bbb';for(const s of[-1,1]){ctx.save();ctx.translate(2,s*17);ctx.rotate(t*25);ctx.fillRect(-9,-2,18,4);ctx.fillRect(-2,-9,4,18);ctx.restore()}}
if(c.dis>0){ctx.strokeStyle='#6df';ctx.lineWidth=2;ctx.strokeRect(-24,-13,48,26)}
ctx.restore()}
function drawHeli(x,y,spot){const t=performance.now()/1000;if(spot){ctx.fillStyle='rgba(255,255,220,.13)';ctx.beginPath();ctx.arc(x,y,100,0,TAU);ctx.fill()}
ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(x+40,y+60,30,12,0,0,TAU);ctx.fill();
ctx.save();ctx.translate(x+Math.sin(t*2)*25,y-90);ctx.fillStyle='#223';ctx.beginPath();ctx.ellipse(0,0,34,13,0,0,TAU);ctx.fill();ctx.fillRect(-60,-3,30,6);ctx.strokeStyle='#ddd';ctx.lineWidth=4;ctx.rotate(t*30);ctx.beginPath();ctx.moveTo(-70,0);ctx.lineTo(70,0);ctx.stroke();ctx.restore()}
function draw(){if(window.R3&&R3.ok){R3.draw();return}const z=G.cz;ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle=G.gc||'#3d7a37';ctx.fillRect(0,0,W,H);
ctx.setTransform(z,0,0,z,W/2-G.cx*z,H/2-G.cy*z);const vr=Math.hypot(W,H)/2/z+260,near=(x,y,r)=>Math.abs(x-G.cx)<vr+r&&Math.abs(y-G.cy)<vr+r;
ctx.lineJoin='round';ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.closePath();
ctx.setLineDash([]);ctx.lineWidth=RW+70;ctx.strokeStyle='#9b8b5f';ctx.stroke();ctx.lineWidth=RW+14;ctx.strokeStyle='#ddd';ctx.stroke();ctx.lineWidth=RW;ctx.strokeStyle='#3a3d44';ctx.stroke();
ctx.lineWidth=4;ctx.strokeStyle='#e8c34a';ctx.setLineDash([40,50]);ctx.stroke();ctx.setLineDash([]);
ctx.lineWidth=80;ctx.strokeStyle='#7a5a30';for(const q of SCS){ctx.beginPath();ctx.moveTo(pts[q.a][0],pts[q.a][1]);ctx.lineTo(pts[q.b][0],pts[q.b][1]);ctx.stroke()}
const t=performance.now()/1000;
for(const w of waters)if(near(w.x,w.y,500)){ctx.save();ctx.translate(w.x,w.y);ctx.rotate(w.a);ctx.fillStyle='#2b6cb0';ctx.fillRect(-w.l/2,-w.w/2,w.l,w.w);ctx.strokeStyle='#7fb8ee';ctx.lineWidth=3;for(let k=-4;k<=4;k++){const yy=k*90+Math.sin(t*2+k)*10;ctx.beginPath();ctx.moveTo(-w.l/2,yy);ctx.lineTo(w.l/2,yy);ctx.stroke()}ctx.fillStyle='#f5f5f5';ctx.fillRect(-w.l/2-6,-w.w/2,6,w.w);ctx.fillRect(w.l/2,-w.w/2,6,w.w);ctx.restore()}
for(const r of ramps)if(near(r.x,r.y,200)){ctx.save();ctx.translate(r.x,r.y);ctx.rotate(r.a);ctx.fillStyle='#c9a227';ctx.fillRect(-50,-RW/2+10,100,RW-20);ctx.strokeStyle='#222';ctx.lineWidth=6;for(let k=-1;k<=1;k++){ctx.beginPath();ctx.moveTo(-30+k*0,-40+k*0);ctx.moveTo(-30,k*50-20);ctx.lineTo(10,k*50);ctx.lineTo(-30,k*50+20);ctx.stroke()}ctx.restore()}
ctx.save();ctx.translate(pts[0][0],pts[0][1]);ctx.rotate(ang[0]);for(let k=0;k<10;k++){ctx.fillStyle=k%2?'#fff':'#111';ctx.fillRect(-8,-RW/2+k*RW/10,8,RW/10);ctx.fillStyle=k%2?'#111':'#fff';ctx.fillRect(0,-RW/2+k*RW/10,8,RW/10)}ctx.restore();
for(const s of G.spikes){ctx.fillStyle='#ddd';ctx.beginPath();ctx.arc(s.x,s.y,12,0,TAU);ctx.fill();ctx.strokeStyle=(Math.floor(performance.now()/250)%2)?(s.team==='cop'?'#39f':'#e33'):'#fff';ctx.lineWidth=3;ctx.stroke()}
for(const o of G.oils){ctx.fillStyle='rgba(10,10,10,.75)';ctx.beginPath();ctx.ellipse(o.x,o.y,34,22,0,0,TAU);ctx.fill()}
for(const o of G.obs){ctx.save();ctx.translate(o.x+3,o.y+4);ctx.rotate(o.a);ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(-20,-10,40,20);ctx.restore();ctx.save();ctx.translate(o.x,o.y);ctx.rotate(o.a);ctx.fillStyle='#f4f4f4';ctx.fillRect(-20,-10,40,20);ctx.fillStyle='#111';ctx.fillRect(-20,-10,40,5);ctx.fillStyle=Math.floor(t*6)%2?'#f22':'#26f';ctx.fillRect(-3,-6,6,12);ctx.restore()}
for(const c of G.cars)if(near(c.x,c.y,60))drawCar(c);
for(const d of decor){if(!near(d.x,d.y,80))continue;if(d.t===0){ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.arc(d.x+d.s*.5,d.y+d.s*.6,d.s,0,TAU);ctx.fill();ctx.fillStyle=G.tc||'#2b6a2a';ctx.beginPath();ctx.arc(d.x,d.y-d.s*.3,d.s,0,TAU);ctx.fill();ctx.fillStyle='rgba(255,255,255,.18)';ctx.beginPath();ctx.arc(d.x-d.s*.2,d.y-d.s*.5,d.s*.6,0,TAU);ctx.fill()}
else if(d.t===1){ctx.fillStyle='#777';ctx.beginPath();ctx.ellipse(d.x,d.y,d.s*.7,d.s*.5,0,0,TAU);ctx.fill()}
else{const s=d.s*2.2;ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(d.x+14,d.y+18,s,s);ctx.fillStyle='hsl('+(d.h*360|0)+',10%,35%)';ctx.fillRect(d.x,d.y,s,s);ctx.fillStyle='hsl('+(d.h*360|0)+',12%,58%)';ctx.fillRect(d.x-8,d.y-12,s,s)}}
for(const q of G.parts){ctx.globalAlpha=cl(q.l/q.m,0,1);ctx.fillStyle=q.c;ctx.beginPath();ctx.arc(q.x,q.y,q.s,0,TAU);ctx.fill()}ctx.globalAlpha=1;
if(G.heli>0)drawHeli(G.p.x,G.p.y,false);
if(G.cheli>0)drawHeli(G.p.x,G.p.y,true);
hud()}
function bar(x,y,w,h,f,c,l){ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(x,y,w,h);ctx.fillStyle=c;ctx.fillRect(x,y,w*cl(f,0,1),h);ctx.fillStyle='#fff';ctx.font='11px system-ui';ctx.fillText(l,x+4,y+h-3)}
function hud(){ctx.setTransform(1,0,0,1,0,0);const p=G.p,cop=G.mode==='cop';ctx.textAlign='left';ctx.fillStyle='#fff';ctx.font='bold 22px system-ui';
if(!cop){const r=ranking(),mi=(Math.max(0,G.target-p.prog)/2200).toFixed(1),el=Math.max(0,G.t-G.begin);ctx.fillText((G.cfg.clock?'TIME '+el.toFixed(1)+'  PAR '+G.par+'s':'POS '+(r.indexOf(p)+1)+'/'+r.length)+'   '+mi+' mi left',16,34)}
else if(!G.cfg.sus){const el=Math.max(0,G.t-G.begin)+G.pen;ctx.fillText('TIME '+el.toFixed(1)+'  (+'+G.pen+'s)  PAR '+G.par+'s   '+(Math.max(0,G.target-p.prog)/2200).toFixed(1)+' mi left',16,34)}
else{const m=Math.max(0,G.time);ctx.fillText('BUSTED '+G.busts+'/'+G.cfg.sus+'   TIME '+Math.floor(m/60)+':'+String(Math.floor(m%60)).padStart(2,'0'),16,34)}
ctx.font='13px system-ui';ctx.fillStyle='#bcd';ctx.fillText(p.name+'  |  Cash $'+S.cash+'  |  Stunts $'+G.stunt+'  |  '+ALLR[Math.floor(p.idx/n*ALLR.length)%ALLR.length],16,54);
const sp=Math.round(Math.abs(p.v)*.45);ctx.textAlign='center';ctx.font='bold 44px system-ui';ctx.fillStyle=p.boosting?'#6cf':'#fff';ctx.fillText(sp,W/2,H-44);ctx.font='12px system-ui';ctx.fillStyle='#bcd';ctx.fillText('KM/H',W/2,H-28);ctx.textAlign='left';
bar(W/2-190,H-34,150,14,p.hp/p.mhp,'#e33','HEALTH');bar(W/2+40,H-34,150,14,p.nit,'#39f','NITRO');
let bm=p.bust;if(cop)bm=Math.max(0,...G.cars.filter(s=>s.type==='racer'&&!s.busted).map(s=>s.bust));if(bm>0)bar(W/2-120,70,240,16,bm,cop?'#2c6':'#e33',cop?'ARRESTING':'BUSTED');
if(p.jam>0)bar(W/2-120,92,240,10,p.jam/10,'#fa0','JAMMER');if(G.lock)bar(W/2-120,106,240,10,1-G.lock.t/5,'#39f','EMP LOCKING');if(G.plock>0)bar(W/2-120,120,240,10,G.plock/4,'#f33','EMP LOCK ON YOU');
const ws=cop?[['I','HELI','heli'],['J','EMP','emp'],['L','BLOCK','block'],['K','SPIKE','spike'],['Z','SAW','saw'],['Shift','JUMP','jump']]:[['I','TURBO','turbo'],['J','EMP','emp'],['L','JAM','jam'],['O','OIL','oil'],['K','SPIKE','spike'],['Z','SAW','saw'],['Shift','JUMP','jump']];
ws.forEach((w,i)=>{const x=14+i*66,y=H-52,f=1-G.cd[w[2]]/MAXCD[w[2]];ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(x,y,60,40);ctx.fillStyle=f>=1?'#19a35a':'#556';ctx.fillRect(x,y+36,60*f,4);ctx.fillStyle='#fff';ctx.font='bold 13px system-ui';ctx.fillText('['+w[0]+']',x+4,y+16);ctx.font='11px system-ui';ctx.fillText(w[1]+(G.uses[w[2]]!==undefined?' x'+G.uses[w[2]]:''),x+4,y+31)});
// minimap
const ms=150/Math.max(bb[2]-bb[0],bb[3]-bb[1]),mx=W-176,my=16,tx=x=>mx+(x-bb[0])*ms,ty=y=>my+(y-bb[1])*ms;ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(mx-12,my-12,174,174);ctx.strokeStyle='#9ab';ctx.lineWidth=3;ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(tx(q[0]),ty(q[1])):ctx.moveTo(tx(q[0]),ty(q[1])));ctx.closePath();ctx.stroke();ctx.strokeStyle=cop?'#39f':'#a8743a';ctx.lineWidth=3;for(const q of SCS){ctx.beginPath();ctx.moveTo(tx(pts[q.a][0]),ty(pts[q.a][1]));ctx.lineTo(tx(pts[q.b][0]),ty(pts[q.b][1]));ctx.stroke()}
for(const c of G.cars){if(c.dead||c.type==='traffic')continue;ctx.fillStyle=c===p?'#fff':c.type==='cop'?(Math.floor(performance.now()/200)%2?'#f33':'#36f'):'#fc3';ctx.beginPath();ctx.arc(tx(c.x),ty(c.y),c===p?5:3.5,0,TAU);ctx.fill()}
if(G.msgT>0){ctx.textAlign='center';ctx.font='bold 26px system-ui';ctx.fillStyle='#ffd23f';ctx.fillText(G.msg,W/2,130)}
if(G.count>0){ctx.textAlign='center';ctx.font='bold 120px system-ui';ctx.fillStyle='#ff3b30';ctx.fillText(G.count>.5?Math.ceil(G.count-.5):'GO!',W/2,H/2)}
if(G.paused){ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(0,0,W,H);ctx.textAlign='center';ctx.fillStyle='#fff';ctx.font='bold 48px system-ui';ctx.fillText('PAUSED',W/2,H/2-10);ctx.font='18px system-ui';ctx.fillText('Esc: resume   Q: quit to menu',W/2,H/2+30)}
ctx.textAlign='left'}
// ---------- menus ----------
let sel={side:'racer',d:0,e:0,ser:0},lastCfg=null;
function evcfg(side,c,mi){if(side==='cop')return{HP:{sus:4,equip:1,limit:90+mi*8},I:{sus:1,fast:1.08,equip:1,limit:100},RR:{sus:0,clock:1,rr:1,traffic:8},P:{sus:0,clock:1,preview:1}}[c];
return{R:{rivals:5},D:{rivals:1},T:{rivals:0,clock:1},P:{rivals:0,clock:1,preview:1},H:{rivals:5,cops:1,equip:1},G:{rivals:0,clock:1,cops:1,equip:1}}[c]}
function go(){const D=DIST[sel.d],ev=D[sel.side==='cop'?'c':'r'][sel.e],c=Object.assign({side:sel.side,ser:sel.ser,miles:ev[2],gc:D.g,tc:D.t,d:sel.d,th:D.th,brand:D.b,title:D.n+' - '+ev[0]},evcfg(sel.side,ev[1],ev[2]));
if(sel.arms){c.arms=1;c.equip=1;if(sel.side==='racer')c.cops=1;else if(!c.sus){c.sus=2;c.limit=150;c.rr=0;c.traffic=0;c.clock=0}}start(c)}
function autolog(k,best,m){const N=['Nova','Dash','Viper','Ghost','Rook'],row=N.map(f=>{let h=0;for(const ch of f+k)h=(h*31+ch.charCodeAt(0))>>>0;return[f,Math.round((1000+h%5000)*m)]});row.push(['YOU',best]);row.sort((a,b)=>b[1]-a[1]);const nx=row[Math.max(0,row.findIndex(r=>r[0]==='YOU')-1)];
return`<h3>AUTOLOG - FRIENDS' RECORDS</h3><table>${row.map((r,i)=>`<tr><td>${i+1}</td><td ${r[0]==='YOU'?'class=own':''}>${r[0]}</td><td>$${r[1]}</td></tr>`).join('')}</table><p class=sub>${nx[0]==='YOU'?'You hold the top record!':'Autolog recommends: beat '+nx[0]+"'s $"+nx[1]}</p>`}
const b=(on,js,l)=>`<button class="${on?'on':''}" onclick="${js}">${l}</button>`;
function menu(){G=null;ui.className='';const D=DIST[sel.d],evs=D[sel.side==='cop'?'c':'r'];sel.e=Math.min(sel.e,evs.length-1);
if(window.MENU2){ui.innerHTML=MENU2.menu({sel,S,DIST,SER,UNIT,EVN,CARS,INFO,evs,D});return}
ui.innerHTML=`<div class=card><h1>SPEED CRISIS</h1><p class=sub>Seacrest County - Cash <b>$${S.cash}</b> - Level ${1+Math.floor(Math.sqrt((S.bounty||0)/100))} (bounty ${S.bounty||0}) - Car: ${CARS.find(c=>c[0]===S.car)[1]}</p>
<h3>SIDE</h3>${b(sel.side==='racer',"SC.pick('side','racer')",'RACER')}${b(sel.side==='cop',"SC.pick('side','cop')",'COP')}
<h3>DISTRICT (12 + 3 DLC packs) - each has its own road layout</h3>${DIST.map((x,i)=>b(i===sel.d,`SC.pick('d',${i})`,x.n)).join('')}
<h3>EVENT</h3>${evs.map((e,i)=>b(i===sel.e,`SC.pick('e',${i})`,`${e[0]} <small>- ${EVN[sel.side][e[1]]}, ${e[2]} mi${S.rec&&S.rec[D.n+' - '+e[0]+'|'+sel.side]?' - best $'+S.rec[D.n+' - '+e[0]+'|'+sel.side]:''}</small>`)).join('')}
<h3>SERIES (rival strength, payout${sel.side==='cop'?'':''}) - cop unit: ${UNIT[sel.ser]}</h3>${SER.map((s,i)=>b(i===sel.ser,`SC.pick('ser',${i})`,s)).join('')}
<p>${b(sel.arms,`SC.pick('arms',${!sel.arms})`,'ARMS RACE MODE: more equipment, instant cops, enemies use EMP')}</p>
<p><button class=go onclick="SC.go()">START EVENT</button><button onclick="SC.garage()">GARAGE & UPGRADES</button></p>
<details><summary>Seacrest County map info</summary><p class=sub><b>Interstates:</b> ${INFO.inter}<br><b>Named roads:</b> ${INFO.roads}</p></details>
<h3>CONTROLS</h3><table><tr><td>W / S</td><td>Accelerate / Brake</td><td>A / D</td><td>Steer (mid-air: flips)</td></tr>
<tr><td>Enter</td><td>Nitro</td><td>Space</td><td>Handbrake</td></tr><tr><td>E</td><td>Headlights</td><td>V</td><td>Camera: chase / high / bumper</td></tr>
<tr><td>I</td><td>Turbo (racer) / Helicopter (cop)</td><td>J</td><td>EMP (locks on, 3-5s)</td></tr>
<tr><td>L</td><td>Jammer (racer) / Roadblock (cop)</td><td>K</td><td>Spike strip</td></tr>
<tr><td>Z</td><td>Saw blades</td><td>Shift</td><td>Jump jacks</td></tr><tr><td>R</td><td>Reset to road</td><td>Esc</td><td>Pause</td></tr></table>
<p class=sub>Oil slick (O, racer): mobile-style weapon. Equipment only works in Hot Pursuit, Gauntlet and cop Hot Pursuit/Interceptor events, with limited uses. Brown (racer) / blue (cop) minimap roads are shortcuts. Rapid Response: wall +2s, vehicle +3s.</p></div>`}
const PAINT=[['Silver','#b9bec6'],['Graphite','#3b4048'],['White','#eceff3'],['Red','#b3151f'],['Blue','#1f4fa8'],['Racing green','#4f7a6b'],['Yellow','#d6b21a'],['Orange','#d4631a'],['Black','#15171b'],['Purple','#6a2a9a']];
function garage(){G=null;ui.className='';
if(window.MENU2){ui.innerHTML=MENU2.garage({S,CARS,SER,UPN,PAINT,eqL});return}
ui.innerHTML=`<div class=card><h1>GARAGE</h1><p class=sub>Cash <b>$${S.cash}</b> - Equipment levels (rise with use): EMP L${eqL('emp')}, Spike L${eqL('spike')}, Jammer L${eqL('jam')}, Turbo L${eqL('turbo')}, Roadblock L${eqL('block')}</p><h3>PAINT</h3>${PAINT.map(p=>`<button title='${p[0]}' style='background:${p[1]};width:34px;height:26px;border:2px solid ${S.paint===p[1]?'#fff':'#345'}' onclick="SC.paint('${p[1]}')"></button>`).join('')}<button onclick="SC.paint('')">DEFAULT</button><h3>UPGRADES (all cars)</h3><table>${Object.keys(UPN).map(k=>{const l=S.up[k],cost=1500*(l+1);return`<tr><td>${UPN[k][0]}</td><td>Lv ${l}/5</td><td class=sub>${UPN[k][1]}</td><td><button ${l>=5||S.cash<cost?'disabled':''} onclick="SC.upg('${k}')">${l>=5?'MAX':'UPGRADE $'+cost}</button></td></tr>`}).join('')}</table>
<h3>CARS (${CARS.length}: 77 Remastered + 3 retail-only) - Racer / Cop / Both can drive</h3><table>${CARS.map(c=>{const o=S.own.includes(c[0]);return`<tr><td class="${o?'own':''}">${c[1]}</td><td>${SER[c[2]]}</td><td>${c[8]} mph, ${c[10]||'?'} hp, ${c[12]}WD</td><td>${{B:'Both',R:'Racer',C:'Cop'}[c[7]]}</td><td><button class="${S.car===c[0]?'on':''}" ${!o&&S.cash<c[5]?'disabled':''} onclick="SC.car('${c[0]}')">${S.car===c[0]?'SELECTED':o?'DRIVE':'BUY $'+c[5]}</button></td></tr>`}).join('')}</table>
<p><button class=go onclick="SC.menu()">BACK</button></p></div>`}
window.SC={menu,garage,go,again:()=>start(lastCfg),pick:(k,v)=>{sel[k]=v;if(k==='d'||k==='side')sel.e=0;menu()},
paint:c=>{S.paint=c||undefined;S.paintSet=1;save();garage()},
upg:k=>{const c=1500*(S.up[k]+1);if(S.up[k]<5&&S.cash>=c){S.cash-=c;S.up[k]++;save();garage()}},
car:id=>{const c=CARS.find(x=>x[0]===id);if(!S.own.includes(id)){if(S.cash<c[5])return;S.cash-=c[5];S.own.push(id)}S.car=id;save();garage()}};
let last=0;function loop(t){requestAnimationFrame(loop);const dt=Math.min(.033,(t-last)/1000||0);last=t;
if(G){if(G.run&&!G.paused)update(dt);draw();audioUpdate()}else{ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#0a0f1c';ctx.fillRect(0,0,W,H)}}
window.SCX={ctx,hud,RW,K,CARS,get G(){return G},get W(){return W},get H(){return H},get n(){return n},get total(){return total},get T(){return{pts,ang,cum,seg,ramps,waters,SCS}},dn:(...c)=>c.some(x=>K[x])};
menu();requestAnimationFrame(loop);
})();
