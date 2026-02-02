import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const helpSections = [
    {
      id: 'getting-started',
      title: 'Aloitus',
      icon: 'rocket',
      content: [
        {
          title: 'Tervetuloa Rascal AI:hin!',
          description: 'Rascal AI on tekoälyavusteinen työkalu sosiaalisen median sisällön luomiseen ja hallintaan, puhelukampanjoihin ja lead scrapingiin. Tässä oppaassa opit käyttämään kaikkia ominaisuuksia.',
          tips: [
            'Ensimmäisellä kirjautumisella näkyy onboarding-modaali ICP-haastattelua varten',
            'Aloita Kojelauta-sivulta yleiskuvan saamiseksi',
            'Tutustu julkaisujen hallintaan Some-sivulla',
            'Käytä sisältöstrategiaa sisällön suunnitteluun',
            'Luo kampanjoita puhelujen hallintaan'
          ]
        },
        {
          title: 'Onboarding - ICP-haastattelu',
          description: 'Ensimmäisellä kirjautumisella näkyy automaattisesti onboarding-modaali, jossa voit suorittaa ICP (Ideal Customer Profile) haastattelun AI-assistentin kanssa.',
          steps: [
            'Kirjaudu sisään ensimmäisen kerran',
            'Onboarding-modaali aukeaa automaattisesti (vain owner-käyttäjille)',
            'Klikkaa "Aloita haastattelu" -painiketta',
            'Keskustele AI-assistentin kanssa ja vastaa kysymyksiin',
            'AI tallentaa ICP-tiedot automaattisesti',
            'Modaali sulkeutuu kun haastattelu on valmis'
          ],
          tips: [
            'Onboarding-modaali näkyy vain jos haastattelua ei ole suoritettu',
            'Kutsutut käyttäjät (member) eivät näe onboarding-modaalia',
            'Voit ohittaa onboardingin klikkaamalla "Ohita toistaiseksi"',
            'ICP-tiedot tallennetaan tietokantaan haastattelun jälkeen'
          ]
        }
      ]
    },
    {
      id: 'dashboard',
      title: 'Kojelauta',
      icon: 'dashboard',
      content: [
        {
          title: 'Kojelauta - Yleiskuva',
          description: 'Kojelauta-sivulla näet kaikki tärkeimmät tiedot yhdellä katsauksella.',
          features: [
            'Viimeisimmät julkaisut ja niiden tilat',
            'Tulevat julkaisut ja aikataulut',
            'Puheluiden sekä viestien kustannukset',
            'Vastattujen puheluiden prosenttimäärä',
            'Jos Google Analytics on yhdistetty, näet kävijämäärät'
          ]
        }
      ]
    },
    {
      id: 'posts',
      title: 'Julkaisut',
      icon: 'posts',
      content: [
        {
          title: 'Julkaisujen hallinta',
          description: 'Some-sivulla hallitset kaikkia sosiaalisen median julkaisujasi.',
          features: [
            'Luo ja muokkaa julkaisuja',
            'Aikatauluta julkaisut',
            'Hallitse julkaisujen tiloja (luonnos, aikataulutettu, julkaistu)',
            'Lisää kuvia ja videoita julkaisuihin'
          ]
        },
        {
          title: 'Julkaisun luominen',
          description: 'Uuden julkaisun luominen on yksinkertaista.',
          steps: [
            'Klikkaa "Generoi sisältö" -painiketta',
            'Kirjoita idean kuvaus',
            'Valitse kanavat, joille julkaisu generoidaan'
          ]
        },
        {
          title: 'Julkaisujen muokkaus',
          description: 'Voit muokata julkaisuja milloin tahansa.',
          tips: [
            'Klikkaa julkaisun nimeä avataksesi muokkausikkunan',
            'Muutokset tallennetaan automaattisesti',
            'Voit perua julkaisun aikataulun tai muuttaa sitä'
          ]
        }
      ]
    },
    {
      id: 'strategy',
      title: 'Sisältöstrategia',
      icon: 'strategy',
      content: [
        {
          title: 'Sisältöstrategia-sivu',
          description: 'Sisältöstrategia-sivulla hallitset yrityksesi perustietoja ja kuukausittaisia sisältösuunnitelmia. Sivu koostuu neljästä pääosasta: Yritysanalyysi, Kohderyhmä (ICP), Tavoitteet (KPI) ja TOV (Theory of Victory).',
          features: [
            'Yritysanalyysi: Kuvaus yrityksestäsi ja toimialastasi',
            'Kohderyhmä (ICP): Ideal Customer Profile -profiilit',
            'Tavoitteet (KPI): Yrityksesi tavoitteet',
            'TOV: Tone of voice -kuvaus',
            'Kuukausittaiset strategiat: Sisältösuunnitelmat kuukausittain'
          ]
        },
        {
          title: 'Tietojen muokkaus',
          description: 'Voit muokata kaikkia tietoja klikkaamalla "Muokkaa" -nappia kussakin kortissa.',
          steps: [
            'Klikkaa kortin "Muokkaa" -nappia',
            'Muokkaa tekstiä modaalissa',
            'Tallenna muutokset',
            'Tiedot tallennetaan automaattisesti tietokantaan'
          ],
          tips: [
            'ICP ja KPI tallennetaan rivinvaihdoilla eroteltuina listoina',
            'Yritysanalyysi ja TOV tallennetaan vapaana tekstinä',
            'Muutokset näkyvät välittömästi sivulla'
          ]
        },
        {
          title: 'Kuukausittaiset strategiat',
          description: 'Sisältöstrategia-sivulla näet kaikki kuukausittaiset strategiasi.',
          features: [
            'Strategiat näytetään kuukausittain',
            'Strategiat tallennetaan tietokantaan',
            'Jokainen strategia liittyy tiettyyn kuukauteen'
          ]
        }
      ]
    },
    {
      id: 'campaigns',
      title: 'Kampanjat',
      icon: 'calls',
      content: [
        {
          title: 'Kampanjoiden hallinta',
          description: 'Kampanjat-sivulla hallitset puhelukampanjoitasi. Kampanja on kokoelma puheluja, joilla on yhteiset asetukset ja tavoitteet.',
          features: [
            'Luo uusia kampanjoita',
            'Hallitse kampanjoiden tiloja (aktiivinen, pausetettu)',
            'Seuraa kampanjoiden tilastoja (puhelut, vastausprosentti, onnistuneet)',
            'Liitä kampanja massapuheluihin valinnaisesti'
          ]
        },
        {
          title: 'Kampanjan luominen',
          description: 'Uuden kampanjan luominen on yksinkertaista.',
          steps: [
            'Klikkaa "Luo kampanja" -painiketta',
            'Anna kampanjalle nimi ja kuvaus',
            'Valitse puhelun tyyppi (call_type)',
            'Tallenna kampanja'
          ],
          tips: [
            'Kampanja voidaan liittää massapuheluihin valinnaisesti',
            'Kampanjan tilastot päivittyvät automaattisesti puhelujen mukaan',
            'Voit pausettaa kampanjan milloin tahansa'
          ]
        },
        {
          title: 'Kampanjat ja puhelut',
          description: 'Kampanja voidaan liittää massapuheluihin, jolloin kaikki puhelut tallennetaan kyseiseen kampanjaan.',
          tips: [
            'Massapuheluissa voit valita kampanjan valinnaisesti',
            'Jos kampanja valitaan, kaikki puhelut liitetään siihen',
            'Kampanjan tilastot päivittyvät automaattisesti',
            'Yksittäiset puhelut eivät liity kampanjoihin'
          ]
        }
      ]
    },
    {
      id: 'lead-scraping',
      title: 'Liidit',
      icon: 'posts',
      content: [
        {
          title: 'Mikä on liidien haku?',
          description: 'Liidien haulla löydät potentiaalisia asiakkaitasi automaattisesti. Järjestelmä etsii yli 90 miljoonan ammattilaisen tietokannasta sopivia kontakteja ja kerää heidän yhteystietonsa.',
          features: [
            'Löydä liidejä LinkedIn-profiilien kautta (95%+ kattavuus)',
            'Sähköpostit löytyvät noin 70%:sta liideistä',
            'Puhelinnumerot löytyvät noin 10%:sta liideistä',
            'Tietokanta päivittyy viikoittain paremmalla kattavuudella'
          ]
        },
        {
          title: 'Miten haet liidejä?',
          description: 'Liidien haku aloitetaan hakukriteerien määrittämisellä. Voit suodattaa liidejä monilla eri kriteereillä löytääksesi juuri oikeat kontaktit.',
          steps: [
            'Määritä hakukriteerit: työnimike, sijainti, yritys, toimiala jne.',
            'Valitse kuinka monta liidiä haluat hakea',
            'Klikkaa "Aloita" -painiketta',
            'Järjestelmä etsii liidit automaattisesti taustalla',
            'Liidit näkyvät taulukossa kun ne on löydetty',
            'Voit tarkastella, viedä ja hallita löydettyjä liidejä'
          ],
          tips: [
            'Aloita laajemmilla hakuehdoilla ja kavenna tarvittaessa',
            'Valitse myös ne hakukriteerit mitä et halua löytyvän - voit sulkea pois tiettyjä työnimikkeitä, osastoja tai sijainteja',
            'Jos et löydä tuloksia, poista tiukkoja suodattimia',
            'Tarkista kirjoitusvirheet hakuehdoissa',
            'Järjestelmä muistaa edellisen haun ja jatkaa automaattisesti keskeytyneistä hauista',
            'Voit suodattaa liidejä myös tulosten mukaan (esim. vain ne joilla on sähköposti)'
          ]
        },
        {
          title: 'Mitä tietoja liideistä löytyy?',
          description: 'Jokaisesta löydetystä liidistä saat mahdollisimman paljon hyödyllistä tietoa. Tietojen saatavuus vaihtelee, mutta järjestelmä näyttää aina mitä tietoja on saatavilla.',
          features: [
            'Nimi ja työnimike',
            'Sähköpostiosoite (noin 70% kattavuus, vahvistettu merkintä mukana)',
            'Puhelinnumero (noin 10% kattavuus, kasvaa viikoittain)',
            'LinkedIn-profiili (lähes kaikista löytyy)',
            'Yrityksen tiedot: nimi, verkkosivut, toimiala, koko',
            'Sijaintitiedot: kaupunki, osavaltio, maa',
            'Asema yrityksessä: esim. johto, osastopäällikkö',
            'Toimialakohtaiset tiedot'
          ],
          tips: [
            'Puhelinnumeroiden kattavuus kasvaa jatkuvasti',
            'Jokainen sähköposti on merkitty vahvistetuksi tai vahvistamattomaksi',
            'LinkedIn-profiilit löytyvät lähes kaikista liideistä'
          ]
        },
        {
          title: 'Miten suodatat liidejä?',
          description: 'Voit suodattaa liidejä monilla eri kriteereillä löytääksesi juuri oikeat kontaktit. Suodattimet auttavat sinua kohdentamaan haun oikeisiin henkilöihin ja yrityksiin.',
          features: [
            'Henkilökohtaiset suodattimet: työnimike, asema yrityksessä, osasto, sijainti',
            'Yrityskohtaiset suodattimet: nimi, toimiala, koko, sijainti, verkkosivut',
            'Laadun suodattimet: vain vahvistetut sähköpostit, vain ne joilla on puhelin',
            'Hakusanat: etsi avainsanoilla yritysten nimistä, kuvauksista ja erikoisaloista',
            'Maksimimäärä: valitse kuinka monta liidiä haluat hakea'
          ],
          tips: [
            'Aloita laajemmilla hakuehdoilla - voit aina kaventaa myöhemmin',
            'Jos et löydä tuloksia, poista tiukkoja suodattimia',
            'Tarkista että hakuehdoissa ei ole kirjoitusvirheitä',
            'Kokeile eri yhdistelmiä hakuehtoja löytääksesi optimaalisen määrän liidejä'
          ]
        }
      ]
    },
    {
      id: 'calls',
      title: 'Puhelut',
      icon: 'calls',
      content: [
        {
          title: 'Puhelujen hallinta',
          description: 'Puhelut-sivulla on kaksi virtaa: Massapuhelut (Google Sheets) ja Yksittäinen puhelu.',
          features: [
            'Massapuhelut: kolmivaiheinen modaali (Sheets → Tyyppi & ääni → Aloita/Ajastus)',
            'Ajastus: kellonajat aina 00 tai 30 (HH:MM/HH:MM:SS)',
            'Yksittäinen puhelu: nappi avaa modaalin (Tyyppi & ääni → Nimi & numero → Soita)',
            'Kampanjan liittäminen: Massapuheluissa voit valita kampanjan valinnaisesti',
            'Numeron normalisointi: 40 → 040 → +35840…, 00358/358 → +358…'           
          ]
        },
        {
          title: 'Massapuhelut (Google Sheets)',
          description: 'Aloita massapuhelut -nappi avaa modaalin, jossa etenet kolmessa vaiheessa.',
          steps: [
            'Vaihe 1 – Google Sheets: liitä julkinen Sheets-linkki ja suorita validointi. Puhelin- ja sähköpostisarakkeet tunnistetaan automaattisesti.',
            'Vaihe 2 – Asetukset: valitse puhelun tyyppi, ääni ja kampanja (valinnainen). Skripti päivittyy tyypin mukaan.',
            'Vaihe 3 – Käynnistys: valitse "Aloita heti" tai "Ajasta puhelut". Ajastus käyttää päivämäärää ja kellonaikaa (minuutit 00/30).'
          ],
          tips: [
            'Jos kampanja valitaan, kaikki puhelut liitetään siihen',
            'SMS-viestit voidaan lähettää ennen puhelua, puhelun jälkeen tai vastaamattomien jälkeen'
          ]
        },
        {
          title: 'Yksittäinen puhelu',
          description: 'Kortissa on nappi "Soita yksittäinen puhelu", joka avaa modaalin.',
          steps: [
            'Vaihe 1 – Asetukset: valitse puhelun tyyppi ja ääni.',
            'Vaihe 2 – Tiedot: syötä nimi ja puhelinnumero, ja käynnistä puhelu.'
          ],
          tips: [
            'Numero normalisoidaan aina +358-muotoon: 50 → 050 → +35850…',
            'Kaksoispisteellinen aika (HH:MM tai HH:MM:SS) tallentuu tietokantaan.',
            'Yksittäiset puhelut eivät liity kampanjoihin'
          ]
        }
      ]
    },
    {
      id: 'ai-chat',
      title: 'AI Assistentti',
      icon: 'ai',
      content: [
        {
          title: 'AI Assistentti',
          description: 'AI Assistentti on henkilökohtainen avustajasi sisällön luomisessa ja markkinointiin.',
          features: [
            'Kysy neuvoja sisällön luomiseen',
            'Pyydä apua markkinointistrategioihin',
            'Käytä AI:ta sisältöideoiden generointiin',
            'Saa henkilökohtaista tukea projekteihisi'
          ]
        },
        {
          title: 'Parhaat käytännöt',
          description: 'Saat parhaat tulokset AI Assistentista seuraavilla vinkillä.',
          tips: [
            'Ole selkeä ja tarkka kysymyksissäsi',
            'Anna kontekstia brändistäsi ja kohderyhmästäsi',
            'Käytä AI:n vastauksia inspiraationa, ei valmiina sisältönä',
            'Kysy jatkokysymyksiä tarkentaaaksesi vastauksia'
          ]
        }
      ]
    },
    {
      id: 'settings',
      title: 'Asetukset',
      icon: 'settings',
      content: [
        {
          title: 'Tilin asetukset',
          description: 'Asetukset-sivulla voit hallita tilisi tietoja ja asetuksia.',
          features: [
            'Muuta henkilökohtaisia tietojasi',
            'Hallitse salasanasi',
            'Hallitse ilmoituksia',
            'Hallitset sosiaalisen median kanavat',
            'Yhdistä Rascal AI omiin paveluihin (WordPress, Google Analytics)'
          ]
        },
        {
          title: 'Tietoturva',
          description: 'Tietoturva on tärkeää.',
          tips: [
            'Käytä vahvaa salasanaa',
            'Päivitä salasanasi säännöllisesti',
            'Älä jaa kirjautumistietojasi muille',
            'Kirjaudu ulos kun et käytä sovellusta'
          ]
        }
      ]
    },
    {
      id: 'faq',
      title: 'Usein kysytyt kysymykset',
      icon: 'faq',
      content: [
        {
          title: 'Miten voin perua julkaisun?',
          description: 'Voit perua julkaisun sen aikataulun muuttamalla tai poistamalla sen kokonaan.',
          answer: 'Mene Posts-sivulle, etsi julkaisu ja klikkaa sen nimeä. Muokkausikkunassa voit muuttaa julkaisupäivää tai poistaa julkaisun kokonaan.'
        },
        {
          title: 'Miten voin lisätä kuvia julkaisuun?',
          description: 'Kuvien lisääminen on helppoa.',
          answer: 'Voit lisätä ja vaihtaa kuvia Some-sivulla julkaisua muokatessa.'
        },
        {
          title: 'Mikä on sisältöstrategia?',
          description: 'Sisältöstrategia auttaa sinua suunnittelemaan sisältösi.',
          answer: 'Sisältöstrategia-sivulla hallitset neljää pääosaa: Yritysanalyysi (yrityksesi kuvaus), Kohderyhmä/ICP (Ideal Customer Profile -profiilit), Tavoitteet/KPI (yrityksesi tavoitteet) ja TOV (Tone of voice). Lisäksi voit muokata kuukausittaisia sisältösuunnitelmia.'
        },
        {
          title: 'Miten kampanja liittyy puheluihin?',
          description: 'Kampanja on kokoelma puheluja, joilla on yhteiset asetukset.',
          answer: 'Kampanja voidaan liittää massapuheluihin valinnaisesti. Jos kampanja valitaan massapuheluissa, kaikki puhelut tallennetaan kyseiseen kampanjaan. Kampanjan tilastot (puhelut, vastausprosentti, onnistuneet) päivittyvät automaattisesti puhelujen mukaan.'
        },
        {
          title: 'Miten liidit toimii?',
          description: 'Liidit-toiminto hakee potentiaalisia asiakkaita automaattisesti.',
          answer: 'Liidien etsintä aloitetaan asettamalla hakufiltterit (sähköposti, työnimike, sijainti, jne.) ja maksimimäärä. Järjestelmä lähettää pyynnön, joka etsii liidit ja tallentaa ne tietokantaan. Liidit näkyvät taulukossa kun ne on löydetty. Liidit myös pisteytetään automaattisesti, jos ostajapersoona on määritelty.'
        },
        {
          title: 'Miten AI Assistentti toimii?',
          description: 'AI Assistentti on tekoälyavusteinen chat-työkalu.',
          answer: 'AI Assistentti käyttää tekoälyä vastatakseen kysymyksiisi ja auttaakseen sinua sisällön luomisessa. Se oppii brändistäsi ja tarpeistasi käytön myötä.'
        }
      ]
    }
  ]

export default function HelpPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeSection, setActiveSection] = useState('getting-started')

  // Lue URL-hash ja aseta aktiivinen osio
  useEffect(() => {
    if (location.hash) {
      const sectionId = location.hash.replace('#', '')
      // Tarkista että osio on olemassa
      const sectionExists = helpSections.some(section => section.id === sectionId)
      if (sectionExists) {
        setActiveSection(sectionId)
      }
    }
  }, [location.hash])

  const currentSection = helpSections.find(section => section.id === activeSection)

  return (
    <div className="help-container">
      <div className="help-header">
        <h2 className="text-[32px] font-extrabold text-gray-800 m-0">Help Center</h2>
      </div>
      <div className="help-content">
        {/* Sidebar */}
        <div className="help-sidebar">
          <h3>Sisältö</h3>
          <nav>
            {helpSections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`help-nav-button ${activeSection === section.id ? 'active' : ''}`}
              >
                <span className="help-section-icon">
                  {section.icon === 'rocket' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M13.13 22.19l-1.63-3.26c-.13-.26-.39-.42-.68-.42H9.5c-.29 0-.55.16-.68.42l-1.63 3.26c-.13.26-.13.58 0 .84.13.26.39.42.68.42h1.32c.29 0 .55-.16.68-.42l.32-.64.32.64c.13.26.39.42.68.42h1.32c.29 0 .55-.16.68-.42.13-.26.13-.58 0-.84zM5.09 19H7v-1.5H5.09c-.29 0-.55.16-.68.42l-1.63 3.26c-.13.26-.13.58 0 .84.13.26.39.42.68.42H7v-1.5H5.09c-.29 0-.55-.16-.68-.42l-1.63-3.26c-.13-.26-.13-.58 0-.84.13-.26.39-.42.68-.42zM16.91 19H15v-1.5h1.91c.29 0 .55.16.68.42l1.63 3.26c.13.26.13.58 0 .84-.13.26-.39.42-.68.42H15v1.5h1.91c.29 0 .55-.16.68-.42l1.63-3.26c.13-.26.13-.58 0-.84-.13-.26-.39-.42-.68-.42z"/>
                      <path d="M12 2L2 12h3v8h6v-8h3L12 2z"/>
                    </svg>
                  )}
                  {section.icon === 'dashboard' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                    </svg>
                  )}
                  {section.icon === 'posts' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8V4h5v4h3v10z"/>
                    </svg>
                  )}
                  {section.icon === 'strategy' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  )}
                  {section.icon === 'calls' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                    </svg>
                  )}
                  {section.icon === 'ai' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  )}
                  {section.icon === 'settings' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                    </svg>
                  )}
                  {section.icon === 'faq' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h2v-2h-2v2zm0-8h2V6h-2v2z"/>
                    </svg>
                  )}
                </span>
                {section.title}
              </button>
            ))}
          </nav>
        </div>

        {/* Main content */}
        <div className="help-main-content">
          {currentSection && (
            <>
              <div className="help-section-header">
                <h1 className="help-section-title">
                  <span className="help-section-icon">
                    {currentSection.icon === 'rocket' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13.13 22.19l-1.63-3.26c-.13-.26-.39-.42-.68-.42H9.5c-.29 0-.55.16-.68.42l-1.63 3.26c-.13.26-.13.58 0 .84.13.26.39.42.68.42h1.32c.29 0 .55-.16.68-.42l.32-.64.32.64c.13.26.39.42.68.42h1.32c.29 0 .55-.16.68-.42.13-.26.13-.58 0-.84zM5.09 19H7v-1.5H5.09c-.29 0-.55.16-.68.42l-1.63 3.26c-.13.26-.13.58 0 .84.13.26.39.42.68.42H7v-1.5H5.09c-.29 0-.55-.16-.68-.42l-1.63-3.26c-.13-.26-.13-.58 0-.84.13-.26.39-.42.68-.42zM16.91 19H15v-1.5h1.91c.29 0 .55.16.68.42l1.63 3.26c.13.26.13.58 0 .84-.13.26-.39.42-.68.42H15v1.5h1.91c.29 0 .55-.16.68-.42l1.63-3.26c.13-.26.13-.58 0-.84-.13-.26-.39-.42-.68-.42z"/>
                        <path d="M12 2L2 12h3v8h6v-8h3L12 2z"/>
                      </svg>
                    )}
                    {currentSection.icon === 'dashboard' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                      </svg>
                    )}
                    {currentSection.icon === 'posts' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8V4h5v4h3v10z"/>
                      </svg>
                    )}
                    {currentSection.icon === 'strategy' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    )}
                    {currentSection.icon === 'calls' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                      </svg>
                    )}
                    {currentSection.icon === 'ai' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                    )}
                    {currentSection.icon === 'settings' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                      </svg>
                    )}
                    {currentSection.icon === 'faq' && (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h2v-2h-2v2zm0-8h2V6h-2v2z"/>
                      </svg>
                    )}
                  </span>
                  {currentSection.title}
                </h1>
              </div>

              <div className="flex flex-col gap-10">
                {currentSection.content.map((item, index) => (
                  <div key={index} className="help-content-item">
                    <h2 className="help-content-title">
                      {item.title}
                    </h2>
                    
                    <p className="help-content-description">
                      {item.description}
                    </p>

                    {item.features && (
                      <div className="mb-5">
                        <h3 className="m-0 mb-3 text-lg font-semibold text-gray-700">
                          Ominaisuudet:
                        </h3>
                        <ul className="help-features-list">
                          {item.features.map((feature, idx) => (
                            <li key={idx}>{feature}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {item.tips && (
                      <div className="mb-5">
                        <h3 className="m-0 mb-3 text-lg font-semibold text-gray-700">
                          Vinkkejä:
                        </h3>
                        <ul className="help-tips-list">
                          {item.tips.map((tip, idx) => (
                            <li key={idx}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {item.steps && (
                      <div className="mb-5">
                        <h3 className="m-0 mb-3 text-lg font-semibold text-gray-700">
                          Vaiheet:
                        </h3>
                        <ol className="help-steps-list">
                          {item.steps.map((step, idx) => (
                            <li key={idx}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {item.answer && (
                      <div className="help-answer-box">
                        <p className="help-answer-text">
                          {item.answer}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="help-cta">
        <h2>Tarvitsetko lisäapua?</h2>
        <p>Jos et löydä vastausta kysymykseesi täältä, ota yhteyttä tukeemme.</p>
        <button
          onClick={() => navigate('/ai-chat')}
          className="help-cta-button primary"
        >
          Kysy AI Assistentilta
        </button>
        <button
          onClick={() => window.open('mailto:info@rascalcompany.fi', '_blank')}
          className="help-cta-button secondary"
        >
          Ota yhteyttä
        </button>
      </div>
    </div>
  )
} 