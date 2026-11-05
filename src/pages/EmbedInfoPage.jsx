import React, { useState } from 'react';
import SEOHead from '../components/SEOHead';
import PageHeader from '../components/PageHeader';
import Footer from '../components/Footer';
import { EMBED_HEIGHT_MESSAGE } from '../utils/embedResult';
import { LIFE_TABLE_META } from '../utils/lifeTableDK';

export const EMBED_CODE =
  '<iframe src="https://levetidsberegner.dk/embed" width="100%" height="360" loading="lazy" title="Levetidsberegner" style="border:0"></iframe>';

const ATTRIBUTION_HTML = `<p>Levetidsberegner af <a href="https://levetidsberegner.dk/">levetidsberegner.dk</a>. Kilde: Danmarks Statistik (${LIFE_TABLE_META.period}).</p>`;

const RESIZE_SNIPPET = `<script>
window.addEventListener('message', function (e) {
  if (e.origin !== 'https://levetidsberegner.dk') return;
  if (!e.data || e.data.type !== '${EMBED_HEIGHT_MESSAGE}') return;
  document.querySelector('iframe[title="Levetidsberegner"]').style.height = e.data.height + 'px';
});
</script>`;

const CodeBlock = ({ label, code, children }) => (
  <div>
    <label className="label mb-1 block" htmlFor={label.id}>
      {label.text}
    </label>
    <textarea
      id={label.id}
      readOnly
      rows={code.split('\n').length > 1 ? 7 : 4}
      value={code}
      onFocus={(e) => e.target.select()}
      className="input h-auto font-mono text-xs"
    />
    {children}
  </div>
);

const EmbedInfoPage = () => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMBED_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      document.getElementById('embed-code')?.select();
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead route="/embed-levetidsberegner" />

      <PageHeader
        title="Indlej beregneren"
        subtitle="Gratis widget til din hjemmeside. Én linje kode, ingen cookies og ingen data, der forlader besøgendes browser."
      />

      <main className="flex-1">
        <div className="container py-8 sm:py-12">
          <div className="mx-auto max-w-3xl space-y-8">
            <section className="card" aria-labelledby="preview-h">
              <div className="card-content space-y-4 pt-4 sm:pt-6">
                <h2 id="preview-h" className="text-xl font-bold sm:text-2xl">
                  Eksempel
                </h2>
                <iframe
                  src="/embed"
                  title="Levetidsberegner (eksempel)"
                  width="100%"
                  height="360"
                  loading="lazy"
                  style={{ border: 0 }}
                />
              </div>
            </section>

            <section className="card" aria-labelledby="code-h">
              <div className="card-content space-y-4 pt-4 sm:pt-6">
                <h2 id="code-h" className="text-xl font-bold sm:text-2xl">
                  Sådan gør du
                </h2>
                <p className="text-muted-foreground">
                  Kopiér koden herunder og sæt den ind i HTML'en på den side, hvor beregneren skal
                  vises.
                </p>
                <CodeBlock label={{ id: 'embed-code', text: 'Indlejringskode' }} code={EMBED_CODE}>
                  <div className="mt-2 flex items-center gap-3">
                    <button type="button" onClick={copy} className="btn btn-primary">
                      Kopiér koden
                    </button>
                    <span role="status" className="text-sm text-muted-foreground">
                      {copied ? 'Koden er kopieret' : ''}
                    </span>
                  </div>
                </CodeBlock>

                <div className="rounded-lg border bg-muted/50 p-4" data-testid="attribution">
                  <h3 className="mb-1 font-semibold">Behold kildelinket</h3>
                  <p className="text-sm">
                    Beregneren indeholder et link til levetidsberegner.dk og en kildeangivelse. Vi
                    beder dig beholde dem, så dine besøgende kan se, hvor tallene kommer fra. Vil du
                    også nævne os i din egen tekst, kan du bruge:
                  </p>
                  <CodeBlock
                    label={{ id: 'attribution-code', text: 'Kildehenvisning (valgfri)' }}
                    code={ATTRIBUTION_HTML}
                  />
                </div>

                <h3 className="pt-2 text-lg font-semibold">Vilkår</h3>
                <p className="text-muted-foreground">
                  Widgetten er gratis at bruge, også kommercielt, så længe linket til
                  levetidsberegner.dk og kildeangivelsen bliver stående. Tallene må ikke ændres, og
                  beregneren må ikke præsenteres som din egen.
                </p>
              </div>
            </section>

            <section className="card" aria-labelledby="opt-h">
              <div className="card-content space-y-4 pt-4 sm:pt-6">
                <h2 id="opt-h" className="text-xl font-bold sm:text-2xl">
                  Tilpasning
                </h2>
                <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                  <li>
                    <code>?theme=light</code> eller <code>?theme=dark</code> på adressen vælger lyst
                    eller mørkt udseende, fx <code>/embed?theme=dark</code>.
                  </li>
                  <li>
                    <code>?bg=transparent</code> gør baggrunden gennemsigtig, så widgetten falder
                    ind på din side. Kombinér med <code>&amp;theme=…</code>.
                  </li>
                  <li>Widgetten fungerer fra 320 px bredde og opefter.</li>
                </ul>

                <h3 className="pt-2 text-lg font-semibold">Automatisk højde (valgfrit)</h3>
                <p className="text-muted-foreground">
                  Widgetten sender sin højde i pixel til din side med <code>postMessage</code>, når
                  indholdet ændrer sig. Beskeden indeholder kun højden: ingen alder, køn eller
                  resultat. Ignorerer din side beskeden, sker der ikke noget, og iframen beholder
                  sin faste højde. Vil du lytte efter den, kan du bruge:
                </p>
                <CodeBlock
                  label={{ id: 'resize-code', text: 'Script til automatisk højde' }}
                  code={RESIZE_SNIPPET}
                />
              </div>
            </section>

            <section className="card" aria-labelledby="priv-h">
              <div className="card-content space-y-2 pt-4 sm:pt-6">
                <h2 id="priv-h" className="text-xl font-bold sm:text-2xl">
                  Privatliv
                </h2>
                <p className="text-muted-foreground">
                  Beregningen foregår i den besøgendes browser. Alder og køn sendes ikke til os og
                  gemmes ikke. Vi tæller anonymt, at siden vises (med oplysning om, hvilken side
                  den er indsat på), og hvor mange der trykker Beregn, uden oplysninger om, hvad
                  der blev indtastet.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default EmbedInfoPage;
