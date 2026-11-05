import { LIFE_TABLE_DK } from './code_copy/lifeTableDK.mjs';
const NOW = new Date(2026,10,5,12);
const f = (y)=>{ const yrs=Math.floor(y); const d=Math.floor((y-yrs)*365.25); return new Date(NOW.getFullYear()+yrs, NOW.getMonth(), NOW.getDate()+d).toLocaleDateString('da-DK'); };
console.log('male40 end if fraction kept', f(41.23), 'female65', f(21.39));
const ext=(sex,q99)=>{ const l=LIFE_TABLE_DK.survivors[sex]; return l[99]*(1-q99/1e5); };
const l100m=ext('male',41188), l100f=ext('female',34091);
console.log('l100 m,f',l100m,l100f);
console.log('P(100) male40', (l100m/LIFE_TABLE_DK.survivors.male[40]).toFixed(4), 'female65', (l100f/LIFE_TABLE_DK.survivors.female[65]).toFixed(4), 'male b1985 (41.39)', (l100m/(LIFE_TABLE_DK.survivors.male[41]+(LIFE_TABLE_DK.survivors.male[42]-LIFE_TABLE_DK.survivors.male[41])*0.39)).toFixed(4), 'female60', (l100f/LIFE_TABLE_DK.survivors.female[60]).toFixed(4));
