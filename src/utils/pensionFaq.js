// FAQ shown on /pensionsalder; the visible text and the FAQPage JSON-LD share this one source.
export const FAQ = [
  [
    'Hvornår kan jeg gå på folkepension?',
    'Det afhænger af din fødselsdato. Er du født 1955 (2. halvår) til 1962, er alderen 67 år; er du født i 1971 eller senere, er den 70 år. Retten til folkepension begynder den 1. i måneden efter, at du har nået folkepensionsalderen. Skriv din fødselsdato ovenfor for at se dato og alder.',
  ],
  [
    'Hvad betyder regulering i 2030?',
    'Folkepensionsalderen er fastsat i Lov om social pension, senest ændret ved Lov nr. 703 af 20. juni 2025 (70 år for dem født fra 1971; de øvrige aldre stammer fra tidligere ændringer). I 2030 tager Folketinget igen stilling til, om alderen skal sættes op for de yngste årgange (født 1975 eller senere). Det sker ikke automatisk.',
  ],
  [
    'Hvor længe er jeg pensionist?',
    'Tallet er forventede år tilbage, hvis du når pensionsalderen, ifølge Danmarks Statistiks dødelighedstabel. Det er et gennemsnit for mange mennesker og ikke en prognose for dig.',
  ],
];

export const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map(([q, a]) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};
