// Life expectancy data by country
export const lifeExpectancyData = {
    'Denmark': { male: 78.9, female: 82.7, country: 'Danmark' },
    'Sweden': { male: 80.8, female: 84.3, country: 'Sverige' },
    'Norway': { male: 80.5, female: 84.2, country: 'Norge' },
    'Germany': { male: 78.6, female: 83.4, country: 'Tyskland' },
    'United Kingdom': { male: 79.4, female: 83.1, country: 'Storbritannien' },
    'United States': { male: 76.3, female: 81.4, country: 'USA' },
    'France': { male: 79.7, female: 85.6, country: 'Frankrig' },
    'Netherlands': { male: 80.2, female: 83.9, country: 'Holland' },
    'Finland': { male: 78.7, female: 84.5, country: 'Finland' },
    'Iceland': { male: 81.3, female: 84.1, country: 'Island' },
    'Switzerland': { male: 81.9, female: 85.6, country: 'Schweiz' },
    'Japan': { male: 81.6, female: 87.7, country: 'Japan' },
    // Default fallback
    'World': { male: 72.6, female: 77.1, country: 'Verdensgennemsnit' }
};

export const achievements = [
    { id: 'non-smoker', icon: '🙅', title: 'Ikke-ryger', desc: 'Du ryger ikke - det forlænger dit liv!' },
    { id: 'active-lifestyle', icon: '🏃', title: 'Aktiv livsstil', desc: 'Du dyrker regelmæssig motion' },
    { id: 'healthy-eater', icon: '🍎', title: 'Sund spiser', desc: 'Du spiser sundt og nærende mad' },
    { id: 'wellness-warrior', icon: '🧘', title: 'Wellness kriger', desc: 'Du har lav stress og god søvn' },
    { id: 'lifestyle-optimizer', icon: '🎆', title: 'Livsstils optimerer', desc: 'Du har optimeret alle aspekter af din livsstil' }
];

// Own-property lookup so keys like "constructor" or "__proto__" fall back to World.
const countryEntry = (country) =>
    Object.hasOwn(lifeExpectancyData, country) ? lifeExpectancyData[country] : lifeExpectancyData['World'];

export const getLifeExpectancyForCountry = (country, gender) => {
    const countryData = countryEntry(country);
    return (Object.hasOwn(countryData, gender) && countryData[gender]) || countryData.male;
};

export const formatCountryName = (country) => {
    const countryData = countryEntry(country);
    return countryData.country;
};