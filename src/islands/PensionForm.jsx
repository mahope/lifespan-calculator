import { useState } from 'react'
import { computePension, MIN_BIRTHDATE } from '../lib/pensionCalc.js'

const fmtDate = (iso) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })
const fmt1 = (n) => n.toLocaleString('da-DK', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

// Birth date and sex stay in component state: nothing is stored, sent or written to the URL.
export default function PensionForm() {
  const [birthdate, setBirthdate] = useState('')
  const [sex, setSex] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const onSubmit = (e) => {
    e.preventDefault()
    const r = computePension(birthdate, sex)
    setError(r ? '' : 'Skriv en rigtig fødselsdato mellem 1. januar 1930 og i dag.')
    setResult(r)
  }

  return (
    <div className="card">
      <form onSubmit={onSubmit} className="card-content space-y-4" noValidate>
        <div className="space-y-2">
          <label htmlFor="pension-birthdate" className="label">Din fødselsdato</label>
          <input
            id="pension-birthdate"
            type="date"
            className="input w-full"
            min={MIN_BIRTHDATE}
            required
            value={birthdate}
            onChange={(e) => setBirthdate(e.target.value)}
            aria-describedby={error ? 'pension-error' : undefined}
            aria-invalid={error ? 'true' : undefined}
          />
          {error && <p id="pension-error" role="alert" className="text-sm text-destructive">{error}</p>}
        </div>
        <fieldset className="space-y-2">
          <legend className="label">Køn (valgfrit, bruges kun til at vise forventede år som pensionist)</legend>
          <div className="grid grid-cols-3 gap-3" role="radiogroup">
            {[['', 'Ikke angivet'], ['male', 'Mand'], ['female', 'Kvinde']].map(([v, label]) => (
              <button
                key={v || 'none'}
                type="button"
                role="radio"
                aria-checked={sex === v}
                className={`gender-btn ${sex === v ? 'active' : ''}`}
                onClick={() => setSex(v)}
              >
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <button type="submit" className="btn btn-primary w-full">Beregn pensionsalder</button>
      </form>

      {result && (
        <div className="card-content space-y-3 border-t pt-4" aria-live="polite">
          <p className="text-2xl font-bold">
            Folkepensionsalder: {result.pensionYears} år og {result.pensionMonths} måneder
          </p>
          <ul className="space-y-1 text-muted-foreground">
            <li>Dato: <strong className="text-foreground">{fmtDate(result.reachedDate)}</strong></li>
            <li>
              {result.alreadyReached
                ? `Datoen er passeret for cirka ${result.yearsUntil} år siden.`
                : `Der er ${result.daysUntil.toLocaleString('da-DK')} dage (cirka ${result.yearsUntil} år) til.`}
            </li>
            {Object.entries(result.retirementYears).map(([g, v]) => (
              <li key={g}>
                Forventet restlevetid ved pensionsalderen ({g === 'male' ? 'mænd' : 'kvinder'}):{' '}
                <strong className="text-foreground">{fmt1(v)} år</strong> (periodetavle 2024–2025, et gennemsnit)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
