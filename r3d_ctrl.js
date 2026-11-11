// Speed Crisis - on-screen controls drawn on the canvas (hex steering pad, BRAKE, DRIFT, NITRO, GAS) + mouse/touch input
(()=>{'use strict';
const R3=window.R3,TAU=R3.TAU,FT=(w,s)=>w+' '+s+'px system-ui,Segoe UI,Arial,sans-serif';
const hex=(ctx,x,y,w,h)=>{const k=h*.42;ctx.beginPath();ctx.moveTo(x+k,y);ctx.lineTo(x+w-k,y);ctx.lineTo(x+w,y+h/2);ctx.lineTo(x+w-k,y+h);ctx.lineTo(x+k,y+h);ctx.lineTo(x,y+h/2);ctx.closePath()};
const on=(...c)=>SCX.dn(...c);
function shape(ctx,x,y,w,h,kind,lit){if(kind==='hex')hex(ctx,x,y,w,h);else if(kind==='circle'){ctx.beginPath();ctx.arc(x+w/2,y+h/2,w/2,0,TAU)}else{ctx.beginPath();ctx.moveTo(x+14,y);ctx.arcTo(x+w,y,x+w,y+h,14);ctx.arcTo(x+w,y+h,x,y+h,14);ctx.arcTo(x,y+h,x,y,14);ctx.arcTo(x,y,x+w,y,14);ctx.closePath()}
const g=ctx.createLinearGradient(0,y,0,y+h);g.addColorStop(0,lit?'rgba(110,190,255,.55)':'rgba(20,34,60,.42)');g.addColorStop(1,lit?'rgba(40,110,220,.5)':'rgba(6,12,26,.5)');ctx.fillStyle=g;ctx.fill();ctx.strokeStyle=lit?'rgba(190,230,255,.95)':'rgba(255,255,255,.5)';ctx.lineWidth=2;ctx.stroke()}
const chev=(ctx,cx,cy,s,d)=>{ctx.beginPath();ctx.moveTo(cx-d*s*.5,cy-s);ctx.lineTo(cx+d*s*.5,cy);ctx.lineTo(cx-d*s*.5,cy+s);ctx.stroke()};
const drawTouch=(ctx,W,H,u)=>{ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
// steering pad
{const x=22*u,y=H-134*u,w=216*u,h=106*u,L=on('KeyA','ArrowLeft'),Rr=on('KeyD','ArrowRight');shape(ctx,x,y,w,h,'hex',L||Rr);
ctx.save();hex(ctx,x,y,w,h);ctx.clip();ctx.fillStyle='rgba(120,200,255,.5)';if(L)ctx.fillRect(x,y,w/2,h);if(Rr)ctx.fillRect(x+w/2,y,w/2,h);ctx.restore();
ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=5*u;chev(ctx,x+w*.27,y+h/2,16*u,-1);chev(ctx,x+w*.27-16*u,y+h/2,16*u,-1);chev(ctx,x+w*.73,y+h/2,16*u,1);chev(ctx,x+w*.73+16*u,y+h/2,16*u,1);ctx.strokeStyle='rgba(255,255,255,.25)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x+w/2,y+10*u);ctx.lineTo(x+w/2,y+h-10*u);ctx.stroke();R3.addBtn('KeyA',x,y,w,h,{split:['KeyA','KeyD']})}
// BRAKE
{const x=W-330*u,y=H-102*u,w=106*u,h=74*u,l=on('KeyS','ArrowDown');shape(ctx,x,y,w,h,'hex',l);ctx.fillStyle='#fff';ctx.fillRect(x+w/2-18*u,y+20*u,36*u,5*u);ctx.fillRect(x+w/2-18*u,y+30*u,36*u,5*u);ctx.font=FT('bold',13*u);ctx.textAlign='center';ctx.fillText('BRAKE',x+w/2,y+55*u);R3.addBtn('KeyS',x,y,w,h)}
// DRIFT
{const x=W-212*u,y=H-134*u,w=88*u,h=106*u,l=on('Space');shape(ctx,x,y,w,h,'hex',l);ctx.strokeStyle='#fff';ctx.lineWidth=4*u;ctx.beginPath();ctx.moveTo(x+w*.32,y+h*.55);ctx.quadraticCurveTo(x+w*.32,y+h*.3,x+w*.6,y+h*.26);ctx.stroke();ctx.beginPath();ctx.moveTo(x+w*.5,y+h*.2);ctx.lineTo(x+w*.64,y+h*.26);ctx.lineTo(x+w*.52,y+h*.36);ctx.stroke();ctx.fillStyle='#fff';ctx.font=FT('bold',13*u);ctx.textAlign='center';ctx.fillText('DRIFT',x+w/2,y+h*.82);R3.addBtn('Space',x,y,w,h)}
// NITRO
{const x=W-208*u,y=H-228*u,w=70*u,l=on('Enter'),p=SCX.G.p;shape(ctx,x,y,w,w,'circle',l);ctx.strokeStyle=p.nit>=.99?'#5ff':'rgba(120,200,255,.8)';ctx.lineWidth=4*u;ctx.beginPath();ctx.arc(x+w/2,y+w/2,w/2-5*u,-Math.PI/2,-Math.PI/2+TAU*Math.min(1,p.nit));ctx.stroke();ctx.fillStyle='#fff';ctx.font=FT('bold',14*u);ctx.textAlign='center';ctx.fillText('N2O',x+w/2,y+w/2+5*u);R3.addBtn('Enter',x,y,w,w)}
// GAS pedal
{const x=W-110*u,y=H-228*u,w=90*u,h=200*u,l=on('KeyW','ArrowUp');shape(ctx,x,y,w,h,'round',l);ctx.strokeStyle='#fff';ctx.lineWidth=5*u;for(let i=0;i<3;i++)chev(ctx,x+w/2,y+h*.3+i*18*u,0,0);for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(x+w/2-18*u,y+h*.36+i*20*u);ctx.lineTo(x+w/2,y+h*.36+i*20*u-12*u);ctx.lineTo(x+w/2+18*u,y+h*.36+i*20*u);ctx.stroke()}ctx.fillStyle='#fff';ctx.font=FT('bold',14*u);ctx.textAlign='center';ctx.fillText('GAS',x+w/2,y+h-18*u);R3.addBtn('KeyW',x,y,w,h)}
ctx.restore()};

// ---- device detection: touch -> on-screen pads, keyboard -> key hint strip, gamepad -> pad hint strip ----
R3.input=(window.matchMedia&&matchMedia('(pointer:coarse)').matches)||('ontouchstart' in window)?'touch':'kbd';
const setIn=m=>{if(R3.input!==m)R3.input=m};
addEventListener('pointerdown',e=>{if(e.pointerType==='touch'||e.pointerType==='pen')setIn('touch');else if(R3.input==='kbd'&&e.isTrusted&&e.pointerType==='mouse'&&matchMedia('(pointer:coarse)').matches)setIn('touch')},true);
addEventListener('keydown',e=>{if(e.isTrusted)setIn('kbd')},true);
addEventListener('gamepadconnected',()=>setIn('pad'));
const GP={A:'Enter',B:'KeyS'},held={};
const hold=(c,v)=>{if(v&&!held[c]){held[c]=1;window.dispatchEvent(new KeyboardEvent('keydown',{code:c}))}else if(!v&&held[c]){held[c]=0;window.dispatchEvent(new KeyboardEvent('keyup',{code:c}))}};
(function poll(){const g=(navigator.getGamepads?[...navigator.getGamepads()]:[]).find(x=>x);if(g){const ax=g.axes[0]||0,b=i=>g.buttons[i]&&g.buttons[i].pressed,v=i=>g.buttons[i]?g.buttons[i].value:0;
const gas=b(7)||v(7)>.15,brk=b(6)||v(6)>.15,any=Math.abs(ax)>.3||gas||brk||b(0)||b(1)||b(2)||b(3);if(any)setIn('pad');
if(R3.input==='pad'){hold('KeyA',ax<-.25||b(14));hold('KeyD',ax>.25||b(15));hold('KeyW',gas);hold('KeyS',brk);hold('Enter',b(0));hold('Space',b(2)||b(1));hold('KeyV',b(3));hold('Escape',b(9))}}
requestAnimationFrame(poll)})();
const KEYS={kbd:[['W / S','Gas / Brake'],['A / D','Steer'],['Space','Drift'],['Enter','Nitro'],['V','Camera']],pad:[['R2 / L2','Gas / Brake'],['Left stick','Steer'],['A','Nitro'],['X / B','Drift'],['Y','Camera']]};
R3.drawControls=(ctx,W,H,u)=>{if(R3.input==='touch')return drawTouch(ctx,W,H,u);
const k=KEYS[R3.input]||KEYS.kbd;ctx.save();ctx.font=FT('bold',12*u);ctx.textAlign='left';ctx.textBaseline='middle';let w=0;const m=k.map(([a,b])=>{const wa=ctx.measureText(a).width+14*u,wb=ctx.measureText(b).width;return[a,b,wa,wb]});m.forEach(x=>w+=x[2]+x[3]+22*u);
let x=W/2-w/2,y=H-26*u;ctx.fillStyle='rgba(6,12,26,.55)';ctx.beginPath();ctx.roundRect(x-12*u,y-16*u,w+10*u,32*u,16*u);ctx.fill();x+=0;
m.forEach(([a,b,wa,wb])=>{ctx.fillStyle='rgba(255,255,255,.18)';ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(x,y-10*u,wa,20*u,6*u);ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.fillText(a,x+7*u,y);ctx.fillStyle='rgba(255,255,255,.8)';ctx.fillText(b,x+wa+6*u,y);x+=wa+wb+22*u});ctx.restore()};
// ---- pointer input (mouse + touch, multi-touch) ----
const cv=document.getElementById('c');if(!cv)return;cv.style.touchAction='none';const act=new Map();
const pos=e=>{const r=cv.getBoundingClientRect();return[(e.clientX-r.left)*cv.width/r.width,(e.clientY-r.top)*cv.height/r.height]};
const hit=(x,y)=>{for(let i=R3.BT.length-1;i>=0;i--){const b=R3.BT[i];if(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h)return b}return null};
const code=(b,x)=>b.split?(x<b.x+b.w/2?b.split[0]:b.split[1]):b.code;
const down=c=>{if(!SCX.K[c])window.dispatchEvent(new KeyboardEvent('keydown',{code:c}))},up=c=>window.dispatchEvent(new KeyboardEvent('keyup',{code:c}));
cv.addEventListener('pointerdown',e=>{if(!SCX.G||!SCX.G.run)return;const[x,y]=pos(e),b=hit(x,y);if(!b)return;e.preventDefault();try{cv.setPointerCapture(e.pointerId)}catch(_){}const c=code(b,x);act.set(e.pointerId,{b,c});down(c)});
cv.addEventListener('pointermove',e=>{const a=act.get(e.pointerId);if(!a||!a.b.split)return;const c=code(a.b,pos(e)[0]);if(c!==a.c){up(a.c);a.c=c;down(c)}});
const end=e=>{const a=act.get(e.pointerId);if(!a)return;act.delete(e.pointerId);up(a.c)};
cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);cv.addEventListener('contextmenu',e=>e.preventDefault());
})();
