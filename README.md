# Rascal AI - Täyden palvelun markkinointi- ja myyntityökalu

Rascal AI on ammattimainen AI-pohjainen SaaS-sovellus markkinointiin ja myyntiin. Sovellus yhdistää kampanjoiden hallinnan, sisällöntuotannon, massapuhelut, CRM-toiminnot, analytiikan ja automaation yhdeksi saumattomaksi kokonaisuudeksi.

## 🚀 Pääominaisuudet

### 🤖 AI-pohjaiset toiminnot

- **AI Chat** - Älykäs keskusteluavustaja markkinointi- ja myyntikysymyksiin
- **Sisältöstrategia** - Rakentaa kattavan sisältöstrategian ihanneasiakasprofiilin mukaisesti
- **Sisällöntuotanto** - Luo sisältöaihiot sosiaaliseen mediaan, blogiin ja uutiskirjeisiin
- **Älykkäät soitot** - AI-ohjatut outbound- ja inbound-puhelut soittoskriptin mukaisesti
- **Automaattinen raportointi** - Raportoi kaikki puhelut, keskustelut ja jatkotoimenpiteet

### 📊 Kampanjat ja seuranta

- **Kampanjoiden hallinta** - Luo, hallinnoi ja seuraa markkinointikampanjoita
- **Dashboard** - Keskitetty näkymä kaikkien toimintojen seurantaan
- **Call Analytics** - Puheluiden yksityiskohtainen analyysi ja raportointi
- **Social Media Analytics** - Sosiaalisen median suorituskyvyn seuranta
- **Content Performance** - Sisällön suorituskyvyn mittarit
- **Raportit** - Monipuoliset raportointityökalut

### 📞 Puhelut ja asiakaskontaktit

- **Mass Call -hallinta** - Suurten puhelukampanjoiden hallinta ja automatisointi
- **Inbound-puhelut** - Saapuvien puheluiden hallinta ja skriptit
- **Outbound-puhelut** - Lähtevien puheluiden kampanjat
- **Puhelutyypit** - Mukautettavat puhelutyypit eri käyttötarkoituksiin
- **Knowledge Base** - Tietopankki AI-puheluille
- **Meeting Notes** - Automaattiset muistiinpanot kokouksista

### 📱 Sosiaalinen media ja sisältö

- **Postausten hallinta** - Luo, aikatauluta ja julkaise sisältöä
- **Blog & Newsletter** - Blogiartikkeleiden ja uutiskirjeiden hallinta
- **Kuvapankki** - Keskitetty mediapankki kaikille kuville ja videoille
- **UGC Video** - User-generated content -videoiden hallinta
- **Carousel-mallit** - Valmismallit karusellijulkaisuille
- **Media Monitoring** - Median seuranta ja analyysi
- **Testimonials** - Asiakassuositusten hallinta

### 🎯 Liidien hallinta ja myynti

- **Account Manager** - Asiakastilien hallinta ja seuranta
- **Lead Scraping** - Liidien automaattinen kerääminen
- **Lead Magnet** - Julkiset liidigeneraattorisivut tokenin avulla
- **Lead Searches** - Liidien haku ja suodatus
- **Vastaaja** - Automaattinen vastaajajärjestelmä

### 🏢 Organisaatio ja hallinta

- **Organization Members** - Tiimin jäsenten hallinta ja oikeudet
- **Account Details** - Yksityiskohtaiset asiakastiedot
- **Workspace Config** - Työtilan asetukset ja määritykset
- **Admin Panel** - Kattava hallintapaneeli
  - Käyttäjähallinta
  - Call logs
  - Message logs
  - Testimonials-hallinta
  - Järjestelmätiedot

### 🔌 Integraatiot

- **Supabase** - Tietokanta, autentikointi ja Row Level Security (RLS)
- **N8N Workflows** - Automaatiointegraatiot useisiin toimintoihin
- **Google Analytics** - OAuth 2.0 -integraatio analytiikkatietoihin
- **WordPress/Mixpost** - Sisällönhallinta ja julkaisu
- **Placid** - Dynaaminen kuvien generointi
- **ElevenLabs** - AI-äänisynteesi puheluihin
- **Vercel Blob Storage** - Tiedostojen tallennus
- **Upstash Redis** - Rate limiting

## 🛠️ Teknologiat

### Frontend

- **React 19** - Moderni, tehokas käyttöliittymä
- **Vite** - Nopea kehitysympäristö ja build-työkalu
- **Tailwind CSS 4** - Utility-first CSS-framework
- **React Router v7** - Client-side routing
- **TanStack Query** - Tehokas datan hallinta ja cachetus
- **i18next** - Monikielisyystuki (fi/en)
- **Lucide React** - Modernit ikonit
- **Recharts** - Interaktiiviset kaaviot
- **React Markdown** - Markdown-renderöinti

### Backend & API

- **Vercel Serverless Functions** - 140+ API-endpointtiä
- **Supabase** - PostgreSQL-tietokanta ja autentikointi
- **JWT Authentication** - Turvallinen kirjautuminen
- **Row Level Security (RLS)** - Tietoturva tietokantatasolla
- **N8N Integration** - Workflow-automatisointi
- **Rate Limiting** - Upstash Redis -pohjainen

### Työkalut ja laatu

- **Vitest** - Yksikkö- ja integraatiotestit
- **ESLint** - Koodin laadun tarkistus
- **Husky** - Git hooks
- **Commitlint** - Commit-viestien standardointi (Conventional Commits)
- **Standard Version** - Automaattinen versionhallinta ja changelog

## 📁 Projektin rakenne

```
rascal-ai/
├── src/                           # Frontend-sovellus
│   ├── pages/                     # Sivukomponentit
│   │   ├── DashboardPage.jsx      # Dashboard
│   │   ├── AIChatPage.jsx         # AI Chat
│   │   ├── ContentStrategyPage.jsx # Sisältöstrategia
│   │   ├── CampaignsPage.jsx      # Kampanjat
│   │   ├── CallPanel.jsx          # Puheluiden hallinta
│   │   ├── ManagePostsPage.jsx    # Postausten hallinta
│   │   ├── BlogNewsletterPage.jsx # Blogi ja uutiskirjeet
│   │   ├── AccountManagerPage.jsx # Asiakashallinta
│   │   ├── LeadScrapingPage.jsx   # Liidien kerääminen
│   │   ├── MediaMonitoringPage.jsx # Median seuranta
│   │   ├── OrganizationMembersPage.jsx # Tiimin hallinta
│   │   ├── AdminPage.jsx          # Admin-paneeli
│   │   └── ...                    # 30+ muuta sivua
│   ├── components/                # Uudelleenkäytettävät komponentit
│   │   ├── auth/                  # Autentikaatio
│   │   ├── campaigns/             # Kampanjakomponentit
│   │   ├── ai-chat/               # Chat-komponentit
│   │   ├── blog-newsletter/       # Blog-komponentit
│   │   ├── Strategy/              # Strategiakomponentit
│   │   ├── KeskenModal/           # Sisällön muokkaus
│   │   ├── AccountDetailsTabs/    # Asiakastiedot
│   │   └── ...                    # 90+ komponenttia
│   ├── contexts/                  # React Context API
│   │   ├── AuthContext.jsx        # Autentikaatio
│   │   ├── PostsContext.jsx       # Postaukset
│   │   ├── NotificationContext.jsx # Notifikaatiot
│   │   ├── ToastContext.jsx       # Toast-ilmoitukset
│   │   ├── MonitoringContext.jsx  # Seuranta
│   │   └── ...
│   ├── hooks/                     # Custom React Hooks
│   ├── services/                  # API-palvelut
│   │   ├── api.js                 # N8N API client
│   │   └── mixpostApi.js          # Mixpost API client
│   ├── lib/                       # Kirjastot
│   │   └── supabase.js            # Supabase client
│   ├── utils/                     # Apufunktiot
│   ├── locales/                   # Käännökset (fi/en)
│   └── styles/                    # Globaalit tyylit
│
├── api/                           # Vercel Serverless Functions
│   ├── admin/                     # Admin-endpointit
│   ├── ai/                        # AI-endpointit
│   ├── analytics/                 # Analytiikka
│   ├── auth/                      # Autentikaatio (Google OAuth)
│   ├── avatars/                   # Avatar-hallinta
│   ├── calls/                     # Puheluendpointit
│   ├── campaigns/                 # Kampanjat
│   ├── content/                   # Sisältöhallinta
│   ├── integrations/              # Integraatiot
│   ├── leads/                     # Liidien hallinta
│   ├── monitoring/                # Seuranta
│   ├── organization/              # Organisaatiohallinta
│   ├── social/                    # Sosiaalinen media
│   ├── strategy/                  # Strategia
│   ├── users/                     # Käyttäjähallinta
│   ├── webhooks/                  # Webhookit
│   ├── _lib/                      # Jaetut kirjastot
│   └── _middleware/               # Middleware-funktiot
│
├── public/                        # Staattiset tiedostot
├── docs/                          # Dokumentaatio
├── tests/                         # Testit
└── supabase/                      # Supabase-konfiguraatio
```

## 🚀 Asennus ja käyttö

### 1. Kloonaa projekti

```bash
git clone <repository-url>
cd rascal-ai
```

### 2. Asenna riippuvuudet

```bash
npm install
```

### 3. Ympäristömuuttujat

Luo `.env.local` tiedosto projektin juureen:

```bash
# Supabase (pakollinen)
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# API Configuration (pakollinen)
VITE_API_KEY=your-api-key
VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook

# User Secrets Encryption (pakollinen)
USER_SECRETS_ENCRYPTION_KEY=your-encryption-key-32-chars

# Google Analytics OAuth (vapaaehtoinen)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://app.rascalai.fi/api/auth/google/callback

# Mixpost Integration (vapaaehtoinen)
VITE_MIXPOST_RASCAL_API_URL=https://mixpost.mak8r.fi
VITE_MIXPOST_API_URL=https://mixpost.mak8r.fi

# Placid Integration (vapaaehtoinen)
PLACID_API_TOKEN=your-placid-api-token
PLACID_SDK_TOKEN=your-placid-sdk-token

# N8N Webhooks (vapaaehtoiset)
N8N_INTEGRATION_WEBHOOK_URL=https://your-n8n.com/webhook/google-analytics
N8N_GET_STRATEGY_URL=https://your-n8n.com/webhook/get-strategy
N8N_INBOUND_SETTINGS_WEBHOOK=https://your-n8n.com/webhook/inbound-settings
N8N_PERSONAL_IMAGES=https://your-n8n.com/webhook/personal-images
N8N_AVATAR_STATUS=https://your-n8n.com/webhook/get-avatar-status
N8N_PLACID_TEMPLATE_CREATE=https://your-n8n.com/webhook/placid-template-create
N8N_LEADMAGNET_GET=https://your-n8n.com/webhook/leadmagnet-get
# ... ja muut N8N-webhookit tarpeen mukaan

# Muut
APP_URL=https://app.rascalai.fi
VITE_ROOT_DOMAIN=rascalai.fi
```

**Huom:**

- Frontend käyttää `VITE_`-etuliitteellisiä muuttujia
- Backend (API) käyttää `process.env.*` muuttujia
- Katso yksittäiset API-tiedostot tarvittavista muuttujista

### 4. Käynnistä kehityspalvelin

```bash
npm run dev
```

Sovellus käynnistyy osoitteessa `http://localhost:5173`

#### Vercel Development Server

To run the application with Vercel's development environment, which includes Vercel-specific features like Serverless Functions and Edge Middleware, use the following command:

```bash
vercel dev
```

The application will start on `http://localhost:3000` (or another available port).

### 5. Testit

```bash
# Aja testit
npm test

# Testit UI:lla
npm run test:ui

# Coverage-raportti
npm run test:coverage
```

## 📚 Dokumentaatio

Projektissa on laaja dokumentaatio `docs/`-kansiossa:

- **GOOGLE_ANALYTICS_OAUTH_SETUP.md** - Google Analytics OAuth 2.0 -integraatio
- **INTEGRATION_WEBHOOKS.md** - N8N-webhookit ja automaatiot
- **USER_SECRETS_SETUP.md** - Käyttäjien salattujen tietojen hallinta
- **LEADMAGNET_SETUP.md** - Lead Magnet -toiminnallisuus
- **CSS_ARCHITECTURE.md** - CSS-arkkitehtuuri ja tyylit
- **VERSIONING.md** - Versionhallinta ja changelog

Lisäksi projektin juuressa:

- **CLAUDE.md** - Kehitysohjeet ja best practices
- **CHANGELOG.md** - Yksityiskohtainen muutosloki

## 🔗 API Endpointit (140+)

### Autentikointi

- `GET /api/auth/google/start` - Aloittaa Google OAuth 2.0 -virran
- `GET /api/auth/google/callback` - Käsittelee OAuth-callbackin

### Kampanjat

- `GET /api/campaigns` - Listaa kampanjat
- `POST /api/campaigns` - Luo uuden kampanjan
- `GET /api/campaigns/[id]` - Hae kampanjan tiedot
- `PUT /api/campaigns/[id]` - Päivitä kampanja
- `DELETE /api/campaigns/[id]` - Poista kampanja

### Puhelut

- `POST /api/calls/mass` - Massapuhelut
- `GET /api/calls/single` - Yksittäinen puhelu
- `GET /api/calls/types` - Puhelutyypit
- `POST /api/calls/types/create` - Luo uusi puhelutyyppi
- `POST /api/calls/knowledge-base-upload` - Lataa tietopankki
- `GET /api/calls/inbound-settings` - Inbound-asetukset

### Sisältö

- `GET /api/content/blog/list` - Listaa blogiartikkelit
- `POST /api/content/blog/create` - Luo blogiartikkeli
- `GET /api/content/blog/get-article/[slug]` - Hae artikkeli
- `PUT /api/content/blog/update-article/[id]` - Päivitä artikkeli
- `DELETE /api/content/blog/delete-article/[id]` - Poista artikkeli
- `POST /api/content/blog/upload-image` - Lataa kuva
- `POST /api/content/blog/publish` - Julkaise artikkeli
- `GET /api/content/testimonials/list` - Listaa suositukset
- `POST /api/content/media-management` - Median hallinta
- `POST /api/content/import-post` - Tuo postaus

### Liidit

- `GET /api/leads` - Listaa liidit
- `POST /api/leads/scraping` - Kerää liidejä
- `GET /api/leads/searches` - Liidihaut
- `GET /api/leads/magnet` - Lead magnet -tiedot

### Analytiikka

- `GET /api/analytics` - Yleinen analytiikka
- `GET /api/analytics/dashboard-success` - Dashboard-metriikat
- `GET /api/analytics/google-analytics-visitors` - Google Analytics -kävijät

### Organisaatio

- `GET /api/organization/members` - Tiimin jäsenet
- `POST /api/organization/invites` - Kutsu jäsen
- `GET /api/organization/account-members` - Asiakastilin jäsenet
- `POST /api/organization/onboarding-completed` - Onboarding valmis

### Admin

- `GET /api/admin/data` - Admindatan haku
- `GET /api/admin/call-logs` - Puhelulokit
- `GET /api/admin/message-logs` - Viestilokit
- `GET /api/admin/testimonials` - Suositukset

### Käyttäjät

- `GET /api/users/secrets` - Käyttäjän integraatiot
- `POST /api/users/secrets` - Tallenna integraatio (salattu)
- `GET /api/users/secrets?decrypt=true` - Hae salattu tieto
- `GET /api/users/secrets-service` - Service-to-service endpoint

### Integraatiot

- `GET /api/integrations/google-analytics` - Google Analytics
- `POST /api/integrations/mixpost` - Mixpost-integraatio
- `POST /api/placid/auth` - Placid-autentikaatio
- `POST /api/placid/create-template` - Luo Placid-template

### Strategia

- `GET /api/strategy` - Hae strategia
- `POST /api/strategy` - Luo strategia

### Webhookit

- `POST /api/webhooks/[name]` - Yleiset webhookit

### Muut

- `POST /api/storage/upload` - Tiedostojen lataus
- `GET /api/notifications` - Notifikaatiot
- `GET /api/support` - Tuki
- `GET /api/system/health` - Järjestelmän tila
- `GET /api/workspace/config` - Työtilan asetukset
- `POST /api/avatars/upload` - Lataa avatar
- `GET /api/avatars/status` - Avatarin tila
- `GET /api/segments` - Segmentit
- `POST /api/social/publish` - Julkaise sosiaaliseen mediaan
- ... ja paljon muuta

## 🚀 Julkaisu

Projekti julkaistaan Vercelissä:

1. Yhdistä GitHub-repository Verceliin
2. Aseta kaikki ympäristömuuttujat Vercel Dashboardissa
3. Deploy tapahtuu automaattisesti `main`-branchiin pushatessa

### Build-komennot

```bash
# Tuotantoversio
npm run build

# Esikatselu
npm run preview
```

## 🔒 Tietoturva

- **JWT Authentication** - Turvallinen token-pohjainen autentikaatio
- **Row Level Security (RLS)** - Supabase-tietokantatasolla
- **Encrypted Secrets** - Käyttäjien salaisuudet salataan AES-256-GCM:llä
- **Rate Limiting** - API-kutsujen rajoitus Upstash Redisillä
- **CORS** - Määritetyt allowed origins
- **Secure Headers** - Vercel-konfiguraatiossa

## 🧪 Testaus

Projekti käyttää Vitestiä yksikkö- ja integraatiotestaukseen:

- **Unit Tests** - Yksittäisten funktioiden testaus
- **Integration Tests** - API-endpointtien ja komponenttien integraatiotestit
- **Coverage Reports** - Testikattavuusraportit

```bash
# Testit watchmodessa
npm test

# Testit UI:lla
npm run test:ui

# Coverage
npm run test:coverage
```

## 📦 Versionhallinta

Projekti käyttää Conventional Commits -formaattia ja Standard Versionia:

```bash
# Patch-versio (1.0.0 -> 1.0.1)
npm run release:patch

# Minor-versio (1.0.0 -> 1.1.0)
npm run release:minor

# Major-versio (1.0.0 -> 2.0.0)
npm run release:major

# Automaattinen versio commit-viestien perusteella
npm run release
```

Katso tarkemmat ohjeet: [VERSIONING.md](VERSIONING.md)

## 🤝 Kehitysohjeet

Katso yksityiskohtaiset kehitysohjeet ja best practices tiedostosta [CLAUDE.md](CLAUDE.md), joka sisältää:

- Implementation Best Practices
- Writing Functions Best Practices
- Writing Tests Best Practices
- Code Organization
- Keyboard Shortcuts (QNEW, QPLAN, QCODE, QCHECK, jne.)

## 📊 Projektin tila

- **Versio:** 1.120.1
- **React:** 19.2.3
- **Node.js:** >=18
- **API Endpoints:** 140+
- **Components:** 90+
- **Pages:** 30+

## 📝 Lisenssi

Proprietary - Kaikki oikeudet pidätetään.

---

**Rascal AI** - Tehokasta markkinointia ja myyntiä AI:n avulla 🚀
