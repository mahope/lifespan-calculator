// Golden test: the engine (useLifespanCalculator.calculateLifespan + src/utils)
// must give identical output before and after the Astro port. The fixture
// golden.json was generated from origin/master (4afef1e) with the same harness;
// regenerate it only from master: GOLDEN_WRITE=1 npx vitest run src/golden
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { readFileSync, writeFileSync } from 'node:fs'
import { useLifespanCalculator } from '../hooks/useLifespanCalculator'

const FIXED_NOW = '2026-11-05T12:00:00.000Z'
const FIXTURE = new URL('./golden.json', import.meta.url)

const ADVANCED = { smoking: -5, exercise: 4, diet: 3, sleep: 2 }

export const INPUTS = [
  { name: 'male-40', input: 40, gender: 'male', factors: {} },
  { name: 'female-65', input: 65, gender: 'female', factors: {} },
  { name: 'male-birthdate-1985-06-15', input: '1985-06-15', gender: 'male', factors: {} },
  { name: 'male-50-advanced', input: 50, gender: 'male', factors: ADVANCED },
  { name: 'female-30', input: 30, gender: 'female', factors: {} },
  { name: 'male-85', input: 85, gender: 'male', factors: {} },
]

// Runs the hook inside a server render: render-phase state updates are applied,
// so step 0 sets the lifestyle factors and step 1 calculates with them.
function compute({ input, gender, factors }) {
  let step = 0
  let result = null
  function Probe() {
    const h = useLifespanCalculator()
    if (step === 0) {
      step = 1
      h.applyLifestyleFactors(factors)
    } else if (step === 1) {
      step = 2
      result = h.calculateLifespan(input, gender)
    }
    return null
  }
  renderToString(createElement(Probe))
  return result
}

describe('golden engine output', () => {
  beforeAll(() => {
    process.env.TZ = 'Europe/Copenhagen'
    vi.useFakeTimers()
    vi.setSystemTime(new Date(FIXED_NOW))
  })
  afterAll(() => vi.useRealTimers())

  const actual = () => Object.fromEntries(INPUTS.map((i) => [i.name, compute(i)]))

  if (process.env.GOLDEN_WRITE) {
    it('writes the fixture', () => {
      writeFileSync(FIXTURE, JSON.stringify(actual(), null, 2) + '\n')
    })
  } else {
    const golden = JSON.parse(readFileSync(FIXTURE, 'utf8'))
    for (const i of INPUTS) {
      it(`matches master for ${i.name}`, () => {
        const got = JSON.parse(JSON.stringify(compute(i)))
        expect(got).toEqual(golden[i.name])
      })
    }
  }
})
