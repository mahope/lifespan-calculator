import { jointLifeStats, survivalProbability, remainingLifeExpectancy } from './code_copy/lifeTableDK.mjs';
// curtate (code) vs complete expectation (trapezoid) of joint-life years, and single-life check
function complete(a1,g1,a2,g2){ const maxT=99-Math.max(a1,a2); let s=0, prev=1; for(let t=1;t<=maxT;t++){ const p=survivalProbability(a1,a1+t,g1)*survivalProbability(a2,a2+t,g2); s+=(prev+p)/2; prev=p;} s+=prev/2*0; return s; }
const out={};
for (const [a1,g1,a2,g2] of [[40,'male',40,'female'],[35,'male',35,'female'],[70,'male',70,'female']]) {
  out[`${a1}${g1[0]}+${a2}${g2[0]}`]={code_expectedTogether:+jointLifeStats(a1,g1,a2,g2).expectedTogether.toFixed(2), trapezoid_complete:+complete(a1,g1,a2,g2).toFixed(2)};
}
// single life sanity: sum_{t>=1} P(alive at t) vs e_x
const single=(a,g)=>{let s=0;for(let t=1;t<=99-a;t++)s+=survivalProbability(a,a+t,g);return s;};
out.single_male40={curtate_sum:+single(40,'male').toFixed(2), e_x_table:remainingLifeExpectancy(40,'male')};
console.log(JSON.stringify(out,null,1));
