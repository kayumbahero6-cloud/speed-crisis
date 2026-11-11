// Speed Crisis 3D renderer - detailed rear-view car (glossy paint, L-shaped tail lights, quad exhaust)
(()=>{'use strict';
const R3=window.R3,TAU=R3.TAU;
const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const PB=new Path2D();PB.moveTo(-44,-6);PB.quadraticCurveTo(-52,-8,-51,-24);PB.quadraticCurveTo(-52,-42,-47,-47);PB.quadraticCurveTo(-44,-53,-36,-54);PB.lineTo(36,-54);PB.quadraticCurveTo(44,-53,47,-47);PB.quadraticCurveTo(52,-42,51,-24);PB.quadraticCurveTo(52,-8,44,-6);PB.closePath();
const PC=new Path2D();PC.moveTo(-39,-52);PC.quadraticCurveTo(-35,-66,-28,-74);PC.quadraticCurveTo(-24,-78,-18,-78);PC.lineTo(18,-78);PC.quadraticCurveTo(24,-78,28,-74);PC.quadraticCurveTo(35,-66,39,-52);PC.closePath();
const PG=new Path2D();PG.moveTo(-33,-55);PG.quadraticCurveTo(-30,-65,-25,-71);PG.quadraticCurveTo(-22,-74,-17,-74);PG.lineTo(17,-74);PG.quadraticCurveTo(22,-74,25,-71);PG.quadraticCurveTo(30,-65,33,-55);PG.closePath();
const TL=new Path2D();TL.moveTo(-50,-46);TL.lineTo(-23,-46);TL.quadraticCurveTo(-20,-46,-20,-42);TL.lineTo(-20,-38);TL.lineTo(-44,-38);TL.lineTo(-44,-27);TL.quadraticCurveTo(-45,-24,-48,-24);TL.quadraticCurveTo(-51,-26,-51,-36);TL.closePath();
const TS=new Path2D();TS.moveTo(-47,-44);TS.lineTo(-24,-44);TS.lineTo(-24,-41.2);TS.lineTo(-46.6,-41.2);TS.closePath();
const TV=new Path2D();TV.moveTo(-48,-39.5);TV.lineTo(-45.4,-39.5);TV.lineTo(-45.4,-28);TV.lineTo(-48,-27.5);TV.closePath();
R3.rearCar=(ctx,x,y,u,o)=>{const col=o.col,f=o.f,k=o.k,fg=(c,m)=>R3.col(c,(m===undefined?1:m)*k,f),dead=o.dead,br=o.brake?1:0,n=o.night?1:0;
const hi=mix(col,[255,255,255],.5),lo=[col[0]*.38,col[1]*.38,col[2]*.42];
ctx.save();ctx.translate(x,y);ctx.rotate(o.roll||0);ctx.transform(o.sx||1,0,o.sh||0,1,0,0);ctx.scale(u,u);ctx.lineJoin='round';
// tyres
ctx.fillStyle=fg([14,14,16]);ctx.fillRect(-50,-24,15,24);ctx.fillRect(35,-24,15,24);ctx.fillStyle=fg([40,40,44]);ctx.fillRect(-50,-24,15,2.4);ctx.fillRect(35,-24,15,2.4);
// cabin + glass
let g;const rr=(x,y,w,h)=>{ctx.beginPath();ctx.roundRect?ctx.roundRect(x,y,w,h,4):ctx.rect(x,y,w,h);ctx.fill()};
if(o.type==='roadster'){
ctx.fillStyle=fg([22,20,22]);ctx.beginPath();ctx.moveTo(-36,-52);ctx.lineTo(-33,-75);ctx.lineTo(33,-75);ctx.lineTo(36,-52);ctx.closePath();ctx.fill();
for(const sx of[-15,15]){ctx.fillStyle=fg([48,46,50]);rr(sx-9,-67,18,17);ctx.fillStyle=fg([66,64,68]);ctx.beginPath();ctx.arc(sx,-63,6,0,TAU);ctx.fill()}
if(!dead){ctx.fillStyle=fg([200,200,205]);ctx.beginPath();ctx.ellipse(-15,-55,9.5,7,0,Math.PI,TAU);ctx.fill();ctx.fillStyle=fg([206,160,130]);ctx.beginPath();ctx.arc(-15,-66.5,5.4,0,TAU);ctx.fill();ctx.fillStyle=fg([38,26,20]);ctx.beginPath();ctx.arc(-15,-68,5.6,Math.PI,TAU);ctx.fill();ctx.fillRect(-20.6,-68,2,5)}
ctx.fillStyle=fg(col);for(const sx of[-1,1]){ctx.beginPath();ctx.ellipse(sx*31,-56,7,5,0,Math.PI,TAU);ctx.fill()}
ctx.strokeStyle=fg(mix(col,[0,0,0],.5));ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(-35,-52);ctx.lineTo(-32,-76);ctx.lineTo(32,-76);ctx.lineTo(35,-52);ctx.stroke();ctx.fillStyle='rgba(160,200,235,.2)';ctx.beginPath();ctx.moveTo(-33,-56);ctx.lineTo(-31,-75);ctx.lineTo(31,-75);ctx.lineTo(33,-56);ctx.fill();
}else{
g=ctx.createLinearGradient(0,-78,0,-52);g.addColorStop(0,fg(hi));g.addColorStop(.5,fg(col));g.addColorStop(1,fg(lo));ctx.fillStyle=g;ctx.fill(PC);
g=ctx.createLinearGradient(0,-74,0,-55);g.addColorStop(0,dead?'#222':fg([96,112,132],.9));g.addColorStop(.35,dead?'#111':fg([30,38,50]));g.addColorStop(1,fg([6,8,12]));ctx.fillStyle=g;ctx.fill(PG);
ctx.save();ctx.clip(PG);ctx.fillStyle='rgba(255,255,255,.13)';ctx.beginPath();ctx.moveTo(-30,-56);ctx.lineTo(-12,-56);ctx.lineTo(4,-75);ctx.lineTo(-14,-75);ctx.fill();ctx.fillStyle='rgba(255,255,255,.06)';ctx.beginPath();ctx.moveTo(8,-56);ctx.lineTo(16,-56);ctx.lineTo(26,-75);ctx.lineTo(18,-75);ctx.fill();ctx.restore();
if(br&&!dead){ctx.fillStyle='rgba(255,40,30,.95)';ctx.fillRect(-15,-60.5,30,1.8)}
}
// body
g=ctx.createLinearGradient(0,-54,0,-6);g.addColorStop(0,fg(hi));g.addColorStop(.18,fg(mix(col,hi,.35)));g.addColorStop(.55,fg(col));g.addColorStop(1,fg(lo));ctx.fillStyle=g;ctx.fill(PB);
ctx.save();ctx.clip(PB);g=ctx.createLinearGradient(-52,0,52,0);g.addColorStop(0,'rgba(0,0,0,.45)');g.addColorStop(.2,'rgba(0,0,0,0)');g.addColorStop(.8,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.45)');ctx.fillStyle=g;ctx.fillRect(-52,-54,104,50);
g=ctx.createLinearGradient(-40,0,40,0);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.5,'rgba(255,255,255,.34)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-42,-52);ctx.lineTo(42,-52);ctx.lineTo(38,-48);ctx.lineTo(-38,-48);ctx.fill();
ctx.restore();
// ducktail lip, seams
ctx.fillStyle=fg(mix(col,[0,0,0],.3));ctx.fillRect(-41,-55.5,82,2.4);ctx.strokeStyle='rgba(0,0,0,.4)';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(-41,-46.5);ctx.lineTo(41,-46.5);ctx.moveTo(-40,-46);ctx.lineTo(-40,-27);ctx.moveTo(40,-46);ctx.lineTo(40,-27);ctx.stroke();
// bumper / diffuser
g=ctx.createLinearGradient(0,-26,0,-6);g.addColorStop(0,fg([36,38,44]));g.addColorStop(1,fg([8,8,10]));ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-45,-25);ctx.lineTo(45,-25);ctx.lineTo(43,-9);ctx.quadraticCurveTo(0,-4,-43,-9);ctx.closePath();ctx.fill();
ctx.strokeStyle=fg([70,72,80],.6);ctx.lineWidth=.9;ctx.beginPath();for(let i=-5;i<=5;i++){ctx.moveTo(i*7,-8.5);ctx.lineTo(i*6.3,-18)}ctx.stroke();
ctx.fillStyle=fg([150,10,16]);ctx.fillRect(-46,-20,6,3);ctx.fillRect(40,-20,6,3);
// plate + badge
ctx.fillStyle=fg([226,229,234]);ctx.fillRect(-12.5,-37.5,25,8.5);ctx.fillStyle='rgba(20,30,70,.65)';ctx.fillRect(-12.5,-37.5,3,8.5);ctx.fillRect(-7,-34.5,15,2.2);ctx.fillRect(-7,-31.5,9,1.6);
ctx.fillStyle=fg([200,204,210]);ctx.beginPath();ctx.arc(0,-48.6,3,0,TAU);ctx.fill();ctx.strokeStyle=fg([30,40,70]);ctx.lineWidth=.6;ctx.stroke();ctx.beginPath();ctx.moveTo(-3,-48.6);ctx.lineTo(3,-48.6);ctx.moveTo(0,-51.6);ctx.lineTo(0,-45.6);ctx.stroke();
// exhaust tips
for(const ex of[-31,-21,21,31]){ctx.fillStyle=fg([205,210,216]);ctx.beginPath();ctx.arc(ex,-11,3.4,0,TAU);ctx.fill();ctx.fillStyle='#050506';ctx.beginPath();ctx.arc(ex,-11,2.2,0,TAU);ctx.fill()}
if(o.boost&&!dead){ctx.save();ctx.globalCompositeOperation='lighter';for(const ex of[-31,-21,21,31]){const gg=ctx.createRadialGradient(ex,-11,0,ex,-11,16);gg.addColorStop(0,'rgba(190,225,255,.95)');gg.addColorStop(.4,'rgba(70,140,255,.5)');gg.addColorStop(1,'rgba(40,90,255,0)');ctx.fillStyle=gg;ctx.fillRect(ex-16,-27,32,32)}ctx.restore()}
// tail lights (L shaped, mirrored)
if(!dead){const lit=br?1:n?.62:.42;for(const sg of[-1,1]){ctx.save();ctx.scale(sg,1);g=ctx.createLinearGradient(-51,0,-20,0);g.addColorStop(0,fg([70,0,8]));g.addColorStop(1,fg([150+105*lit,10+30*lit,16+24*lit]));ctx.fillStyle=g;ctx.fill(TL);ctx.fillStyle=fg([255,70+60*br,60+70*br],.55+.45*lit);ctx.fill(TS);ctx.fill(TV);ctx.strokeStyle='rgba(0,0,0,.5)';ctx.lineWidth=.7;ctx.stroke(TL);ctx.restore()}}
else{ctx.fillStyle='#200';ctx.save();ctx.fill(TL);ctx.scale(-1,1);ctx.fill(TL);ctx.restore()}
// police livery
if(o.cop&&!dead){ctx.fillStyle=fg([14,14,18]);ctx.fillRect(-51,-33,102,13);ctx.fillStyle=fg([235,235,240]);ctx.font='bold 8px system-ui';ctx.textAlign='center';ctx.fillText('POLICE',0,-23.5);ctx.textAlign='left';const fl=Math.floor(o.t*8)%2;ctx.fillStyle=fl?'#f33':'#36f';ctx.fillRect(-18,-81.5,17,3.6);ctx.fillStyle=fl?'#36f':'#f33';ctx.fillRect(1,-81.5,17,3.6)}
// GT wing
if(o.type==='wing'){ctx.fillStyle=fg([14,14,16]);for(const sx of[-1,1])ctx.fillRect(sx*17-2.6,-72,5.2,22);g=ctx.createLinearGradient(0,-84,0,-72);g.addColorStop(0,fg([84,86,94]));g.addColorStop(.25,fg([26,26,30]));g.addColorStop(1,fg([6,6,8]));ctx.fillStyle=g;ctx.fillRect(-57,-83,114,10.5);ctx.fillStyle=fg([10,10,12]);ctx.fillRect(-60.5,-90,3.6,24);ctx.fillRect(56.9,-90,3.6,24);ctx.fillStyle='rgba(255,255,255,.22)';ctx.fillRect(-57,-83,114,1.2)}
// outline
ctx.strokeStyle='rgba(0,0,0,.4)';ctx.lineWidth=.9;ctx.stroke(PB);ctx.stroke(PC);
ctx.restore()};
})();
