// Answer-first sentences for the landing pages. Every figure is read from LIFE_TABLE_DK
// (Danmarks Statistik HISB8, LIFE_TABLE_META.period), never typed by hand.
import { LIFE_TABLE_DK, LIFE_TABLE_META } from './lifeTableDK';

export const SOURCE = `Danmarks Statistik, ${LIFE_TABLE_META.period}`;

const years = (n) => `${n.toFixed(1).replace('.', ',')} år`;
const e = (age, gender) => LIFE_TABLE_DK.remaining[gender][age];

export const answerFirst = {
  danmark: () =>
    `Nyfødte danske drenge kan forvente at leve ${years(e(0, 'male'))} og piger ${years(e(0, 'female'))} (${SOURCE}). ` +
    `En 40-årig mand kan forvente ${years(e(40, 'male'))} til og en 40-årig kvinde ${years(e(40, 'female'))}.`,
  hvorLangTid: () =>
    `En 40-årig mand har statistisk ${years(e(40, 'male'))} tilbage og en 40-årig kvinde ${years(e(40, 'female'))}. ` +
    `For en 60-årig er tallene ${years(e(60, 'male'))} og ${years(e(60, 'female'))} (${SOURCE}).`,
  dodsalder: () =>
    `En 40-årig mand kan statistisk forvente at blive ${years(40 + e(40, 'male'))} og en 40-årig kvinde ${years(40 + e(40, 'female'))} ` +
    `(${SOURCE}). Det er et gennemsnit, ikke en prognose for den enkelte.`,
  livsstil: () =>
    `Livsstilen er det, du selv kan flytte i forhold til gennemsnittet: rygning, kost, motion og alkohol ændrer hvor mange år, statistikken giver dig. ` +
    `Svarene lægger du ind i levetidsberegneren, og de bliver i din browser.`,
};
