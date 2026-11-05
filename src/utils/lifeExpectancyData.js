// Life expectancy data by country
import { LIFE_TABLE_DK } from './lifeTableDK';

// BEGIN GENERATED COUNTRY TABLE (scripts/update-country-table.mjs)
export const countryTable = {
    "Sweden": { male: 82.3, female: 85.3, total: 83.8, country: "Sverige", source: "Eurostat demo_mlexpec", year: 2024 },
    "Norway": { male: 81.6, female: 84.8, total: 83.2, country: "Norge", source: "Eurostat demo_mlexpec", year: 2024 },
    "Finland": { male: 79.6, female: 84.8, total: 82.2, country: "Finland", source: "Eurostat demo_mlexpec", year: 2024 },
    "Japan": { male: 81.1, female: 87.1, total: 84.0, country: "Japan", source: "Verdensbanken SP.DYN.LE00", year: 2024 },
    "World": { male: 71.1, female: 76.0, total: 73.5, country: "Verdensgennemsnit", source: "Verdensbanken SP.DYN.LE00", year: 2024 },
};
// END GENERATED COUNTRY TABLE

// Life expectancy at birth by country. Denmark is derived from the same
// Danmarks Statistik table the calculator uses, so there is only one number.
export const lifeExpectancyData = {
    'Denmark': {
        male: LIFE_TABLE_DK.remaining.male[0],
        female: LIFE_TABLE_DK.remaining.female[0],
        country: 'Danmark',
        source: 'Danmarks Statistik HISB8',
        year: '2024-2025',
    },
    ...countryTable,
};

export const achievements = [
    { id: 'non-smoker', icon: '🙅', title: 'Ikke-ryger', desc: 'Du ryger ikke - det forlænger dit liv!' },
    { id: 'active-lifestyle', icon: '🏃', title: 'Aktiv livsstil', desc: 'Du dyrker regelmæssig motion' },
    { id: 'healthy-eater', icon: '🍎', title: 'Sund spiser', desc: 'Du spiser sundt og nærende mad' },
    { id: 'wellness-warrior', icon: '🧘', title: 'Wellness kriger', desc: 'Du har lav stress og god søvn' },
    { id: 'lifestyle-optimizer', icon: '🎆', title: 'Livsstils optimerer', desc: 'Du har optimeret alle aspekter af din livsstil' }
];

export const getLifeExpectancyForCountry = (country, gender) => {
    const countryData = lifeExpectancyData[country] || lifeExpectancyData['World'];
    return countryData[gender] || countryData.male;
};
