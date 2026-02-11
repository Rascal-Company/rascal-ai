# Rascal AI – Uuden devaajan aloitusopas

## 1. Esitiedot

| Työkalu | Versio |
|---------|--------|
| Node.js | v18+ (projekti käyttää v24.2.0) |
| npm | v11+ |
| Vercel CLI | uusin (`npm i -g vercel`) |

## 2. Projektin rakenne

```
rascal-ai/
├── src/                  # Frontend (React 19 + Vite + Tailwind CSS 4)
│   ├── pages/            # Sivukomponentit (~33 kpl)
│   ├── components/       # UI-komponentit (~90+ kpl)
│   ├── contexts/         # React Context -providerit
│   ├── hooks/queries/    # TanStack Query -hookit
│   ├── services/         # API-kutsut (Axios)
│   ├── locales/          # Käännökset (fi/en, i18next)
│   └── lib/supabase.js   # Supabase-client
│
├── api/                  # Backend (Vercel Serverless Functions, 140+ endpointtia)
│   ├── _lib/             # Jaetut utilityt (logger, rate-limit, crypto, cors)
│   ├── ai/, calls/, campaigns/, leads/, social/, strategy/ ...
│
├── docs/                 # Dokumentaatio
├── CLAUDE.md             # Koodausohjeet ja best practices
└── vercel.json           # Deployment-konfiguraatio
```

## 3. Asennus

```bash
git clone <repo-url>
cd rascal-ai
npm install
```

## 4. Ympäristömuuttujat

Pyydä `.env.local`-tiedosto tiimin vetäjältä. Tiedostoa **ei commitoida** (gitignoressa).

Kriittiset muuttujat:

- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` – Supabase-yhteys
- `SUPABASE_SERVICE_ROLE_KEY` – Backend-avain
- `N8N_SECRET_KEY` + N8N webhook -URLit – Automaatiot
- `USER_SECRETS_ENCRYPTION_KEY` – Salaus (AES-256-GCM)

`VITE_`-alkuiset näkyvät frontendissä, muut vain backendissä.

## 5. Kehityspalvelimet

```bash
# Terminaali 1: Frontend (port 5173)
npm run dev

# Terminaali 2: Backend API (port 3000)
vercel dev
```

Vite proxyaa `/api/*`-kutsut automaattisesti porttiin 3000.

## 6. Testit

```bash
npm test              # Watch-mode (Vitest)
npm run test:ui       # Interaktiivinen selain-UI
npm run test:coverage # Kattavuusraportti
```

Testit sijaitsevat lähdetiedostojen vieressä (`*.spec.js`).

## 7. Laadunvarmistus

```bash
npm run lint          # ESLint
```

Git-hookit (Husky) ajavat automaattisesti commitlint-tarkistuksen – käytä **Conventional Commits** -muotoa:

```
feat(leads): add CSV export
fix(auth): handle expired tokens
```

## 8. Teknologiat

| Kerros | Teknologia |
|--------|-----------|
| Frontend | React 19, Vite 6, Tailwind CSS 4, React Router 7 |
| Data | TanStack Query 5 |
| Kieli | i18next (fi/en) |
| Backend | Vercel Serverless Functions (Node.js) |
| Tietokanta | Supabase (PostgreSQL + RLS) |
| Automaatiot | N8N-workflowt |
| Tiedostot | Vercel Blob |
| Rate limiting | Upstash Redis |

## 9. Tärkeimmät tiedostot alkuun

- **`CLAUDE.md`** – Lue tämä ensin. Sisältää koodauskäytännöt, testauskäytännöt ja pikakomennot.
- **`src/main.jsx`** – Frontendin entry point
- **`vite.config.js`** – Build-konfiguraatio
- **`docs/`** – SECURITY.md, RATE_LIMITING.md, USER_SECRETS_SETUP.md jne.

## 10. Ensimmäinen muutos

1. Luo feature-branch: `git checkout -b feat/oma-feature`
2. Tee muutos, katso HMR:n päivittävän selaimen
3. Aja testit: `npm test`
4. Aja lint: `npm run lint`
5. Commitoi: `git commit -m "feat(scope): kuvaus"`
6. Pushaa ja avaa PR

Dockeria **ei tarvita** – kaikki pyörii Vercel + Supabase -palveluina.
