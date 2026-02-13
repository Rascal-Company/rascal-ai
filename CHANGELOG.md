# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.122.0](https://github.com/slemppa/rascal-ai/compare/v1.120.2...v1.122.0) (2026-02-13)


### 🐛 Bug Fixes

* **posts:** harden mobile responsiveness and calendar layout ([12856d0](https://github.com/slemppa/rascal-ai/commit/12856d027a05b88695f2f87e6ad30af5a1a23a82))


### 🔧 Chores

* **release:** 1.121.0 ([67ac475](https://github.com/slemppa/rascal-ai/commit/67ac475bb532382204d74d35816796f7646050da))


### ✨ Features

* **chat:** replace polling with ReadableStream streaming ([0403681](https://github.com/slemppa/rascal-ai/commit/04036819bcbec920c0a4cda74c32d038df110732))
* **leads:** revamp lead scraping UI and add buyer persona ([509dc09](https://github.com/slemppa/rascal-ai/commit/509dc095958d070516b7979b8c590a08af21931d))
* **posts:** add back-to-drafts action for ready posts ([945eb4e](https://github.com/slemppa/rascal-ai/commit/945eb4ed37ced598e74d95eff9ae186125fe6ad0))

## [1.121.0](https://github.com/slemppa/rascal-ai/compare/v1.120.2...v1.121.0) (2026-02-13)


### ✨ Features

* **chat:** replace polling with ReadableStream streaming ([708b169](https://github.com/slemppa/rascal-ai/commit/708b1697327ad0401eaee27f506b13bc6b8fc556))

### [1.120.2](https://github.com/slemppa/rascal-ai/compare/v1.120.1...v1.120.2) (2026-02-13)


### ⚠ BREAKING CHANGES

* **integrations:** Requires NANGO_SECRET_KEY environment variable

### 🔧 Chores

* trigger deployment ([7c68e1a](https://github.com/slemppa/rascal-ai/commit/7c68e1a2a1e290fafda0f77de8ff707d5498f32c))
* trigger deployment ([cef858a](https://github.com/slemppa/rascal-ai/commit/cef858a0dc77cff66dc5857ce1587f1f976e19bf))


### ♻️ Code Refactoring

* **api:** reorganize test files to fix Vercel build limit ([bbbbad3](https://github.com/slemppa/rascal-ai/commit/bbbbad32018dc4f1d12741cf2c6e0b7820873c7b))
* **carousel:** save segment approvals directly to Supabase ([294a22d](https://github.com/slemppa/rascal-ai/commit/294a22d9ab7b485761bc5bc233e7b77cdfe0fc6f))
* continue Tailwind migration ([54671b3](https://github.com/slemppa/rascal-ai/commit/54671b38234d0f576a45d892e65a33c52a5e57f8))
* convert inline styles to Tailwind in more components ([9651b15](https://github.com/slemppa/rascal-ai/commit/9651b153841ff3dd2c1229df4ad7b3b992e41d7f))
* convert OnboardingModal to Tailwind CSS ([26d8ff8](https://github.com/slemppa/rascal-ai/commit/26d8ff8640aa10edb0e4fc68379d829cbf134955))
* **leads:** improve search filters UX and localization ([22f93de](https://github.com/slemppa/rascal-ai/commit/22f93de0e55d05e51c01b8f5bd804e6f300ea442))
* **ManagePostsPage:** remove debug logs and disable avatar fetch ([e8681d6](https://github.com/slemppa/rascal-ai/commit/e8681d63804d8b8ba8bac8c93b2b29f3b7a02d1f))
* migrate CSS to Tailwind utility classes ([06b9265](https://github.com/slemppa/rascal-ai/commit/06b9265eddd7a62eae3b528af7a84a64b187046b))
* **settings:** remove steps from social media instructions ([6c8cfa9](https://github.com/slemppa/rascal-ai/commit/6c8cfa90a14b5e4d188472a1c88249ef9b6feb82))
* **ui:** convert kanban columns to tabs and fix companyId payload ([f63838f](https://github.com/slemppa/rascal-ai/commit/f63838f40c0ab7e5136577bd1561cd2aa58cd581))


### 🐛 Bug Fixes

* add userId to all generate-ideas API calls ([9e7be07](https://github.com/slemppa/rascal-ai/commit/9e7be07656157d55d91acb580e4b351368c20d67))
* **ai-chat:** migrate from Zep to n8n_chat_histories and fix UI bugs ([bf308c1](https://github.com/slemppa/rascal-ai/commit/bf308c17aad82d5b8d6c8ea56846b41c9f2b5110))
* **api:** ensure onboarding webhook sends for all organization roles ([9d57aed](https://github.com/slemppa/rascal-ai/commit/9d57aed0825681585c96e4e2ec1798f282135e3d))
* **api:** pass userId through generate-ideas handler to N8N webhook ([3e45da9](https://github.com/slemppa/rascal-ai/commit/3e45da92563976915a23a06eefa366a901fe9b52))
* **calls:** close modal after saving call type ([7121d64](https://github.com/slemppa/rascal-ai/commit/7121d64aaf5c6843350fa2011e9dcb468b274201))
* **calls:** prevent duplicate records when editing call types ([7988bf8](https://github.com/slemppa/rascal-ai/commit/7988bf8b779a4cde15ea03d6b2fcff026f72c7c0))
* **calls:** prevent React error when PDF upload fails with object error ([5e6018b](https://github.com/slemppa/rascal-ai/commit/5e6018bf7fbc11cdbf318aa51695bbc30cdf0989)), closes [#31](https://github.com/slemppa/rascal-ai/issues/31)
* **deploy:** include api/_lib and api/_middleware in deployments ([2ca1cff](https://github.com/slemppa/rascal-ai/commit/2ca1cffcca8fd49627baa0659e28b57214ff4375))
* **deploy:** include api/_lib directory in Vercel deployments ([d9ba6f4](https://github.com/slemppa/rascal-ai/commit/d9ba6f41e9997d90323fd727c9f82cf5dbb21dee))
* **features:** add system role check for moderators in FeaturesTab ([2367445](https://github.com/slemppa/rascal-ai/commit/2367445fd18e83bebc72f995934c39b6ce497447))
* **features:** enable onboarding toggle for admin users ([cc932db](https://github.com/slemppa/rascal-ai/commit/cc932db8889c70d24a772cfd6358dbf594cbca30))
* filter raw JSON in chat, add auto-reload, fix session ([189751d](https://github.com/slemppa/rascal-ai/commit/189751df6e59944745539c2437a7bbc02d15dd82))
* **i18n:** add missing translation keys ([0947cdb](https://github.com/slemppa/rascal-ai/commit/0947cdbcebb5060babd90c9227c9a70bad9b1e81))
* **i18n:** update Finnish Tone of Voice label ([bc06c2a](https://github.com/slemppa/rascal-ai/commit/bc06c2a57852821cce3303d7afc49b59276a38d7))
* **monitoring:** paranna navigaationappien selkeyttä ([80d0ad3](https://github.com/slemppa/rascal-ai/commit/80d0ad3cbd97366e54be94a0eb393b4aecccb01e))
* **nango:** handle auth webhook with operation=creation ([7c9383a](https://github.com/slemppa/rascal-ai/commit/7c9383af00a6e7aefd19b326c37bff94632402ee))
* **nango:** make webhook signature verification non-blocking ([b4d12ac](https://github.com/slemppa/rascal-ai/commit/b4d12acf3aaa7680870aa5b191c6d2911cca4eb1))
* **placid:** improve editor contrast and persist state ([b19da1a](https://github.com/slemppa/rascal-ai/commit/b19da1a0c1819807d6869bd1b0de9d5765a5fa28))
* remove api/_middleware from .vercelignore to fix module not found errors ([749b597](https://github.com/slemppa/rascal-ai/commit/749b5971a0260b567c59562682247daea3333425))
* **settings:** remove button background override ([606f6cd](https://github.com/slemppa/rascal-ai/commit/606f6cde3150a91302778d85cee3393611624c1e))
* **strategy:** improve modal responsiveness and make approval resilient ([14bb29b](https://github.com/slemppa/rascal-ai/commit/14bb29b0c3700f92c4c3a84193489ac1bd001f1b))
* **strategy:** korjaa minimoitu nappi näkyviin vahvistuksen jälkeen ([b6df830](https://github.com/slemppa/rascal-ai/commit/b6df8302b7e86a997b9f3315b6e0778c2ff29411))
* **ui:** filter canceled users and add missing i18n keys for blog modals ([3c571d3](https://github.com/slemppa/rascal-ai/commit/3c571d3a3967345f72d7538dfad7a7adbcba1627))
* **ui:** improve mobile responsiveness and fix preview modal ([c823f93](https://github.com/slemppa/rascal-ai/commit/c823f93f543d5199107813bbaaf5cb4068204ce3))


### ✨ Features

* add carousel segment approval workflow ([9281348](https://github.com/slemppa/rascal-ai/commit/9281348fb24fb909ce568f3f8c5eb2596a5e337b))
* **analytics:** add GA4 tracking with SPA route change support ([0f063b9](https://github.com/slemppa/rascal-ai/commit/0f063b91b5cba3e7cf4bdfbd70b3cd9fed762917))
* **calendar:** add time grid and enhanced drag-and-drop scheduling ([847e082](https://github.com/slemppa/rascal-ai/commit/847e0827cef9f7a7035fa225a6606e7341d23403))
* **calls:** add international phone number support for mass calls ([41a7447](https://github.com/slemppa/rascal-ai/commit/41a7447fd95a166c6e75b48e10e56cb86d50a80f))
* **calls:** add international phone number support for single calls ([1517e41](https://github.com/slemppa/rascal-ai/commit/1517e4103349ce3f45ea00ce5bc903001cbadb2d))
* **calls:** implement client-side file upload to bypass API limits ([e0a75f9](https://github.com/slemppa/rascal-ai/commit/e0a75f9d99e8659cdb08d9b07c7bba921d48c36f))
* improve org member selection to handle multiple memberships ([637795f](https://github.com/slemppa/rascal-ai/commit/637795f8b8a35f8aee57d1c5067ed7e93faa1fc0))
* improve org member selection to handle multiple memberships ([a1f965c](https://github.com/slemppa/rascal-ai/commit/a1f965c931ed52c4709e03761ed069cda75c3d60))
* **integrations:** add beta badges to Google Ads and Meta Ads ([7981830](https://github.com/slemppa/rascal-ai/commit/7981830e3095c3cf2a6d3580c7ea947439312b9a))
* **integrations:** implement Nango backend-initiated OAuth flow ([5b48d29](https://github.com/slemppa/rascal-ai/commit/5b48d292a9aabe1e2124bbc463641db36b379cca))
* **lead-scraping:** add max results slider and migrate to i18n keys ([ff935e2](https://github.com/slemppa/rascal-ai/commit/ff935e20cc47c5a13c14a4a9e49000e928226a57))
* **leads:** add saved searches, enrichment UI, and CSV export ([aa9a141](https://github.com/slemppa/rascal-ai/commit/aa9a1419b0c05f4a77f9d8969f627bd558f3a1b4))
* **mail:** add Rascal Mail button to sidebar ([9d76405](https://github.com/slemppa/rascal-ai/commit/9d764056d88f73b423132b567155b034afd60e48))
* **mail:** add Rascal Mail to mobile nav and use rascalai.fi domain ([1c229bc](https://github.com/slemppa/rascal-ai/commit/1c229bcbeb50381b4886e300eee001ba69a857bf))
* merge Tailwind migration branch to main ([e0e2ed5](https://github.com/slemppa/rascal-ai/commit/e0e2ed5b39e3aacfce04d3cc69df2a2cde518046))
* **nps:** implement monthly NPS survey modal ([1b62a7e](https://github.com/slemppa/rascal-ai/commit/1b62a7ecbd81067f1b045ccf868f6549cfab326d))
* **organization:** allow owners to modify owner roles ([32373e5](https://github.com/slemppa/rascal-ai/commit/32373e5c5f97875ee19dbd461a37858de47f4cd7))
* **placid:** allow moderators to access Placid templates ([40d7927](https://github.com/slemppa/rascal-ai/commit/40d7927965ce46bc7fb5c29481e8a0aaef35178c))
* **settings:** add instructions link to social media connection ([22d41f7](https://github.com/slemppa/rascal-ai/commit/22d41f7e73e32abde119f72c540a55eb0704600a))
* **sidebar:** replace account manager with admin handoff ([6ec4e3a](https://github.com/slemppa/rascal-ai/commit/6ec4e3a1db19348f31766904bf87910627c907c3))
* **strategy:** restore TOV help button and reduce NPS snooze ([1b79e9e](https://github.com/slemppa/rascal-ai/commit/1b79e9ee2d849700d93b552d8c457e2a9d1350ee))


### 📚 Documentation

* add Vercel dev server instructions and onboarding guide ([3ba963e](https://github.com/slemppa/rascal-ai/commit/3ba963e0e2f7bf6b37f9cad3fbffe6a05e2cc1e7))
* add version bump rules to QGIT and fix Git section formatting ([b7847d5](https://github.com/slemppa/rascal-ai/commit/b7847d583454ee6e2945cf5bc9ef2f65aa5c09b9))
* update README to reflect current architecture and features ([8a566f1](https://github.com/slemppa/rascal-ai/commit/8a566f1311253c6cce3279353d2a7656a7f1e04f))

### [1.120.1](https://github.com/slemppa/rascal-ai/compare/v1.120.0...v1.120.1) (2026-01-23)


### 🔧 Chores

* päivitä login-photo.png ([45c4b62](https://github.com/slemppa/rascal-ai/commit/45c4b62c345312b64a89ccd149d845823a6a960b))


### ✨ Features

* lisää postauksen monistus-toiminnallisuus ([3c31679](https://github.com/slemppa/rascal-ai/commit/3c3167964fe3208b700be127b7b15df885100be9))
* lisää superadmin-rooli ja päivitä roolihierarkia ([36f598e](https://github.com/slemppa/rascal-ai/commit/36f598e505a3f4cfcb510a8403f2b1859625e995))
* lisää toast-vahvistus modaalien sulkemiseen ([671f044](https://github.com/slemppa/rascal-ai/commit/671f044f4fd018e2b8c27c47b9652c2b7a7039ba))
* poista scatter- ja heatmap-kaaviot dashboardilta ([3205151](https://github.com/slemppa/rascal-ai/commit/3205151719886c07a66745e5046be73a40d66968))
* päivitä sivustorakentaja URL ja siirrä ympäristömuuttujaan ([93d0922](https://github.com/slemppa/rascal-ai/commit/93d09222619b052fbbf27805bd141b9547013c87))


### 🐛 Bug Fixes

* **auth:** lisää superadmin-tuki ja korjaa käyttöoikeudet ([d635a79](https://github.com/slemppa/rascal-ai/commit/d635a7966ca2a3af8b163380c6752a331047c493))
* **kanban:** korjaa drag & drop -toiminnallisuuden ongelmat ([dc410f2](https://github.com/slemppa/rascal-ai/commit/dc410f20e27bb6ab4028d38347e29ee3bde68492))
* korjaa duplikaatti-tallennus puhelutyyppien modaaleissa ([8e46444](https://github.com/slemppa/rascal-ai/commit/8e464446b849a845827fa4c829f3ef10026a0fcd))
* korjaa modal restore, blog-julkaisu ja feature-gating ([85577e2](https://github.com/slemppa/rascal-ai/commit/85577e2826ceff860ebd2c36c708045f621b7e1a))
* korjaa sivustorakentaja URL ja ohjauslogiikka ([c475e91](https://github.com/slemppa/rascal-ai/commit/c475e91e870b018899617d5247921413f61322d2))
* OpenBuilderButton.jsx fix ([db127e8](https://github.com/slemppa/rascal-ai/commit/db127e87a998af5bad6ab50b9d48a83003882cf6))
* **permissions:** salli moderaattoreiden pääsy account-manageriin ([300230c](https://github.com/slemppa/rascal-ai/commit/300230c60399c061f7b540cf7f3302ccbac788cd))
* translation issues in calls module ([b12e9bc](https://github.com/slemppa/rascal-ai/commit/b12e9bc03a8cea1f9c4ac3f66aa9c9142597df48))
* **ui:** korjaa minimoidut modalit etteivät mene päällekkäin ([f481b16](https://github.com/slemppa/rascal-ai/commit/f481b165a96685abf57f508139679c5df5c9689c))
* **ui:** poista login-kuvan hover-efekti ([0bf0f0e](https://github.com/slemppa/rascal-ai/commit/0bf0f0ec6fd430703b9dc1ecaa9636a766166f48))
* **ui:** poista Manage call types -kuvaus /calls-sivulta ([d895574](https://github.com/slemppa/rascal-ai/commit/d8955747b04bd7a90a87ca9df9c309d5ed5039b8))

## [1.120.0](https://github.com/slemppa/rascal-ai/compare/v1.119.1...v1.120.0) (2026-01-19)


### ✨ Features

* lisää Sivustorakentaja-sivuun sidebar-linkki ja feature toggle ([74ba73a](https://github.com/slemppa/rascal-ai/commit/74ba73a1417cb6546ae5bea49c746de1964eb826))
* piilota drag & drop member-roolilta ja lisää infoviesti ([99e9d4e](https://github.com/slemppa/rascal-ai/commit/99e9d4e042f89c4220d50b3f7258fa3de672aca2))

### [1.119.1](https://github.com/slemppa/rascal-ai/compare/v1.114.0...v1.119.1) (2026-01-18)


### ✨ Features

* add media monitoring feature with Miniflux integration ([7e23bc7](https://github.com/slemppa/rascal-ai/commit/7e23bc7c48a6712b4fcc3d87024a3a4394e8854a))
* mediaseuranta - feedien hallinta, lajittelu ja päivitys ([36061a2](https://github.com/slemppa/rascal-ai/commit/36061a28e2cb9c9edb6c2397dacc312e04df6e9a))


### 🔧 Chores

* **release:** 1.115.0 ([c615590](https://github.com/slemppa/rascal-ai/commit/c6155900c8872a6d146847e7dc5b94f3c96bd916))
* **release:** 1.117.0 ([610e9b4](https://github.com/slemppa/rascal-ai/commit/610e9b4ea93fbe858b203a96e50dbfcf6d95cecd))
* **release:** 1.118.0 ([1b47396](https://github.com/slemppa/rascal-ai/commit/1b473963f681fbd1c6c6941505c2890631e6c1e8))
* **release:** 1.119.0 ([b7b81da](https://github.com/slemppa/rascal-ai/commit/b7b81da73aa70af90a2625f3a85676ecf0a4769d))


### 🐛 Bug Fixes

* korjaa kuvan poisto/korvaus KeskenModalissa ([ec69266](https://github.com/slemppa/rascal-ai/commit/ec692663f5b424c230c5f7493fd63f85d99c816d))

## [1.119.0](https://github.com/slemppa/rascal-ai/compare/v1.114.0...v1.119.0) (2026-01-18)


### ✨ Features

* add media monitoring feature with Miniflux integration ([7e23bc7](https://github.com/slemppa/rascal-ai/commit/7e23bc7c48a6712b4fcc3d87024a3a4394e8854a))
* mediaseuranta - feedien hallinta, lajittelu ja päivitys ([36061a2](https://github.com/slemppa/rascal-ai/commit/36061a28e2cb9c9edb6c2397dacc312e04df6e9a))


### 🔧 Chores

* **release:** 1.115.0 ([c615590](https://github.com/slemppa/rascal-ai/commit/c6155900c8872a6d146847e7dc5b94f3c96bd916))
* **release:** 1.117.0 ([610e9b4](https://github.com/slemppa/rascal-ai/commit/610e9b4ea93fbe858b203a96e50dbfcf6d95cecd))
* **release:** 1.118.0 ([1b47396](https://github.com/slemppa/rascal-ai/commit/1b473963f681fbd1c6c6941505c2890631e6c1e8))

## [1.118.0](https://github.com/slemppa/rascal-ai/compare/v1.114.0...v1.118.0) (2026-01-18)


### ✨ Features

* add media monitoring feature with Miniflux integration ([7e23bc7](https://github.com/slemppa/rascal-ai/commit/7e23bc7c48a6712b4fcc3d87024a3a4394e8854a))
* mediaseuranta - feedien hallinta, lajittelu ja päivitys ([36061a2](https://github.com/slemppa/rascal-ai/commit/36061a28e2cb9c9edb6c2397dacc312e04df6e9a))


### 🔧 Chores

* **release:** 1.115.0 ([c615590](https://github.com/slemppa/rascal-ai/commit/c6155900c8872a6d146847e7dc5b94f3c96bd916))
* **release:** 1.117.0 ([610e9b4](https://github.com/slemppa/rascal-ai/commit/610e9b4ea93fbe858b203a96e50dbfcf6d95cecd))

## [1.117.0](https://github.com/slemppa/rascal-ai/compare/v1.114.0...v1.117.0) (2026-01-18)


### 🔧 Chores

* **release:** 1.115.0 ([c615590](https://github.com/slemppa/rascal-ai/commit/c6155900c8872a6d146847e7dc5b94f3c96bd916))


### ✨ Features

* add media monitoring feature with Miniflux integration ([7e23bc7](https://github.com/slemppa/rascal-ai/commit/7e23bc7c48a6712b4fcc3d87024a3a4394e8854a))
* mediaseuranta - feedien hallinta, lajittelu ja päivitys ([36061a2](https://github.com/slemppa/rascal-ai/commit/36061a28e2cb9c9edb6c2397dacc312e04df6e9a))

## [1.116.0](https://github.com/slemppa/rascal-ai/compare/v1.114.0...v1.116.0) (2026-01-18)


### ✨ Features

* add media monitoring feature with Miniflux integration ([7e23bc7](https://github.com/slemppa/rascal-ai/commit/7e23bc7c48a6712b4fcc3d87024a3a4394e8854a))


### 🔧 Chores

* **release:** 1.115.0 ([c615590](https://github.com/slemppa/rascal-ai/commit/c6155900c8872a6d146847e7dc5b94f3c96bd916))

## [1.115.0](https://github.com/slemppa/rascal-ai/compare/v1.114.0...v1.115.0) (2026-01-16)


### ✨ Features

* add media monitoring feature with Miniflux integration ([7e23bc7](https://github.com/slemppa/rascal-ai/commit/7e23bc7c48a6712b4fcc3d87024a3a4394e8854a))

## [1.114.0](https://github.com/slemppa/rascal-ai/compare/v1.113.3...v1.114.0) (2026-01-16)


### ✨ Features

* track plugin download ([ae21342](https://github.com/slemppa/rascal-ai/commit/ae21342e96e1506e55b8ef3613a5454290c12c20))

### [1.113.3](https://github.com/slemppa/rascal-ai/compare/v1.113.2...v1.113.3) (2026-01-16)


### 🐛 Bug Fixes

* correct api _lib import paths ([9970df8](https://github.com/slemppa/rascal-ai/commit/9970df8a010c34ce86747076c719dc539cf9912b))
* handle missing Supabase envs in secrets endpoints ([55c5207](https://github.com/slemppa/rascal-ai/commit/55c5207b8702b4b544df5127b490032a69a18363))
* send GA webhook via HMAC client ([7238408](https://github.com/slemppa/rascal-ai/commit/7238408aa183fb22fd8fddb9e46a4047bf4cfd2f))
* update settings integrations actions ([94bbcca](https://github.com/slemppa/rascal-ai/commit/94bbcca7bd796508cbda32831730282550551bf2))

### [1.113.2](https://github.com/slemppa/rascal-ai/compare/v1.113.1...v1.113.2) (2026-01-15)


### 🐛 Bug Fixes

* siivoa kovakoodatut UI-tekstit i18n-avaimiksi ([94eb70a](https://github.com/slemppa/rascal-ai/commit/94eb70acad3973e969745f5344daf956d7b54d58))


### ✨ Features

* **calls:** lisää tietokanta-modaali ja knowledge base -endpointit ([ea9006f](https://github.com/slemppa/rascal-ai/commit/ea9006f2b2d93cd2e24a92b3768524ef08a526c2))

### [1.113.1](https://github.com/slemppa/rascal-ai/compare/v1.113.0...v1.113.1) (2026-01-14)


### 🐛 Bug Fixes

* korjaa käännösavaimet ja poista placeholder ([2258ddd](https://github.com/slemppa/rascal-ai/commit/2258dddc6c93dd9f3db46437d272a7d53190d09a))

## [1.113.0](https://github.com/slemppa/rascal-ai/compare/v1.112.2...v1.113.0) (2026-01-14)


### ✨ Features

* poista roolitarkistukset ja korjaa käännösavaimet ([6900d4c](https://github.com/slemppa/rascal-ai/commit/6900d4ccee74095aaac46be186a633b170569c2b))

### [1.112.2](https://github.com/slemppa/rascal-ai/compare/v1.112.1...v1.112.2) (2026-01-14)


### 🐛 Bug Fixes

* lisää Authorization header onboarding webhook-kutsuun ([3494022](https://github.com/slemppa/rascal-ai/commit/349402251c02137e5b9b0be616a3c68a15c427a8))

### [1.112.1](https://github.com/slemppa/rascal-ai/compare/v1.112.0...v1.112.1) (2026-01-14)


### 🐛 Bug Fixes

* **auth:** prevent duplicate fetchUserProfile calls ([3fecdb6](https://github.com/slemppa/rascal-ai/commit/3fecdb6c682e16973a4f2a33e5e927a7c23b35ed))
* **auth:** set profileLoaded when fetchUserProfile times out ([f905fba](https://github.com/slemppa/rascal-ai/commit/f905fba40ca96981e75f3bb0bfd6456dc154278c))
* **i18n:** add missing translations for OrganizationMembersPage ([e6c1a45](https://github.com/slemppa/rascal-ai/commit/e6c1a45d5e5f439bf8bd041d60b2e2968d6ed345))
* korjaa admin-roolin some tilejä ja paranna timeout-käsittely ([17fb79f](https://github.com/slemppa/rascal-ai/commit/17fb79f049bae5ade445a9ad11d2ae6a5bfc4ed2))
* **onboarding:** use onConnect callback to capture conversationId ([a1d957a](https://github.com/slemppa/rascal-ai/commit/a1d957a2fdec4dd48bc663684988899edf49054d))

## [1.112.0](https://github.com/slemppa/rascal-ai/compare/v1.111.5...v1.112.0) (2026-01-11)


### ♻️ Code Refactoring

* move content language to Account Settings section ([7f78058](https://github.com/slemppa/rascal-ai/commit/7f780583337a634b09d992fbbff9106bd7e07c85))


### 🐛 Bug Fixes

* improve textarea auto-resize reliability ([0b1c42f](https://github.com/slemppa/rascal-ai/commit/0b1c42f5a1323c5def4c96decd091fb8d1a773bf))
* reduce textarea min-height to 60px for proper auto-grow ([34d454f](https://github.com/slemppa/rascal-ai/commit/34d454f8a7b2e01f0ff6af52b78eae48f0cf6c32))
* remove duplicate CSS selector and use overflow:auto ([2337f0e](https://github.com/slemppa/rascal-ai/commit/2337f0e48e7699ad647c3411667156ae8ef07db1))
* remove max-height:32px that locked textarea to one row ([1a721d0](https://github.com/slemppa/rascal-ai/commit/1a721d0df43a72cbf63ce5724da7ae15db0f59f1))
* set textarea height to 0 before measuring scrollHeight ([44fbf9c](https://github.com/slemppa/rascal-ai/commit/44fbf9c6ec517c8663993fbb890dbd67f9954669))
* use useLayoutEffect for reliable textarea auto-resize ([f7a4692](https://github.com/slemppa/rascal-ai/commit/f7a46921ca678fd21fb4dd430e836d979a8092df))


### ✨ Features

* add content language setting for generated posts ([9d409b2](https://github.com/slemppa/rascal-ai/commit/9d409b2137726e685c87e19983b5b9fda5c37c31))
* add test infrastructure and refactor hooks ([9f76c33](https://github.com/slemppa/rascal-ai/commit/9f76c33fba5dbd4906119fbcc0a1b8d40fd2948f))

### [1.111.5](https://github.com/slemppa/rascal-ai/compare/v1.111.4...v1.111.5) (2026-01-09)


### 🐛 Bug Fixes

* Correct dashboard published content count and monthly quota display ([70df42c](https://github.com/slemppa/rascal-ai/commit/70df42c894afdb531bb3b5342911b5d8a8193dc3))
* korjaa strategian etsintä käyttämään target_month-kenttää ([041c582](https://github.com/slemppa/rascal-ai/commit/041c58238096942d6ac3fd98a3a4b9fac7adba62))
* Resolve race condition in DashboardPage API calls ([ab744ff](https://github.com/slemppa/rascal-ai/commit/ab744ff1e186e89ab88432b62eea942507094a07))
* Use strategy_id based counting with year validation ([b971eaa](https://github.com/slemppa/rascal-ai/commit/b971eaace9955de7dad3fb0ae241b4d6a0d627b0))

### [1.111.4](https://github.com/slemppa/rascal-ai/compare/v1.111.3...v1.111.4) (2026-01-09)


### ✨ Features

* Improve carousel editing and optimize login performance ([dac3631](https://github.com/slemppa/rascal-ai/commit/dac36319975d06fcd9d146b8130a7345df09d378))

### [1.111.3](https://github.com/slemppa/rascal-ai/compare/v1.111.2...v1.111.3) (2026-01-09)


### 🐛 Bug Fixes

* Mixpost API endpoint and remove debug logs ([9455b4a](https://github.com/slemppa/rascal-ai/commit/9455b4a9151983b0d3e9beb97bb2b2d0e2391efe))


### ✨ Features

* Add calendar view selector and fix post types ([875044d](https://github.com/slemppa/rascal-ai/commit/875044d4c5259242280a21f75924a82568f21bd7))

### [1.111.2](https://github.com/slemppa/rascal-ai/compare/v1.111.0...v1.111.2) (2026-01-09)


### 🐛 Bug Fixes

* korjaa mobiilinavigaatio ja dashboard overflow-ongelmat ([e1c9cc6](https://github.com/slemppa/rascal-ai/commit/e1c9cc610aa53e2ec9b1d3e824d191b67aa75c3f))

### [1.111.1](https://github.com/slemppa/rascal-ai/compare/v1.111.0...v1.111.1) (2026-01-09)

## [1.111.0](https://github.com/slemppa/rascal-ai/compare/v1.110.7...v1.111.0) (2026-01-09)


### 📚 Documentation

* **root:** add comprehensive CLAUDE.md documentation for AI assistants ([81f6053](https://github.com/slemppa/rascal-ai/commit/81f6053ced12f37e2f2bdfe32f251401033984be))


### 🐛 Bug Fixes

* **KeskenModal:** korjaa kuvan valinta dropdown-valikon näkyvyys ([5273fa1](https://github.com/slemppa/rascal-ai/commit/5273fa195729231836ca12d60d6d59e6ee326517))
* **mobile:** korjaa mobiilivalikko ja hamburger-nappi ([919b6f9](https://github.com/slemppa/rascal-ai/commit/919b6f99b4a93b3ca83f001de55af0b0b2523bbc)), closes [#24170](https://github.com/slemppa/rascal-ai/issues/24170) [#cea78](https://github.com/slemppa/rascal-ai/issues/cea78)
* **mobile:** korjaa mobiilivalikko ja responsiivisuus ([4b08649](https://github.com/slemppa/rascal-ai/commit/4b08649334516c0b3ccabf0f840e9fec38a3361d)), closes [#24170](https://github.com/slemppa/rascal-ai/issues/24170) [#cea78](https://github.com/slemppa/rascal-ai/issues/cea78) [#362317](https://github.com/slemppa/rascal-ai/issues/362317) [#ff6600](https://github.com/slemppa/rascal-ai/issues/ff6600)
* **mobile:** korjaa mobiilivalikon värit ja poista konfliktit ([4eef3cd](https://github.com/slemppa/rascal-ai/commit/4eef3cd9428cf6abd17ec4c9f921aea2fc8f28b8)), closes [#24170](https://github.com/slemppa/rascal-ai/issues/24170) [#22c55](https://github.com/slemppa/rascal-ai/issues/22c55) [#ff6600](https://github.com/slemppa/rascal-ai/issues/ff6600) [#362317](https://github.com/slemppa/rascal-ai/issues/362317)


### ✨ Features

* **i18n:** korjaa kaikki jäljellä olevat kovakoodatut tekstit käyttämään käännöksiä ([988b03a](https://github.com/slemppa/rascal-ai/commit/988b03ab01d6389386466800cc7498d7d0104f7c))
* **i18n:** lisää puuttuvat käännösavaimet ja korjaa kovakoodatut tekstit ([a1c6d8f](https://github.com/slemppa/rascal-ai/commit/a1c6d8f2196d77b7c7f800628910753237261a39))

### [1.110.7](https://github.com/slemppa/rascal-ai/compare/v1.110.6...v1.110.7) (2026-01-08)


### 🐛 Bug Fixes

* **KeskenModal:** korjaa kuvan valinta ja valikon näkyvyys ([74a13c9](https://github.com/slemppa/rascal-ai/commit/74a13c996b3e94e2b7d44be211efed4c4ba59248))

### [1.110.6](https://github.com/slemppa/rascal-ai/compare/v1.110.5...v1.110.6) (2026-01-07)


### 🐛 Bug Fixes

* **PostCard:** update translation keys for buttons ([6ef2189](https://github.com/slemppa/rascal-ai/commit/6ef2189244064eada1673e1af68402fa181b0517))

### [1.110.5](https://github.com/slemppa/rascal-ai/compare/v1.110.4...v1.110.5) (2026-01-07)


### 🐛 Bug Fixes

* **auth:** optimize session updates and useFeatures hook ([9046172](https://github.com/slemppa/rascal-ai/commit/90461720f1e50ea8a575d32223c322043443fea2))

### [1.110.4](https://github.com/slemppa/rascal-ai/compare/v1.110.3...v1.110.4) (2026-01-07)


### 🐛 Bug Fixes

* apply user provided fixes for AuthContext, Sidebar and locales ([9fc67da](https://github.com/slemppa/rascal-ai/commit/9fc67dabd4f05f9f57b9d1e8e79879ba19368cac))

### [1.110.3](https://github.com/slemppa/rascal-ai/compare/v1.110.2...v1.110.3) (2026-01-07)


### 🐛 Bug Fixes

* optimize AuthContext and fix MobileNavigation visibility ([7b167dd](https://github.com/slemppa/rascal-ai/commit/7b167ddf24d8179bd8e0dee8ba37ee1f0920f9af))

### [1.110.2](https://github.com/slemppa/rascal-ai/compare/v1.110.1...v1.110.2) (2026-01-07)


### 🐛 Bug Fixes

* **dashboard:** use translations in social media analytics component ([7791863](https://github.com/slemppa/rascal-ai/commit/77918638f8b97b737ab7dde5c51a722a15353a7f))

### [1.110.1](https://github.com/slemppa/rascal-ai/compare/v1.110.0...v1.110.1) (2026-01-07)


### 🐛 Bug Fixes

* **dashboard:** fix social analytics, add filters and rm unused metric ([1916322](https://github.com/slemppa/rascal-ai/commit/1916322957854075ad9794fe2cb19cc0b66c0f59))

## [1.110.0](https://github.com/slemppa/rascal-ai/compare/v1.109.1...v1.110.0) (2026-01-05)


### ✨ Features

* global toast system, placid improvements & logo UI ([97afe82](https://github.com/slemppa/rascal-ai/commit/97afe8254f98e351049726703b430008149a0b65))

### [1.109.1](https://github.com/slemppa/rascal-ai/compare/v1.109.0...v1.109.1) (2026-01-05)


### 🐛 Bug Fixes

* korjaa roolitarkistukset ja poista turhat API-kutsut ([309acbf](https://github.com/slemppa/rascal-ai/commit/309acbf55cbd9902b47a1009e4f1d87702a4ba6f))

## [1.109.0](https://github.com/slemppa/rascal-ai/compare/v1.108.0...v1.109.0) (2026-01-05)


### ✨ Features

* admin-tarkistukset ja Placid Editor integraatio ([996d62a](https://github.com/slemppa/rascal-ai/commit/996d62af3bc024863db495319cb5c5dcd7b48add))


### 🐛 Bug Fixes

* erota System Role ja Organization Role AuthContextissa ([769ff0d](https://github.com/slemppa/rascal-ai/commit/769ff0d47884f4527059780663cc7453a30f15e1))
* korjaa kirjautumisen jumittuminen ja erottele roolit ([7ad9c04](https://github.com/slemppa/rascal-ai/commit/7ad9c04025c3ef05a74c125ffd3321b6afe82acc))
* korjattu kirjautumisen jumittuminen ([7d6cc56](https://github.com/slemppa/rascal-ai/commit/7d6cc56dcd2e1dfc33647206b62f1959af318729))

## [1.108.0](https://github.com/slemppa/rascal-ai/compare/v1.107.7...v1.108.0) (2026-01-03)


### ♻️ Code Refactoring

* paranna asetukset-sivun korttien asettelua ja tyylejä ([e20c831](https://github.com/slemppa/rascal-ai/commit/e20c83108ecb944e9653a8279cec4a7ff26f8507))


### ✨ Features

* **posts:** add image bank selection to edit modal ([e03abd0](https://github.com/slemppa/rascal-ai/commit/e03abd0a8fef170459637e67ecf4eac683d55947))

### [1.107.7](https://github.com/slemppa/rascal-ai/compare/v1.107.5...v1.107.7) (2026-01-02)

### [1.107.6](https://github.com/slemppa/rascal-ai/compare/v1.107.5...v1.107.6) (2026-01-02)

### [1.107.5](https://github.com/slemppa/rascal-ai/compare/v1.107.4...v1.107.5) (2025-12-29)


### 🐛 Bug Fixes

* korjaa sometilien haku posts-sivulla ([802fb9b](https://github.com/slemppa/rascal-ai/commit/802fb9b952d8e6eec3be21faa2be5d68fb7f2f2f))

### [1.107.4](https://github.com/slemppa/rascal-ai/compare/v1.107.3...v1.107.4) (2025-12-23)


### 🐛 Bug Fixes

* korjaa CallDetailModal supabase-import ja PostCard className ([dbbcb0e](https://github.com/slemppa/rascal-ai/commit/dbbcb0e86d2420d70b7b5400463c61249261ab3a))

### [1.107.3](https://github.com/slemppa/rascal-ai/compare/v1.107.2...v1.107.3) (2025-12-22)


### 🔧 Chores

* korjaa CORS-asetukset ja lisää rate limiting ([3d405f2](https://github.com/slemppa/rascal-ai/commit/3d405f21d42a7195b81513db2980ca4c4d0ddddc))

### [1.107.2](https://github.com/slemppa/rascal-ai/compare/v1.107.1...v1.107.2) (2025-12-22)


### 🔧 Chores

* lisää HTTP security headerit ja poista turhat tiedostot ([1fd2040](https://github.com/slemppa/rascal-ai/commit/1fd2040b6193c6fcee46f970b611c1bed5868e2e))

### [1.107.1](https://github.com/slemppa/rascal-ai/compare/v1.107.0...v1.107.1) (2025-12-22)


### 🔧 Chores

* remove debug logging from HMAC endpoints ([1bd4fa5](https://github.com/slemppa/rascal-ai/commit/1bd4fa5535c3346a5e34aa1d47084a877cc8b1a7))


### 📚 Documentation

* päivitä N8N endpointtien HMAC-migraation analyysi ([27ff1f1](https://github.com/slemppa/rascal-ai/commit/27ff1f12fdcc5e988d2f9b619898514d8bde75a6))

## [1.107.0](https://github.com/slemppa/rascal-ai/compare/v1.105.0...v1.107.0) (2025-12-22)


### 🔧 Chores

* poista duplikaattitiedostot joissa välilyönti ([92f2212](https://github.com/slemppa/rascal-ai/commit/92f2212840e81634656e623034e87eab2287e297))


### 🐛 Bug Fixes

* korjaa strategian hyväksyntätoiminnallisuus ([ba19fe9](https://github.com/slemppa/rascal-ai/commit/ba19fe9dcf59f245b61e7236242537f78b9c0501))
* security vulnerabilities - SQL injection and XSS risks ([08eca32](https://github.com/slemppa/rascal-ai/commit/08eca324ac129a6df6d27bf1151f000bda6405b0))
* tallenna UGC-formData localStorageen ja korjaa auth-virhe ([5e1469d](https://github.com/slemppa/rascal-ai/commit/5e1469de4f62a7e69355651de771dd94d522aa48))


### ✨ Features

* add HMAC validation to priority 1 N8N endpoints ([6a2bc8e](https://github.com/slemppa/rascal-ai/commit/6a2bc8e1afb31984a65053ae142c750fe2bf4e67))
* lisää WordPress-yhteyden testaus ja HMAC ([9a9e690](https://github.com/slemppa/rascal-ai/commit/9a9e6906ccb41803d8d6248daa7996fece4d82bf))
* lisätty HMAC-allekirjoitus N8N-integraatioihin ([8b7df59](https://github.com/slemppa/rascal-ai/commit/8b7df59483ec42d733ed72d458cacb7bbac24ee3))
* päivitä blog-newsletter ja lisää ohjelinkki ([be99dce](https://github.com/slemppa/rascal-ai/commit/be99dce739f73bde52ca9356d5fd5a4063b6e2ee))
* päivitetty feed_supabase käyttämään HMAC-allekirjoitusta ([1ad03d8](https://github.com/slemppa/rascal-ai/commit/1ad03d8abf1496a70ec97426c7377f2c248ca0db))

## [1.106.0](https://github.com/slemppa/rascal-ai/compare/v1.105.0...v1.106.0) (2025-12-22)


### 🔧 Chores

* poista duplikaattitiedostot joissa välilyönti ([92f2212](https://github.com/slemppa/rascal-ai/commit/92f2212840e81634656e623034e87eab2287e297))


### ✨ Features

* lisää WordPress-yhteyden testaus ja HMAC ([9a9e690](https://github.com/slemppa/rascal-ai/commit/9a9e6906ccb41803d8d6248daa7996fece4d82bf))
* lisätty HMAC-allekirjoitus N8N-integraatioihin ([8b7df59](https://github.com/slemppa/rascal-ai/commit/8b7df59483ec42d733ed72d458cacb7bbac24ee3))
* päivitä blog-newsletter ja lisää ohjelinkki ([be99dce](https://github.com/slemppa/rascal-ai/commit/be99dce739f73bde52ca9356d5fd5a4063b6e2ee))
* päivitetty feed_supabase käyttämään HMAC-allekirjoitusta ([1ad03d8](https://github.com/slemppa/rascal-ai/commit/1ad03d8abf1496a70ec97426c7377f2c248ca0db))


### 🐛 Bug Fixes

* korjaa strategian hyväksyntätoiminnallisuus ([ba19fe9](https://github.com/slemppa/rascal-ai/commit/ba19fe9dcf59f245b61e7236242537f78b9c0501))
* security vulnerabilities - SQL injection and XSS risks ([08eca32](https://github.com/slemppa/rascal-ai/commit/08eca324ac129a6df6d27bf1151f000bda6405b0))
* tallenna UGC-formData localStorageen ja korjaa auth-virhe ([5e1469d](https://github.com/slemppa/rascal-ai/commit/5e1469de4f62a7e69355651de771dd94d522aa48))

## [1.105.0](https://github.com/slemppa/rascal-ai/compare/v1.104.0...v1.105.0) (2025-12-17)


### 📚 Documentation

* päivitä liidien ohjeet help-sivulle ja lisää linkki ([ee134d9](https://github.com/slemppa/rascal-ai/commit/ee134d91d27c008e9fd42eb64983597066636932))


### 🔧 Chores

* align API paths and knowledge endpoints ([8db266a](https://github.com/slemppa/rascal-ai/commit/8db266a292be65b747d1932c12e7534d6a42b87b))
* finalize mixpost & knowledge cleanup ([d461200](https://github.com/slemppa/rascal-ai/commit/d4612004c296dca78a6cfeb04d59447c78658392))
* harden n8n webhooks & api CORS ([f8fe494](https://github.com/slemppa/rascal-ai/commit/f8fe49455134d3905b7d8ddc36583e15d145af6b))
* harden secrets, oauth, and mixpost proxy ([5acbe07](https://github.com/slemppa/rascal-ai/commit/5acbe07d221b51db156dda7e0f316339a6096acb))
* poista arkistotiedosto ([68af20d](https://github.com/slemppa/rascal-ai/commit/68af20d5eaa39898f78503ffdef39731fd315326))


### 🐛 Bug Fixes

* improve secret lookup with better trimming and debug logging ([e6ec6ff](https://github.com/slemppa/rascal-ai/commit/e6ec6ff12c9c5067f521e05ef10a14e232343f72))
* make global admin/mod see admin views ([0a882f7](https://github.com/slemppa/rascal-ai/commit/0a882f742a05ec73d1f622d19f5a758cd3f0f458))
* replace direct Supabase user calls with secure API ([7d869c1](https://github.com/slemppa/rascal-ai/commit/7d869c1494a15421a505a5ca1e38cdf9db66e38b))
* secure storage delete and inbound webhook ([8fe7178](https://github.com/slemppa/rascal-ai/commit/8fe71781d26b2e6c556b6e444b88b58fd2d9fcc1))
* **security:** enforce RLS and auth checks in api ([f96b0cc](https://github.com/slemppa/rascal-ai/commit/f96b0ccc3b0976718dbc4f9b3825d848428df61e))


### ✨ Features

* lisätty käyttäjien lista account manager -sivulle ([c6b55f3](https://github.com/slemppa/rascal-ai/commit/c6b55f353c3f4907f8ce968327b2da348c2a1e5d))
* merge security hardening and Node.js encryption refactor ([7673e29](https://github.com/slemppa/rascal-ai/commit/7673e29e0c49a66558ae0b1e9cfc5ccbedf94f34))
* **ugc:** lisätty Kuva/Video valinta ja toast-notifikaatiot ([43f7cb4](https://github.com/slemppa/rascal-ai/commit/43f7cb44b18056e43007ddc9ed69ad643cff4af8))
* **ugc:** lisätty visuaalinen tyyli ja kuvan muoto valinnat ([3d5a7f4](https://github.com/slemppa/rascal-ai/commit/3d5a7f4c62450001165e0bda76e1250597d17c33))


### ♻️ Code Refactoring

* **api:** migrate to RESTful resource-based architecture ([403c632](https://github.com/slemppa/rascal-ai/commit/403c632dc939b9653f25a68aefc4ee9f3c8ac96f))
* finalize api folder structure ([a74f99e](https://github.com/slemppa/rascal-ai/commit/a74f99e4d51cff55e990d2952e9a066e8ccf32f3))
* move dev knowledge endpoints under storage/knowledge ([8c0286f](https://github.com/slemppa/rascal-ai/commit/8c0286f70d296c9c5c3833a402e2f64b9894447c))
* move encryption to Node.js layer, remove RPC dependency ([96e3e79](https://github.com/slemppa/rascal-ai/commit/96e3e790167accd540180fc1d7ad4f4b1765b8ff))
* organize API structure and improve security ([fccfbb5](https://github.com/slemppa/rascal-ai/commit/fccfbb5bd552ede1629b648614dea6ec832cd10b))
* poista kovakoodatut ID:t ja optimoi dashboard ([4e1bf6b](https://github.com/slemppa/rascal-ai/commit/4e1bf6b1268446d3b25caa79cf9ac299518c9730))
* refaktoroitu KanbanTab komponentiksi, lisätty paginointi ([3f45226](https://github.com/slemppa/rascal-ai/commit/3f4522618f1b5df5d7c4c077b66788657128defb))
* viimeistele API-kansiorakenne ([6c113c4](https://github.com/slemppa/rascal-ai/commit/6c113c41a82393af59e775c419039ed1af365a72))

## [1.104.0](https://github.com/slemppa/rascal-ai/compare/v1.103.0...v1.104.0) (2025-12-10)


### ✨ Features

* lisää checkbox-valinta ja poisto lead-scraping taulukkoon ([4c3728c](https://github.com/slemppa/rascal-ai/commit/4c3728ccdb804f0c7f9566976c9cb04b289848b2))

## [1.103.0](https://github.com/slemppa/rascal-ai/compare/v1.102.2...v1.103.0) (2025-12-09)


### 🔧 Chores

* remove Node.js engines field, use Vercel default ([f60755f](https://github.com/slemppa/rascal-ai/commit/f60755f1a5433c1f005353ae2a6ae59424e64460))


### 📚 Documentation

* add comprehensive i18n audit report ([9d5d213](https://github.com/slemppa/rascal-ai/commit/9d5d2132154edd16aad22941ea25e2e3c324a9c0))


### 🐛 Bug Fixes

* allow admin users without org_members entry ([efa0086](https://github.com/slemppa/rascal-ai/commit/efa0086adaf0d22198a1042c9de1c1e317c98c1e))
* fetch all user fields for admin users in middleware ([3fcb6b0](https://github.com/slemppa/rascal-ai/commit/3fcb6b0d3d6857a829e1bb6f91a4e0581369b6c0))
* korjaa Alustat-osio käyttämään admin-data endpointia ([06949bf](https://github.com/slemppa/rascal-ai/commit/06949bfb7f69e789ed56ac33f8e935f8086b6977))
* lisää Äänensävy ja tyyli -kenttä vaiheeseen 2 call type modaaleissa ([c90bb13](https://github.com/slemppa/rascal-ai/commit/c90bb1373603f2545687235133fdc05a2459ee81))
* lisää tila-kenttä puhelutyyppeihin ja korjaa äänen valinta ([3fc5f64](https://github.com/slemppa/rascal-ai/commit/3fc5f643be504747fcbcf7c7606833db4995a9c2))
* palauta Yhteenveto-vaihe vaiheeseen 4 modaaleissa ([81df092](https://github.com/slemppa/rascal-ai/commit/81df092ee471eb221c0065ad9c939adbada44051))
* paranna modaalien placeholderit, spacing ja peruuta-nappi ([6ffba41](https://github.com/slemppa/rascal-ai/commit/6ffba41f0514c7dda4b2621bc7ec1adaaf27e2b6))


### ✨ Features

* add platforms management to account manager features tab ([3337113](https://github.com/slemppa/rascal-ai/commit/333711341baa0173df16ca0acc34ed00ce3f930b))
* lisää Action-kenttä ja ohjetekstit call type modaaleihin ([78f2476](https://github.com/slemppa/rascal-ai/commit/78f2476f9542af7c35c3ae11c176b4ac108994ae))
* lisää kalenterinäkymään aikataulutusominaisuus ([4a900b0](https://github.com/slemppa/rascal-ai/commit/4a900b0d27c360969809a229fb3c8b757f2a62f7))
* päivitä lead-scraping taulukko ([01fe67e](https://github.com/slemppa/rascal-ai/commit/01fe67ef76db471ee89f27d5658a2a93520f7226))
* paranna UGC-tabin näkymä kortteina ja tallenna aktiivinen tab ([3f091f2](https://github.com/slemppa/rascal-ai/commit/3f091f21b62db460bd479db47fdabc165ab138fb))

### [1.102.2](https://github.com/slemppa/rascal-ai/compare/v1.102.1...v1.102.2) (2025-12-04)


### 🐛 Bug Fixes

* update React 19.2.1 & deps for security (CVE-2025-55182) ([beeb31d](https://github.com/slemppa/rascal-ai/commit/beeb31daff22c571fcda621eee1a5b6dc2c75f39))

### [1.102.1](https://github.com/slemppa/rascal-ai/compare/v1.102.0...v1.102.1) (2025-12-04)


### 🐛 Bug Fixes

* close both modals when TOV analysis starts ([d977c3e](https://github.com/slemppa/rascal-ai/commit/d977c3ea19cc11055b4d527fd6e7c3f14b9d4fd5))

## [1.102.0](https://github.com/slemppa/rascal-ai/compare/v1.101.1...v1.102.0) (2025-12-04)


### 🔧 Chores

* remove debug logs from features update code ([7d9dce1](https://github.com/slemppa/rascal-ai/commit/7d9dce19c568ce9dab8055e740beeb65d66806b2))


### 🐛 Bug Fixes

* improve features update handling in AccountDetailsPage ([d092367](https://github.com/slemppa/rascal-ai/commit/d092367193a5791a5838415c83bf5079f94b8ce5))
* korjattu organisaatiotuki kaikissa API-endpointeissa ([899edd6](https://github.com/slemppa/rascal-ai/commit/899edd653028e901170afa818a40c843fcde8203))


### ✨ Features

* add TOV analysis with social media URL input ([c649d27](https://github.com/slemppa/rascal-ai/commit/c649d27695104f29d5f606f4505fe0eff8e95326))
* add UGC tab with feature flag and component refactor ([c9e1ad8](https://github.com/slemppa/rascal-ai/commit/c9e1ad8d066a4d61d993f31588587d0b781cffe2))
* lisää Integraatiot-välilehti asiakastilien tietosivulle ([ddcd2a1](https://github.com/slemppa/rascal-ai/commit/ddcd2a1a93f7ba6221a5e87d39cd2c2621a34063))
* päivitä call type modaalit - lisää kentät ja paranna UI ([74993c9](https://github.com/slemppa/rascal-ai/commit/74993c922d57a337dc171a54548723a825e8a55d))

### [1.101.1](https://github.com/slemppa/rascal-ai/compare/v1.101.0...v1.101.1) (2025-12-01)


### 🐛 Bug Fixes

* korjaa integraation poisto ja lisää webhook-ilmoitus ([703da57](https://github.com/slemppa/rascal-ai/commit/703da5732e2aa61c7affcb6c4edd0babcc50aec6))

## [1.101.0](https://github.com/slemppa/rascal-ai/compare/v1.100.0...v1.101.0) (2025-12-01)


### ✨ Features

* lisää Beta-tagit WordPress ja Google Analytics -integraatioihin ([2e73c8c](https://github.com/slemppa/rascal-ai/commit/2e73c8c9a5f90a936884a18e2bb4370df67bd480))

## [1.100.0](https://github.com/slemppa/rascal-ai/compare/v1.99.7...v1.100.0) (2025-12-01)


### 🐛 Bug Fixes

* onboarding modal improvements ([9716086](https://github.com/slemppa/rascal-ai/commit/97160861121a0161b9ee260e5cec7c2d845963e1))


### ✨ Features

* lisää tiedostomuotovalidaatio AI-chatin tietokantaan ([6e984a1](https://github.com/slemppa/rascal-ai/commit/6e984a10ddf2d2236d6f1e570a4a68bd885a2091))

### [1.99.7](https://github.com/slemppa/rascal-ai/compare/v1.99.6...v1.99.7) (2025-11-28)


### 🐛 Bug Fixes

* korjattu onboarding modal logiikka org_users käyttäjille ([7e5b13c](https://github.com/slemppa/rascal-ai/commit/7e5b13cf56ac2847eed6ad1731b33a672ac324f1))

### [1.99.6](https://github.com/slemppa/rascal-ai/compare/v1.99.5...v1.99.6) (2025-11-28)


### 🐛 Bug Fixes

* korjattu onboarding webhook user_id UUID-ongelma ([fe8ff54](https://github.com/slemppa/rascal-ai/commit/fe8ff5403be7e1dcdc1365e0fc6108ecc006d65a))

### [1.99.5](https://github.com/slemppa/rascal-ai/compare/v1.99.4...v1.99.5) (2025-11-28)


### 🐛 Bug Fixes

* parannettu onboarding webhook virheenkäsittely ([40bc34e](https://github.com/slemppa/rascal-ai/commit/40bc34e4dc7ccc9fa78189aa9606a1dbdaee1832))

### [1.99.4](https://github.com/slemppa/rascal-ai/compare/v1.99.3...v1.99.4) (2025-11-28)


### 🐛 Bug Fixes

* onboarding modal näkyvyys ja webhook korjaukset ([4459f13](https://github.com/slemppa/rascal-ai/commit/4459f138b9985b464f3ae814b7622843038d2f74))

### [1.99.3](https://github.com/slemppa/rascal-ai/compare/v1.99.2...v1.99.3) (2025-11-28)


### 🐛 Bug Fixes

* replace VITE_ env vars with backend vars in API ([aea2e18](https://github.com/slemppa/rascal-ai/commit/aea2e182a1a363cafa79ed860f066dc185aa56b6))

### [1.99.2](https://github.com/slemppa/rascal-ai/compare/v1.99.1...v1.99.2) (2025-11-28)


### 🐛 Bug Fixes

* korjaa userData-riippuvuudet AIChatPage:ssa ([343840c](https://github.com/slemppa/rascal-ai/commit/343840c8d0452c53b4679f41a011aa67a5d33ece))

### [1.99.1](https://github.com/slemppa/rascal-ai/compare/v1.99.0...v1.99.1) (2025-11-28)


### 🐛 Bug Fixes

* korjaa tiedostojen lisääminen ja chatti org ID:llä ([bfb22e7](https://github.com/slemppa/rascal-ai/commit/bfb22e71e17a060f9d65a5b6a212769984faa34d))

## [1.99.0](https://github.com/slemppa/rascal-ai/compare/v1.98.2...v1.99.0) (2025-11-28)


### ✨ Features

* lisätty blog-publish endpoint erilliselle N8N webhookille ([d738110](https://github.com/slemppa/rascal-ai/commit/d7381101d140238e3dad9daff8ab9fdc63780775))

### [1.98.2](https://github.com/slemppa/rascal-ai/compare/v1.98.1...v1.98.2) (2025-11-27)


### 📚 Documentation

* päivitetty README ja lisätty WordPress-ohjeet ([2aaa240](https://github.com/slemppa/rascal-ai/commit/2aaa240d1903c6a0b7fdc33b84f1cbb95cb9b604))

### [1.98.1](https://github.com/slemppa/rascal-ai/compare/v1.98.0...v1.98.1) (2025-11-27)


### 🐛 Bug Fixes

* korjattu tabien täriseminen /calls-sivulla ([4ae854d](https://github.com/slemppa/rascal-ai/commit/4ae854d21819040083ebd69296b480757637b066))

## [1.98.0](https://github.com/slemppa/rascal-ai/compare/v1.97.0...v1.98.0) (2025-11-27)


### ✨ Features

* lisätty Sivuston kävijät -kortit dashboardiin ([258561a](https://github.com/slemppa/rascal-ai/commit/258561a59f7c5e398a5ff856d989eb7ae72ecf37))

## [1.97.0](https://github.com/slemppa/rascal-ai/compare/v1.95.1...v1.97.0) (2025-11-26)


### ✨ Features

* vaihda Toiminnot-sarake Soittoyritykset-sarakkeeksi ([041bfba](https://github.com/slemppa/rascal-ai/commit/041bfba5dcecac95dc4214512e08d22603727276))


### 🔧 Chores

* **release:** 1.96.0 ([e2da460](https://github.com/slemppa/rascal-ai/commit/e2da460dbbc45ab3a55027e4ff191ed142b6bf7f))

## [1.96.0](https://github.com/slemppa/rascal-ai/compare/v1.95.0...v1.96.0) (2025-11-26)


### 🐛 Bug Fixes

* korjaa kampanjan tilastojen laskenta ja vastausprosentti ([ba61977](https://github.com/slemppa/rascal-ai/commit/ba61977dacd3ed78bd15095fca8d1114aa9e641f))


### ✨ Features

* vaihda Toiminnot-sarake Soittoyritykset-sarakkeeksi ([447a0c2](https://github.com/slemppa/rascal-ai/commit/447a0c2b4877b234aa588fa76403e2433abd5fe9))

### [1.95.2](https://github.com/slemppa/rascal-ai/compare/v1.95.1...v1.95.2) (2025-11-26)

### [1.95.1](https://github.com/slemppa/rascal-ai/compare/v1.95.0...v1.95.1) (2025-11-26)


### 🐛 Bug Fixes

* korjaa kampanjan tilastojen laskenta ja vastausprosentti ([ba61977](https://github.com/slemppa/rascal-ai/commit/ba61977dacd3ed78bd15095fca8d1114aa9e641f))

## [1.95.0](https://github.com/slemppa/rascal-ai/compare/v1.93.1...v1.95.0) (2025-11-26)


### ✨ Features

* add export modal with field selection for call logs ([04a3b8b](https://github.com/slemppa/rascal-ai/commit/04a3b8b15bb29dd10acf63fd687a8dc17d722164))

## [1.94.0](https://github.com/slemppa/rascal-ai/compare/v1.93.1...v1.94.0) (2025-11-26)


### ✨ Features

* add export modal with field selection for call logs ([04a3b8b](https://github.com/slemppa/rascal-ai/commit/04a3b8b15bb29dd10acf63fd687a8dc17d722164))

### [1.93.1](https://github.com/slemppa/rascal-ai/compare/v1.93.0...v1.93.1) (2025-11-26)


### 🐛 Bug Fixes

* korjattu modaalien scrollaus ja features-vivut ([baead23](https://github.com/slemppa/rascal-ai/commit/baead23d23d64cb59ad50d94e66a7320e540e250))

## [1.93.0](https://github.com/slemppa/rascal-ai/compare/v1.92.1...v1.93.0) (2025-11-26)


### ✨ Features

* parannettu Puheluloki-sivun filttereitä ja tilastoja ([90f5429](https://github.com/slemppa/rascal-ai/commit/90f5429c46428de21204edbf15d8571377090ef8))

### [1.92.1](https://github.com/slemppa/rascal-ai/compare/v1.92.0...v1.92.1) (2025-11-25)


### 🐛 Bug Fixes

* korjaa WordPress-integration kentät ([9555ca3](https://github.com/slemppa/rascal-ai/commit/9555ca34c024a342e5c811dbfed9373e34fd1a34))

## [1.92.0](https://github.com/slemppa/rascal-ai/compare/v1.91.0...v1.92.0) (2025-11-25)


### ✨ Features

* paranna Aikataulutettu-sarakkeen toiminnallisuutta ([651a3af](https://github.com/slemppa/rascal-ai/commit/651a3afd19e029f43e62c140c06b89275e72cb70))

## [1.91.0](https://github.com/slemppa/rascal-ai/compare/v1.90.4...v1.91.0) (2025-11-25)


### ✨ Features

* Add AI model selection and onboarding toggle ([0080fe3](https://github.com/slemppa/rascal-ai/commit/0080fe34620c1adb9e96b69b5b185a5949bda16f))

### [1.90.4](https://github.com/slemppa/rascal-ai/compare/v1.90.3...v1.90.4) (2025-11-25)


### 🔧 Chores

* tyhjä commit ([7246918](https://github.com/slemppa/rascal-ai/commit/72469189ae7663e46a5e49fc214264f88ff0ae34))


### 🐛 Bug Fixes

* Safari-optimointit ai-chat sivulle vastausten näyttämiseen ([c099232](https://github.com/slemppa/rascal-ai/commit/c0992323e2e3ed7e5fe0c435c0941e3eba8cc717))

### [1.90.3](https://github.com/slemppa/rascal-ai/compare/v1.90.2...v1.90.3) (2025-11-24)


### 🐛 Bug Fixes

* lisätty polling ai-chat sivulle automaattiseen päivitykseen ([1a89e98](https://github.com/slemppa/rascal-ai/commit/1a89e984f076261685e4ff93bd3d138a046d0284))

### [1.90.2](https://github.com/slemppa/rascal-ai/compare/v1.90.1...v1.90.2) (2025-11-24)


### 🐛 Bug Fixes

* Improve error handling and logging for user-secrets-service ([ca173f6](https://github.com/slemppa/rascal-ai/commit/ca173f629d6e698b424d564c9e901b91f9117cd5))

### [1.90.1](https://github.com/slemppa/rascal-ai/compare/v1.90.0...v1.90.1) (2025-11-24)


### 🐛 Bug Fixes

* Use correct production URL for user-secrets webhook ([1f2cfd9](https://github.com/slemppa/rascal-ai/commit/1f2cfd952fb0bd8a0c79a9f7fbd1e0451d3cde07))

## [1.90.0](https://github.com/slemppa/rascal-ai/compare/v1.89.6...v1.90.0) (2025-11-24)


### ✨ Features

* Add user secrets encryption and Make webhook integration ([b35a685](https://github.com/slemppa/rascal-ai/commit/b35a68595d0a7161db5659e790e154dd6b633aca))

### [1.89.6](https://github.com/slemppa/rascal-ai/compare/v1.89.5...v1.89.6) (2025-11-24)


### 🐛 Bug Fixes

* korjaa kampanjan kiinnitys massapuheluihin ja call_time muoto ([fbb3a7f](https://github.com/slemppa/rascal-ai/commit/fbb3a7f20b36438c8a6fd286bdeaa9bd68fe224d))

### [1.89.5](https://github.com/slemppa/rascal-ai/compare/v1.89.4...v1.89.5) (2025-11-21)


### 🐛 Bug Fixes

* korjaa Generoi uusi julkaisu -lomakkeen validointi ([19dda2f](https://github.com/slemppa/rascal-ai/commit/19dda2fd789ddf25005bbf073c3e36af60df9106))

### [1.89.4](https://github.com/slemppa/rascal-ai/compare/v1.89.3...v1.89.4) (2025-11-21)


### 🐛 Bug Fixes

* korjaa käyttäjän kutsun sähköpostin lähetysjärjestys ([95f6b95](https://github.com/slemppa/rascal-ai/commit/95f6b95c2e1df42a655f680d82b7e048904edde8))

### [1.89.3](https://github.com/slemppa/rascal-ai/compare/v1.89.2...v1.89.3) (2025-11-20)


### ✨ Features

* paranna organisaation hallintaa ja poista dark mode ([49bbfa8](https://github.com/slemppa/rascal-ai/commit/49bbfa8bf88629e5adc2f05c9fd28d905f60cc8c))

### [1.89.2](https://github.com/slemppa/rascal-ai/compare/v1.89.1...v1.89.2) (2025-11-20)


### ✨ Features

* paranna tiedoston poistamista AI-chat Tietokanta-välilehdessä ([1d6f792](https://github.com/slemppa/rascal-ai/commit/1d6f792113050bcce849998473576a5a593c483a))

### [1.89.1](https://github.com/slemppa/rascal-ai/compare/v1.89.0...v1.89.1) (2025-11-19)


### 🐛 Bug Fixes

* korjaa onboarding modal näkyvyys owner-käyttäjille ([29f2add](https://github.com/slemppa/rascal-ai/commit/29f2add650c6f21fb03ade78a30edd61a5be98a8))

## [1.89.0](https://github.com/slemppa/rascal-ai/compare/v1.88.0...v1.89.0) (2025-11-19)


### ✨ Features

* lisää lukumäärävalinta Generoi julkaisuja -modaaliin ([7cbf173](https://github.com/slemppa/rascal-ai/commit/7cbf173b897147a39fa22f0330d450b496b508f7))

## [1.88.0](https://github.com/slemppa/rascal-ai/compare/v1.87.0...v1.88.0) (2025-11-18)


### ✨ Features

* Filtteröinti ja CSV export lead scraping -sivulle ([1055479](https://github.com/slemppa/rascal-ai/commit/10554793ac4153ceec087d5a431252fb11bae111))
* Ostajapersoona lead scraping -sivulle ja modaalien headerit ([800986c](https://github.com/slemppa/rascal-ai/commit/800986ce4b0314ad931e9931ccd0493f02efe02c))


### 🐛 Bug Fixes

* korjaa tekstin katoaminen KeskenModalissa kuvan vaihdon jälkeen ([748a0aa](https://github.com/slemppa/rascal-ai/commit/748a0aa8a221a20a099f6ddec4d8a1a27accc163))

## [1.87.0](https://github.com/slemppa/rascal-ai/compare/v1.86.0...v1.87.0) (2025-11-15)


### ♻️ Code Refactoring

* pilkko AccountDetailsPage tabien omiksi komponenteiksi ([866c8ce](https://github.com/slemppa/rascal-ai/commit/866c8ce3f33b165cbad638dc04dd0cf5bf58ef13))


### 🐛 Bug Fixes

* DashboardPage data fetching for multi-tenancy ([d63af96](https://github.com/slemppa/rascal-ai/commit/d63af967df1175c601f4b4121949838f02f7fb55))
* multi-tenancy support for strategy page and modals ([655a1aa](https://github.com/slemppa/rascal-ai/commit/655a1aa7340bcb4d3f27cc9cbe76d179ba5cc116))
* update filter options to match API allowed values ([1e37f53](https://github.com/slemppa/rascal-ai/commit/1e37f53de59a617e0295fde9d5a45c32cb542c43))


### ✨ Features

* add company name to sidebar profile section ([34dec94](https://github.com/slemppa/rascal-ai/commit/34dec949024d71267238ae2ea64658f5293b888a))
* add lead details modal and update lead scraping ([4404e8a](https://github.com/slemppa/rascal-ai/commit/4404e8a7303f60945cc9bfd191ae8b882c524c79))
* Lisätty uusi ääni Jessica äänivalintoihin ([60278d5](https://github.com/slemppa/rascal-ai/commit/60278d583fc3c32ae13d04790442e5312a70d338))
* update lead scraping filters to match Pipeline Labs ([1b82a55](https://github.com/slemppa/rascal-ai/commit/1b82a551df8eef94dc1828646914175918cde135))

## [1.86.0](https://github.com/slemppa/rascal-ai/compare/v1.85.0...v1.86.0) (2025-11-14)


### ✨ Features

* add collapsible sidebar and improve lead scraping page ([df8f15e](https://github.com/slemppa/rascal-ai/commit/df8f15e0b0d30a7f995e2dc5938aa306e861ff51))
* improve lead scraping filters and add search ([69356a6](https://github.com/slemppa/rascal-ai/commit/69356a65560373575f3dde577f3285e644f6b4c4))


### 🐛 Bug Fixes

* ensure filters sidebar fills full height ([a352e35](https://github.com/slemppa/rascal-ai/commit/a352e35853947088007ef593f1b03a8a826d01b7))

## [1.85.0](https://github.com/slemppa/rascal-ai/compare/v1.84.4...v1.85.0) (2025-11-13)


### ✨ Features

* add assistant type selection (marketing/sales) to AI chat ([6f75b53](https://github.com/slemppa/rascal-ai/commit/6f75b530aa8dcf81dfa69b0946ab79f1ea0af7d8))
* add lead scraping feature with Pipeline Labs-style filters ([10de1ba](https://github.com/slemppa/rascal-ai/commit/10de1ba730720d0df7a06451571269b69e678b72))

### [1.84.4](https://github.com/slemppa/rascal-ai/compare/v1.84.3...v1.84.4) (2025-11-12)


### 🐛 Bug Fixes

* korjattu sisältöstrategioiden järjestys ([5f90017](https://github.com/slemppa/rascal-ai/commit/5f900179b6f5036b5667af137db3465c77a411e4))

### [1.84.3](https://github.com/slemppa/rascal-ai/compare/v1.84.2...v1.84.3) (2025-11-12)


### ♻️ Code Refactoring

* yksittäinen puhelu yhdeksi sivumaiseksi + SMS-asetukset ([caacf5a](https://github.com/slemppa/rascal-ai/commit/caacf5a86d3278504fa6c034e5c1d98337c1d223))

### [1.84.2](https://github.com/slemppa/rascal-ai/compare/v1.84.1...v1.84.2) (2025-11-12)


### 🐛 Bug Fixes

* **settings:** päivitä contact_email sähköpostin vaihdon jälkeen ([cc8164f](https://github.com/slemppa/rascal-ai/commit/cc8164f431d48d51a446e305be4fd936ce5f32b3))

### [1.84.1](https://github.com/slemppa/rascal-ai/compare/v1.84.0...v1.84.1) (2025-11-12)


### ♻️ Code Refactoring

* **settings:** siisti Avatar ja Ääniklooni, korjaa email-vaihto ([b5a181c](https://github.com/slemppa/rascal-ai/commit/b5a181cc0ca10b1effb2054ef2545c83cf5841b0))

## [1.84.0](https://github.com/slemppa/rascal-ai/compare/v1.83.0...v1.84.0) (2025-11-10)


### ✨ Features

* lisää leadmagnet-sivu videosisällölle ([1b597f0](https://github.com/slemppa/rascal-ai/commit/1b597f042ab6bf146c274dc50f55fa40a762471e))

## [1.83.0](https://github.com/slemppa/rascal-ai/compare/v1.82.0...v1.83.0) (2025-11-10)


### ♻️ Code Refactoring

* modernize AI chat UI with brand colors and layout fixes ([264cb5f](https://github.com/slemppa/rascal-ai/commit/264cb5f050f5e3157327c16714ebd200177cd5a6)), closes [#ff6600](https://github.com/slemppa/rascal-ai/issues/ff6600) [#e55e00](https://github.com/slemppa/rascal-ai/issues/e55e00)


### 🐛 Bug Fixes

* use brand logo as default fallback instead of favicon ([765696a](https://github.com/slemppa/rascal-ai/commit/765696ad3418a1828c922252aea8db9e6fe67e46))


### ✨ Features

* add lead magnet video viewing system ([abeba09](https://github.com/slemppa/rascal-ai/commit/abeba092e1aed9240fb14f0916fd091b6301f139))
* add user logo upload with drag & drop and sidebar improvements ([177ae7b](https://github.com/slemppa/rascal-ai/commit/177ae7b71f05b6353fe83a7e7b37ecec81320f58))

## [1.82.0](https://github.com/slemppa/rascal-ai/compare/v1.81.3...v1.82.0) (2025-11-06)


### ✨ Features

* lisää 2000 merkin raja ja laskuri postausten tekstikenttiin ([fae7282](https://github.com/slemppa/rascal-ai/commit/fae728260ec70ccbaba168741b22d41b719546fd))

### [1.81.3](https://github.com/slemppa/rascal-ai/compare/v1.81.2...v1.81.3) (2025-11-03)


### 🐛 Bug Fixes

* korjaa strategia modalin näkyvyyslogiikka ([58a6c03](https://github.com/slemppa/rascal-ai/commit/58a6c033440e2c13ef0d6b34ef3c8acc4e01e67f))

### [1.81.2](https://github.com/slemppa/rascal-ai/compare/v1.81.1...v1.81.2) (2025-11-03)


### 🐛 Bug Fixes

* korjaa strategia modalin näkyvyys kirjautuneille ([21db80a](https://github.com/slemppa/rascal-ai/commit/21db80a084218a8b59e669923b5b7981a84428d1))

### [1.81.1](https://github.com/slemppa/rascal-ai/compare/v1.81.0...v1.81.1) (2025-11-03)


### 🐛 Bug Fixes

* add extensive logging for Mixpost UUID tracking ([b3dbf1d](https://github.com/slemppa/rascal-ai/commit/b3dbf1d430bc0a3f197be8c5d3861e512a5b3407))
* estä strategia modaali näkymästä ennen kirjautumista ([246d1ae](https://github.com/slemppa/rascal-ai/commit/246d1aeeab7493a4de2f23107d05c9c14ab37854))

## [1.81.0](https://github.com/slemppa/rascal-ai/compare/v1.80.1...v1.81.0) (2025-10-31)


### ✨ Features

* näytä Kohderyhmä ja Tavoitteet aina ylhäällä ([61184ae](https://github.com/slemppa/rascal-ai/commit/61184ae31017ac6abbcc4585216ca224569b8cb4))

### [1.80.1](https://github.com/slemppa/rascal-ai/compare/v1.80.0...v1.80.1) (2025-10-31)


### 🐛 Bug Fixes

* estä OnboardingModal salasanan asettamisen aikana ([5713430](https://github.com/slemppa/rascal-ai/commit/5713430fe89de907eae4c60fdc774803aed537ff))
* update PublishModal to 50/50 grid with contain scaling ([0fd2f4d](https://github.com/slemppa/rascal-ai/commit/0fd2f4dbe849d25eba22046c716ae1ad4527b696))

## [1.80.0](https://github.com/slemppa/rascal-ai/compare/v1.79.3...v1.80.0) (2025-10-30)


### 📚 Documentation

* Päivitä CHANGELOG v1.79.3 ominaisuuksilla ([1833489](https://github.com/slemppa/rascal-ai/commit/1833489f1b159f4f683332b351b384dc18a7499a))


### 🔧 Chores

* trigger redeploy (local build ok) ([32a0288](https://github.com/slemppa/rascal-ai/commit/32a02883e32f2dda6610d3afe94555e69bdb5102))


### 💄 Styles

* **ui:** unify mass call modal with shared modal styles ([a8cb4ef](https://github.com/slemppa/rascal-ai/commit/a8cb4ef384ce5cd96c88299473c7398b47cf7f00))


### 🐛 Bug Fixes

* **build:** korjaa Vite env-viittaukset ([fe6a245](https://github.com/slemppa/rascal-ai/commit/fe6a245f558c2ccb77a4e0d38ee78db2e1befdf2))
* improve Avatar column display and remove skeleton loading ([329ff29](https://github.com/slemppa/rascal-ai/commit/329ff29d630747def6a00d6cddddda2ebabd8699))
* korjaa ESLint-virheet ja build-ongelmat ([c299ccf](https://github.com/slemppa/rascal-ai/commit/c299ccf1755990539f91481febc1e6c1bf617c34))
* korjaa kuvan vaihto modaaleissa ja lisää media-validointi ([095e14c](https://github.com/slemppa/rascal-ai/commit/095e14ce15f1abb87095f9748fe5a21e764c84f7))
* Korjaa kuvien upload-ongelma posts-sivulla ([1d77d55](https://github.com/slemppa/rascal-ai/commit/1d77d5556d27714eacfd0fc0f5410d20bb16e340))
* Lisää näkyvät virheviestit kuvien upload-ongelmiin ([475e04d](https://github.com/slemppa/rascal-ai/commit/475e04d81c4afbd93695305bc762c81ea8cf9bb2))
* resolve merge conflict in AddCallTypeModal ([28d8b55](https://github.com/slemppa/rascal-ai/commit/28d8b55dd65edbf5758e7d08b5a430142ea774df))
* Restore OnboardingModal component content ([7d557fa](https://github.com/slemppa/rascal-ai/commit/7d557fa00ce824d09cda457546bee43c50cbbfaa))
* Safari notification panel rendering issue ([1b83e1f](https://github.com/slemppa/rascal-ai/commit/1b83e1f951e479e601f98b7f0f4e53e128b548b6))
* Skip button no longer modifies Supabase database ([901a9ef](https://github.com/slemppa/rascal-ai/commit/901a9ef9e97d882cdcd7174cb3d9a00dff195762))


### ✨ Features

* add account manager page for portfolio management ([68301d2](https://github.com/slemppa/rascal-ai/commit/68301d26656bff749a52b349fce555c2e78802d0)), closes [#cea78](https://github.com/slemppa/rascal-ai/issues/cea78) [#1a4a3](https://github.com/slemppa/rascal-ai/issues/1a4a3)
* add language selector to call type modals ([0cd91b3](https://github.com/slemppa/rascal-ai/commit/0cd91b33824248234c21b18da370ad4fd1673b86))
* add optimistic UI updates for post scheduling and status changes ([50a4535](https://github.com/slemppa/rascal-ai/commit/50a4535d5811568a600c6581a378ea7a5e8cb41d))
* **api:** remove service-number blocking from mass calls and validation ([82f50f2](https://github.com/slemppa/rascal-ai/commit/82f50f2db46b7032479094a77783fc2b300e871c))
* **auth:** block ICP onboarding and strategy modals on reset flows ([319d0ef](https://github.com/slemppa/rascal-ai/commit/319d0efc204b54ed13ab84055abdf4da515de9c2))
* **calls:** refine AddCallTypeModal UI and behavior ([8bcd542](https://github.com/slemppa/rascal-ai/commit/8bcd5427bd8bb9867d749f9bc739c9920e1ecab6))
* Complete onboarding modal with ElevenLabs integration ([8674031](https://github.com/slemppa/rascal-ai/commit/867403137cf0b211c987bc907ffd0c65b6392079))
* fix SMS settings in mass call modals and API ([1484831](https://github.com/slemppa/rascal-ai/commit/1484831f8a9d5820238705169e1f08101048570d))
* Lisää tiketöintisysteemi ([071b592](https://github.com/slemppa/rascal-ai/commit/071b592db02f6f08db497433db2499a2528378b2))
* paranna strategiasivun käyttökokemusta ([23ad761](https://github.com/slemppa/rascal-ai/commit/23ad761a2a0465635f21e082beae03e81bc85317))
* **posts:** align current-month quota with next-month logic ([23bac69](https://github.com/slemppa/rascal-ai/commit/23bac69a112773a1fa784849441e6c1893f83342))
* Show onboarding modal to all users (not just admin) ([a1fca91](https://github.com/slemppa/rascal-ai/commit/a1fca91a31d61810510406767bbd850c66507390))
* **ui:** add audio tab to call details modal ([54361cf](https://github.com/slemppa/rascal-ai/commit/54361cf3d3c63c84eb78b8d9a31177ecd2d8e86b))
* update Avatar column with coming soon message ([0942135](https://github.com/slemppa/rascal-ai/commit/094213544d6bba7c695a44790518b2fd7759ff81))
* update Avatar section in settings with modern coming soon design ([83eb4ae](https://github.com/slemppa/rascal-ai/commit/83eb4ae4485bc82f2bfdc1b6337148a50e811d24))

### [1.79.3](https://github.com/slemppa/rascal-ai/compare/v1.79.2...v1.79.3) (2025-10-14)

### ✨ Features

* Lisää latausnappi kuville ja paranna otsikoiden näyttöä ([48ef94d](https://github.com/slemppa/rascal-ai/commit/48ef94d))

### 🔧 Chores

* Päivitä versio 1.79.2 ([b659e41](https://github.com/slemppa/rascal-ai/commit/b659e414f69f696e3d61449b41bd1f891469dda3))
* sync pending changes ([390e425](https://github.com/slemppa/rascal-ai/commit/390e425ef04e5d74ffd13c5a98a380954fd66e99))


### 🐛 Bug Fixes

* Add axios import to DashboardPage and fix Mixpost posts display ([0881009](https://github.com/slemppa/rascal-ai/commit/0881009e4f0f2ab432ec3578c190e1a8191d90d6))
* **calls:** KPI-laatikot päivittyvät filtterien mukaan ([4e86960](https://github.com/slemppa/rascal-ai/commit/4e86960c8ff8599843c46312831ead736c68782e))
* **calls:** lisää transkripti CSV-exporttiin ([cb10cb1](https://github.com/slemppa/rascal-ai/commit/cb10cb14c6c3471bd239ad593a68c5926b5dd1e3))
* **campaigns:** korjaa Jäljellä-luku (vain pending+in progress) ([4b78bd8](https://github.com/slemppa/rascal-ai/commit/4b78bd8196c830ed1a140ad069c493e05e9ca4ed))
* Estä strategia-modal kriittisillä sivuilla (settings, admin, auth) ([33a2a05](https://github.com/slemppa/rascal-ai/commit/33a2a056e2172945448ffa94e36e5e7e7a346a5e))
* Force 24-hour time format across all components ([16508a7](https://github.com/slemppa/rascal-ai/commit/16508a7a67056e4c11a5c1a8dd3e2732d03a7b31))
* Korjaa Button-import ja admin-oikeudet Sidebarissa ([407c08e](https://github.com/slemppa/rascal-ai/commit/407c08e3c4c1f0c52a0efc1568aa75301fb5bce5))
* Korjaa iOS-zoomaus salasanan vaihdossa ja mobiilinavigaatio ([68ed399](https://github.com/slemppa/rascal-ai/commit/68ed399a78b295fba77ba032d46d87e35e2d8c98))
* Korjattu timezone-käsittely kaikissa näkymissä ([28ae3fc](https://github.com/slemppa/rascal-ai/commit/28ae3fc137179660c60ce38cbabbc57cd86715e1))
* lisätty puuttuvat käännökset Tekstiviestit-välilehteä varten ([cde3893](https://github.com/slemppa/rascal-ai/commit/cde3893f1e29dc18035736f20eb65d20ea7021c5))
* Pakota musta tekstiväri strategia-sivun input/textarea-kentissä ([a428268](https://github.com/slemppa/rascal-ai/commit/a42826848fb7df4033b4f86b4d4764114f28172c))
* Poista epärelevantti 'x osaa' tieto tiedostolistasta ([d16e92d](https://github.com/slemppa/rascal-ai/commit/d16e92d008aeeb5a826b1a7ef635a500a30e857b))


### ✨ Features

* add created_at timestamps to posts modals and cards ([8c8a0c6](https://github.com/slemppa/rascal-ai/commit/8c8a0c660ef83a0dba30a98945f12fb148d41d06))
* Fix Mixpost post editing from Aikataulutettu column ([26c2abe](https://github.com/slemppa/rascal-ai/commit/26c2abeccd826d6682493d56250eb3878c74bbe2))
* Improve call type modals with better UX and new fields ([50569f7](https://github.com/slemppa/rascal-ai/commit/50569f78f1af19a2048a4c8a2460e6146cc1cf14))
* Korjattu postauksen muokkaus ja ajastus ([cd082a7](https://github.com/slemppa/rascal-ai/commit/cd082a7f5cd55581635d97e88735bf5a2ec09743))
* Lisää 'Onnistuneet' hakuvaihtoehto ja korjaa haku-logiikka ([5575fb0](https://github.com/slemppa/rascal-ai/commit/5575fb0d149d41dceebd56ca39e11e0b4a703bd5))
* Lisää latausnappi kuville ja paranna otsikoiden näyttöä ([48ef94d](https://github.com/slemppa/rascal-ai/commit/48ef94db1caa0aa5943a3f5aeae399865a3b9bda))
* lisätty kalenterinäkymään kanavan näyttö ja klikkaus ([6389277](https://github.com/slemppa/rascal-ai/commit/6389277c7f79c2416335cfd0d16f126bb5373115))

### [1.79.1](https://github.com/slemppa/rascal-ai/compare/v1.79.0...v1.79.1) (2025-10-01)


### 🐛 Bug Fixes

* korjaa Julkaistu-sarakkeen leveys koko leveydelle ([8908936](https://github.com/slemppa/rascal-ai/commit/89089364d8e40512ce860cc48c66149f81c4c794))

## [1.79.0](https://github.com/slemppa/rascal-ai/compare/v1.78.0...v1.79.0) (2025-10-01)


### ✨ Features

* paranna kalenteria ja korjaa mixpost-integraatio ([f792254](https://github.com/slemppa/rascal-ai/commit/f79225430ab03a8b395d01c23cf678e9318e37ed))

## [1.78.0](https://github.com/slemppa/rascal-ai/compare/v1.77.1...v1.78.0) (2025-10-01)


### ✨ Features

* lisää tilaus-sarake adminiin ja is_generated tuonti ([f6a5b9c](https://github.com/slemppa/rascal-ai/commit/f6a5b9c2c8ad8059cb4b947766d3be582253ff66))

### [1.77.1](https://github.com/slemppa/rascal-ai/compare/v1.77.0...v1.77.1) (2025-10-01)


### 🐛 Bug Fixes

* korjaa strategia vahvistus modalin näyttäminen ([2cf8491](https://github.com/slemppa/rascal-ai/commit/2cf8491096ef423f48182d561687fdce903d90a3))

## [1.77.0](https://github.com/slemppa/rascal-ai/compare/v1.75.0...v1.77.0) (2025-09-30)


### ✨ Features

* add calendar view and post import to ManagePostsPage ([2d3d2c1](https://github.com/slemppa/rascal-ai/commit/2d3d2c101a92f7be80eac3bd0d30fc70359d3cf9))

## [1.76.0](https://github.com/slemppa/rascal-ai/compare/v1.75.0...v1.76.0) (2025-09-30)


### ✨ Features

* add calendar view and post import to ManagePostsPage ([2d3d2c1](https://github.com/slemppa/rascal-ai/commit/2d3d2c101a92f7be80eac3bd0d30fc70359d3cf9))

## [1.75.0](https://github.com/slemppa/rascal-ai/compare/v1.74.1...v1.75.0) (2025-09-30)


### ✨ Features

* **settings:** add email change UI and Supabase update flow ([debb035](https://github.com/slemppa/rascal-ai/commit/debb035ef1394734e52a5bb5d16f73f908a51ad8))

### [1.74.1](https://github.com/slemppa/rascal-ai/compare/v1.74.0...v1.74.1) (2025-09-29)


### ♻️ Code Refactoring

* remove favicon and text from login sidebar ([5cea0ee](https://github.com/slemppa/rascal-ai/commit/5cea0ee120e418341ae7f0f95f3cc1585afeb185))


### ✨ Features

* create fullscreen login page with orange/black theme ([3386c45](https://github.com/slemppa/rascal-ai/commit/3386c4595f96267f273915df46562f5af659ffee)), closes [#ff6b2](https://github.com/slemppa/rascal-ai/issues/ff6b2) [#0a0a0](https://github.com/slemppa/rascal-ai/issues/0a0a0)
* **meeting-notes:** lisää sivu ja näkyvyysrajat ([352d4b1](https://github.com/slemppa/rascal-ai/commit/352d4b1bb0ac4fc44a5dc20239de63cf57fa2d46))

## [1.74.0](https://github.com/slemppa/rascal-ai/compare/v1.73.0...v1.74.0) (2025-09-26)


### ✨ Features

* Add strategy approval system with webhook integration ([10f61dc](https://github.com/slemppa/rascal-ai/commit/10f61dccd08f947f325181e143c556534c83085f))

## [1.73.0](https://github.com/slemppa/rascal-ai/compare/v1.72.0...v1.73.0) (2025-09-26)


### ✨ Features

* sometilien synkronointi ja provider-näyttö ([f35a097](https://github.com/slemppa/rascal-ai/commit/f35a0973bdce1add3529b580506d5966924a9a9a))

## [1.72.0](https://github.com/slemppa/rascal-ai/compare/v1.71.0...v1.72.0) (2025-09-26)


### ✨ Features

* Add TOV visualization to strategy page ([5164f19](https://github.com/slemppa/rascal-ai/commit/5164f1942dab5c3f62eaee8ff8321b6918e5d6a8))

## [1.71.0](https://github.com/slemppa/rascal-ai/compare/v1.70.0...v1.71.0) (2025-09-26)


### 🐛 Bug Fixes

* Käytä placeholder-kuvaa kun mediaa ei ole ([ebd9445](https://github.com/slemppa/rascal-ai/commit/ebd94452de5d4f70f8cdf1cfb71a222f00277fe9))


### 🔧 Chores

* Poista Google Analytics sovelluksesta ([5acda93](https://github.com/slemppa/rascal-ai/commit/5acda934af1a3572d42686c9392a650b5a113367))


### ✨ Features

* strategy-sivu hakee ja tallentaa dataa Supabasesta ([b9680f6](https://github.com/slemppa/rascal-ai/commit/b9680f66ac7dd17b951711c9c96bbc056237704d))

## [1.70.0](https://github.com/slemppa/rascal-ai/compare/v1.69.1...v1.70.0) (2025-09-25)


### ✨ Features

* Näytä kaikki kuvat PostCard-komponentissa ([9431e17](https://github.com/slemppa/rascal-ai/commit/9431e17ce6b268971293a0aeb15a6f6d4babf9d6))

### [1.69.1](https://github.com/slemppa/rascal-ai/compare/v1.69.0...v1.69.1) (2025-09-24)


### 🐛 Bug Fixes

* Korjaa 'Luo sisältöä' modaali blog-newsletter sivulla ([4f2628c](https://github.com/slemppa/rascal-ai/commit/4f2628c23d487cf6eb964cae5e45e1fa9a459524))

## [1.69.0](https://github.com/slemppa/rascal-ai/compare/v1.68.3...v1.69.0) (2025-09-23)


### ✨ Features

* Näytä kaikki slaidit Carousel-postauksissa julkaisumodaalissa ([07f5451](https://github.com/slemppa/rascal-ai/commit/07f5451a8bd669c3fbac27d0faf44b5d18dea502))

### [1.68.3](https://github.com/slemppa/rascal-ai/compare/v1.68.2...v1.68.3) (2025-09-22)


### 🐛 Bug Fixes

* **storage-delete:** use VITE_ env vars like other APIs ([ffbb5f0](https://github.com/slemppa/rascal-ai/commit/ffbb5f07a84375b585c785d4adface2f8ec28871))

### [1.68.2](https://github.com/slemppa/rascal-ai/compare/v1.68.1...v1.68.2) (2025-09-22)


### 🐛 Bug Fixes

* **upload:** send public URLs to webhook and use anon key in ingest ([6994bf9](https://github.com/slemppa/rascal-ai/commit/6994bf9a3de4ceaac7b992d8960ed38cc5cf69cc))

### [1.68.1](https://github.com/slemppa/rascal-ai/compare/v1.68.0...v1.68.1) (2025-09-22)


### 🐛 Bug Fixes

* **api:** use public URLs in vectorsupabase ingest ([cb94f90](https://github.com/slemppa/rascal-ai/commit/cb94f90b9594f22e6cc692e4d0da9b256776c392))


### ✨ Features

* **ai-chat:** upload to supabase temp-ingest and ingest URLs ([874addc](https://github.com/slemppa/rascal-ai/commit/874addcac4917907f47c2e42f1b92b61991604ad))
* **api:** add blob client upload handler ([a211637](https://github.com/slemppa/rascal-ai/commit/a211637941d19ec31ec0208057f20a690d541768))
* **api:** add supabase storage upload/ingest/delete endpoints ([85f1065](https://github.com/slemppa/rascal-ai/commit/85f1065ed14c7bdb39c6c3398d44bc5329d4d367))

## [1.68.0](https://github.com/slemppa/rascal-ai/compare/v1.67.1...v1.68.0) (2025-09-22)


### ✨ Features

* **ai-chat:** use Vercel Blob for database uploads ([478e67c](https://github.com/slemppa/rascal-ai/commit/478e67c1315313bdde1cd9e631b52934f52f4e1e))
* **api:** add blob upload and delete endpoints ([53682be](https://github.com/slemppa/rascal-ai/commit/53682be9e184037568d592af848adaf40ca222e2))


### 🐛 Bug Fixes

* **dashboard:** paginate success stats and respect filters ([bdffeba](https://github.com/slemppa/rascal-ai/commit/bdffeba7f5629a494672f8b00338dfa958146e28))


### 🔧 Chores

* **api:** improve dev-knowledge request parsing ([877dd8c](https://github.com/slemppa/rascal-ai/commit/877dd8c0eaa5a062da6ae7e7e7418b6b344c92c6))
* **i18n:** update upload texts ([0407bd2](https://github.com/slemppa/rascal-ai/commit/0407bd2758ad75c1f57eb07c39269d771d16996a))

### [1.67.1](https://github.com/slemppa/rascal-ai/compare/v1.67.0...v1.67.1) (2025-09-22)


### 🐛 Bug Fixes

* **campaigns:** paginate call_logs and add called_calls; unify success ([ce67710](https://github.com/slemppa/rascal-ai/commit/ce677100d90727df7345120ab486661afadcc8f6))
* **dashboard:** answer rate uses successful answered calls ([bf92ecc](https://github.com/slemppa/rascal-ai/commit/bf92ecc4354cc54b37f672a4f688abaa3afd337e))


### 🔧 Chores

* **ui:** update VersionNotification for latest changes ([a44a7cd](https://github.com/slemppa/rascal-ai/commit/a44a7cd49d50f86e4613366b38d34e57bab44c01))

## [1.67.0](https://github.com/slemppa/rascal-ai/compare/v1.66.2...v1.67.0) (2025-09-21)


### ✨ Features

* **ai-chat:** image/audio upload support; always send filenames ([5ab7424](https://github.com/slemppa/rascal-ai/commit/5ab7424580533db7446e09af51dca7c4d2b57d8b))


### 🐛 Bug Fixes

* **i18n:** use {{count}} in upload texts; update upload desc ([ed7b7b9](https://github.com/slemppa/rascal-ai/commit/ed7b7b9283d276ee488e9428a856ec8b6f22f17b))

### [1.66.2](https://github.com/slemppa/rascal-ai/compare/v1.66.1...v1.66.2) (2025-09-19)


### ✨ Features

* **posts, blog-newsletter:** enforce monthly limit; unify UI ([4b0bff9](https://github.com/slemppa/rascal-ai/commit/4b0bff9302d5c74fae82d1fd6a1e90503d4a09f3))

### [1.66.1](https://github.com/slemppa/rascal-ai/compare/v1.66.0...v1.66.1) (2025-09-17)


### ✨ Features

* **blog-newsletter:** add archive tab and action; add toasts ([1cce4b5](https://github.com/slemppa/rascal-ai/commit/1cce4b5d84ee7b49eaf68cd73ae72984f59322a0))

## [1.66.0](https://github.com/slemppa/rascal-ai/compare/v1.65.0...v1.66.0) (2025-09-17)


### ✨ Features

* Add GDPR consent checkbox to Chatbot modal ([189dd54](https://github.com/slemppa/rascal-ai/commit/189dd54e9f2dcb075e64cb4c0ea54383da1024a6))

## [1.65.0](https://github.com/slemppa/rascal-ai/compare/v1.64.1...v1.65.0) (2025-09-17)


### ✨ Features

* **calls:** redesign and optimize 'Puhelun tiedot' modal ([b7dfdea](https://github.com/slemppa/rascal-ai/commit/b7dfdea48470d5c5d8051244cee8e1e415903481))

### [1.64.1](https://github.com/slemppa/rascal-ai/compare/v1.64.0...v1.64.1) (2025-09-17)


### 🐛 Bug Fixes

* **calls:** korjaa outbound AI-parannus; lisää JWT & estä X-tallennus ([5b8dfc6](https://github.com/slemppa/rascal-ai/commit/5b8dfc6905fef534709c431f9dc758e3a40483c0))

## [1.64.0](https://github.com/slemppa/rascal-ai/compare/v1.63.2...v1.64.0) (2025-09-15)


### ✨ Features

* add auto-close modal after AI enhancement for outbound call types ([b08e285](https://github.com/slemppa/rascal-ai/commit/b08e28575d4dfe4702812ba26f9c13d234e62506))

### [1.63.1](https://github.com/slemppa/rascal-ai/compare/v1.63.0...v1.63.1) (2025-09-15)


### ♻️ Code Refactoring

* poista käyttämättömät sivut ja korjaa Meta Pixel ([950edf7](https://github.com/slemppa/rascal-ai/commit/950edf78b6ddf30b11958b42a9df0462c47fb6b6))

## [1.63.0](https://github.com/slemppa/rascal-ai/compare/v1.62.1...v1.63.0) (2025-09-15)


### ✨ Features

* paranna SEO-optimointia Meta Pixel ja keywords-tuella ([931ebff](https://github.com/slemppa/rascal-ai/commit/931ebff07dff900b3c3d4f657b19c7d759bf9c99))

### [1.62.1](https://github.com/slemppa/rascal-ai/compare/v1.62.0...v1.62.1) (2025-09-15)


### 🐛 Bug Fixes

* korjattu blog-sivun artikkelilaatikoiden layout ja korkeudet ([823b380](https://github.com/slemppa/rascal-ai/commit/823b38097a96f2452a64dbdfb590806abcff3ff9))
* korjattu call type -parannus ID-ongelma ([a243f24](https://github.com/slemppa/rascal-ai/commit/a243f24cbfe1f60e1ea5cd765255248d29f9a009))

## [1.62.0](https://github.com/slemppa/rascal-ai/compare/v1.61.1...v1.62.0) (2025-09-15)


### 🐛 Bug Fixes

* **posts:** hide all actions in Aikataulutettu column ([49277d4](https://github.com/slemppa/rascal-ai/commit/49277d464ad6aa8734881328b0a84146f369cb8f))


### ✨ Features

* Add call logs stats to campaign cards ([3d2a89b](https://github.com/slemppa/rascal-ai/commit/3d2a89b75906c10f7952dec34857df52bd023bfe))

### [1.61.1](https://github.com/slemppa/rascal-ai/compare/v1.61.0...v1.61.1) (2025-09-15)


### 🐛 Bug Fixes

* korjaa dashboard ja campaigns tiedot sekä mass-call kampanja ([f0f0561](https://github.com/slemppa/rascal-ai/commit/f0f0561b39b4ef8c2a5c65e9e8ae924bbe40900a))


### ✨ Features

* **posts:** show Mixpost scheduled posts and provider badge ([c68c73c](https://github.com/slemppa/rascal-ai/commit/c68c73cccac9ecc82cf6f7d6cbd1b208e9284e90))

## [1.61.0](https://github.com/slemppa/rascal-ai/compare/v1.60.2...v1.61.0) (2025-09-13)


### ✨ Features

* add monthly content limit warning system ([d45c0d6](https://github.com/slemppa/rascal-ai/commit/d45c0d6c9a4b929c702485461df43be426d62394))
* improve call logs pagination and filtering ([f375477](https://github.com/slemppa/rascal-ai/commit/f375477559a22eaaf20c7737c5a8650b65c51bb5))

### [1.60.2](https://github.com/slemppa/rascal-ai/compare/v1.60.1...v1.60.2) (2025-09-12)


### 🐛 Bug Fixes

* clear media_urls field properly in image replacement ([92b894d](https://github.com/slemppa/rascal-ai/commit/92b894d09844383f8cf939c4f6646379ffd9c971))

### [1.60.1](https://github.com/slemppa/rascal-ai/compare/v1.60.0...v1.60.1) (2025-09-12)


### 🐛 Bug Fixes

* implement proper image replacement functionality ([73a1c1c](https://github.com/slemppa/rascal-ai/commit/73a1c1ca4a7a6be32c5bf7920ce542bbdcb6f223))

## [1.60.0](https://github.com/slemppa/rascal-ai/compare/v1.59.0...v1.60.0) (2025-09-11)


### ✨ Features

* add text color support to carousel template API ([f09b9a1](https://github.com/slemppa/rascal-ai/commit/f09b9a1c97f3727fd13f9e4559cf93b47f7b767c))

## [1.59.0](https://github.com/slemppa/rascal-ai/compare/v1.58.0...v1.59.0) (2025-09-11)


### ♻️ Code Refactoring

* improve Yritysanalyysi UI and version notification ([f80fb80](https://github.com/slemppa/rascal-ai/commit/f80fb8018ae2bb2316f3244b3b15c1f2956c1251))


### ✨ Features

* improve carousel template preview with proper text positioning ([24ee680](https://github.com/slemppa/rascal-ai/commit/24ee680e6e67a36d0c336727d5351a986037000c))

## [1.58.0](https://github.com/slemppa/rascal-ai/compare/v1.57.0...v1.58.0) (2025-09-11)


### 🐛 Bug Fixes

* korjaa Mixpost API datan käsittely ja vaihda axios-kutsuun ([13b5a9a](https://github.com/slemppa/rascal-ai/commit/13b5a9a6dba2365df445271b4de5e0f59b5752b4))


### ✨ Features

* add Yritysanalyysi card to Strategy page ([bd29ce3](https://github.com/slemppa/rascal-ai/commit/bd29ce3ea49e404085a88fba14f8fdfadf9acfd1))

## [1.57.0](https://github.com/slemppa/rascal-ai/compare/v1.56.0...v1.57.0) (2025-09-10)


### ✨ Features

* add version notification system ([a9e283a](https://github.com/slemppa/rascal-ai/commit/a9e283ae759d67103dfc4ee55768480bd698bf14))

## [1.56.0](https://github.com/slemppa/rascal-ai/compare/v1.55.0...v1.56.0) (2025-09-10)


### ✨ Features

* Korjaa PublishModal ja lisää Mixpost-synkronointi ([602d6ce](https://github.com/slemppa/rascal-ai/commit/602d6ce9ae4e78620947c397642745303cc22c0d))

## [1.55.0](https://github.com/slemppa/rascal-ai/compare/v1.54.1...v1.55.0) (2025-09-10)


### 📚 Documentation

* Update tech stack documentation ([64a85be](https://github.com/slemppa/rascal-ai/commit/64a85befa466025ce85da9648e9fde45dbda08e7))


### 🐛 Bug Fixes

* korjaa chat sivun companyId bugi ([feca228](https://github.com/slemppa/rascal-ai/commit/feca2284f359a7ae56f8131c2eca25b0bb73149b))
* korjaa sidebar oikeudet company_id muutoksen jälkeen ([8afb5b4](https://github.com/slemppa/rascal-ai/commit/8afb5b4f88fcb69354babb7bc166b65a35d5f58e))
* Use correct dev endpoints for file upload/delete in AI chat ([30ea159](https://github.com/slemppa/rascal-ai/commit/30ea15960bfad7ccec6d12e73869aec77fe5569a))
* Use relative API path for carousel template ([4e5a5c6](https://github.com/slemppa/rascal-ai/commit/4e5a5c6c82dcc27f27cb580f2e5d133ddd70975b))


### ✨ Features

* Add drag & drop and replace alerts with toast notifications ([3703ec4](https://github.com/slemppa/rascal-ai/commit/3703ec42fbb16513ebed5908a52cfd3bfaddbf51))
* Add Photoshop-style color picker to carousel settings ([1934bd7](https://github.com/slemppa/rascal-ai/commit/1934bd70749302fd21228451cab16c550730c129))
* Add publish date selection to publish modal ([48d0d27](https://github.com/slemppa/rascal-ai/commit/48d0d27da027374f7a253212c73fcf33ee722b86))
* Add publish date/time selection to publish modal ([0db52d7](https://github.com/slemppa/rascal-ai/commit/0db52d72019a54c108fe0a4d44255f7b42f9160d))
* improve inbound settings modal and calls tab layout ([c166d86](https://github.com/slemppa/rascal-ai/commit/c166d865b266691bad00d34c314d27752efe9d81))
* update AI chat to use userId instead of companyId/assistantId ([95dd2e4](https://github.com/slemppa/rascal-ai/commit/95dd2e4ff2590beb85086c3175f4578280fb0afb))

### [1.54.1](https://github.com/slemppa/rascal-ai/compare/v1.54.0...v1.54.1) (2025-09-05)


### 🐛 Bug Fixes

* korjaa sidebar duplikaatit ja poista admin-tarkistukset ([3b20c83](https://github.com/slemppa/rascal-ai/commit/3b20c83c84a161c3498d27193cd8865945ce0feb))

## [1.54.0](https://github.com/slemppa/rascal-ai/compare/v1.53.1...v1.54.0) (2025-09-05)


### ✨ Features

* yksinkertainen somet-yhdistys settings-sivulla ([5badaef](https://github.com/slemppa/rascal-ai/commit/5badaef50c5391c06908703b3f3b33c7cee71122))

### [1.53.1](https://github.com/slemppa/rascal-ai/compare/v1.53.0...v1.53.1) (2025-09-05)


### 🐛 Bug Fixes

* korjaa LandingPage mobiili-responsiivisuus ([9b0c74e](https://github.com/slemppa/rascal-ai/commit/9b0c74ea244ee6959268d366b1672565e4309ae6))

## [1.53.0](https://github.com/slemppa/rascal-ai/compare/v1.52.0...v1.53.0) (2025-09-04)


### ✨ Features

* add Vercel Speed Insights tracking ([9e50729](https://github.com/slemppa/rascal-ai/commit/9e5072910d0aa5817a5a647cb6989654258b076e))

## [1.52.0](https://github.com/slemppa/rascal-ai/compare/v1.51.0...v1.52.0) (2025-09-04)


### ✨ Features

* add assessment form page with Notion iframe ([3facbf0](https://github.com/slemppa/rascal-ai/commit/3facbf00bbdb1683f72ab8571faaeec19dfcdc20))

## [1.51.0](https://github.com/slemppa/rascal-ai/compare/v1.50.0...v1.51.0) (2025-09-04)


### ✨ Features

* add implementation section and update hero content ([76ba19c](https://github.com/slemppa/rascal-ai/commit/76ba19cdd03973fccf6a8ca113bd0d3d187e5224))

## [1.50.0](https://github.com/slemppa/rascal-ai/compare/v1.49.3...v1.50.0) (2025-09-03)


### ✨ Features

* muuta hero-osion CTA 'Varaa demo' -> 'Tulossa pian' ([d4fc103](https://github.com/slemppa/rascal-ai/commit/d4fc103298804d9b8745a7af627f052956a5103a))

### [1.49.3](https://github.com/slemppa/rascal-ai/compare/v1.49.2...v1.49.3) (2025-09-03)


### 🐛 Bug Fixes

* korjaa dashboard Avainluvut ja Tulevat postaukset -osiot ([05ea1d7](https://github.com/slemppa/rascal-ai/commit/05ea1d7f8caaf9301fcf68adb52f61473d52bc50))

### [1.49.2](https://github.com/slemppa/rascal-ai/compare/v1.49.1...v1.49.2) (2025-09-01)


### ✨ Features

* i18n for Settings page, Assistant, and call-type modals ([debaa94](https://github.com/slemppa/rascal-ai/commit/debaa94f6459c20bb8a18783641e3bc0221a115d))
* lisää henkilöiden kuvaukset LandingPagen team-osioon ([cdbc85e](https://github.com/slemppa/rascal-ai/commit/cdbc85e604b9b2f705bdb0b12d564e5f3df035c8))
* paranna LandingPagen features-grid asettelua 4x2 grid:iin ([7ec0af2](https://github.com/slemppa/rascal-ai/commit/7ec0af201a91d4be7414392ace0fd5530db8288a))

### [1.49.1](https://github.com/slemppa/rascal-ai/compare/v1.49.0...v1.49.1) (2025-08-28)


### ✨ Features

* **dev:** Dev-sivu näkyy admin+moderator; lisää Dev-feature gating ([8779736](https://github.com/slemppa/rascal-ai/commit/8779736494279379d30ce70a570a1bb9f91bc91e))

## [1.49.0](https://github.com/slemppa/rascal-ai/compare/v1.48.0...v1.49.0) (2025-08-27)


### ✨ Features

* implement image management for posts with drag & drop UI ([456829d](https://github.com/slemppa/rascal-ai/commit/456829d398d4d4856cf77a1ee8fc8909d498faba))

## [1.48.0](https://github.com/slemppa/rascal-ai/compare/v1.47.0...v1.48.0) (2025-08-27)


### ✨ Features

* dashboard scatter+heatmap; success=answered; CRM gating ([085daed](https://github.com/slemppa/rascal-ai/commit/085daed0941fd1836388b1b9e893bfe65eb07b87))

## [1.47.0](https://github.com/slemppa/rascal-ai/compare/v1.46.1...v1.47.0) (2025-08-26)


### ✨ Features

* **calls:** single-call 'SMS first' toggle + API support ([4011899](https://github.com/slemppa/rascal-ai/commit/4011899031453c01e0d053429e2390513051b228))

### [1.46.1](https://github.com/slemppa/rascal-ai/compare/v1.46.0...v1.46.1) (2025-08-25)


### 🐛 Bug Fixes

* resolve user access issues and improve file handling ([8ebd775](https://github.com/slemppa/rascal-ai/commit/8ebd7752cc581a1bf10f786f10124ed55ba9f544))

## [1.46.0](https://github.com/slemppa/rascal-ai/compare/v1.45.0...v1.46.0) (2025-08-25)


### ✨ Features

* implement testimonials management and customer page ([9c33c28](https://github.com/slemppa/rascal-ai/commit/9c33c288ffd5f2c44e62f1fc42c119ea281f6a13))

## [1.45.0](https://github.com/slemppa/rascal-ai/compare/v1.44.0...v1.45.0) (2025-08-25)


### ✨ Features

* **admin:** add Testimonials management and Hallinta tabs ([65b0013](https://github.com/slemppa/rascal-ai/commit/65b00133f66eec35f3c766a1fa8865c784643ae4))

## [1.44.0](https://github.com/slemppa/rascal-ai/compare/v1.43.4...v1.44.0) (2025-08-25)


### ✨ Features

* **landing:** add Team section; add header link; nav updates ([c426ee9](https://github.com/slemppa/rascal-ai/commit/c426ee9f40b2115e59eb4c4c58759af7f72ee42e))

### [1.43.4](https://github.com/slemppa/rascal-ai/compare/v1.43.3...v1.43.4) (2025-08-25)


### 🐛 Bug Fixes

* use fit-content for all screen sizes, content-driven height ([33e3749](https://github.com/slemppa/rascal-ai/commit/33e3749b084e0408b7c9f5da02aec9758e2a54cf))

### [1.43.3](https://github.com/slemppa/rascal-ai/compare/v1.43.2...v1.43.3) (2025-08-25)


### 🐛 Bug Fixes

* **mobile:** use 100svh and flex layout for proper stretching ([44dfb1b](https://github.com/slemppa/rascal-ai/commit/44dfb1bf33c8f4580f1f0a2d2f40d5c29f69d503))

### [1.43.2](https://github.com/slemppa/rascal-ai/compare/v1.43.1...v1.43.2) (2025-08-25)


### 🐛 Bug Fixes

* **mobile:** add padding-top for sticky header compensation ([a90e239](https://github.com/slemppa/rascal-ai/commit/a90e23995f4d43bc93bbd1290609ebe6d87583a1))

### [1.43.1](https://github.com/slemppa/rascal-ai/compare/v1.43.0...v1.43.1) (2025-08-25)


### 🔧 Chores

* remove unused image files from public directory ([cd9bd12](https://github.com/slemppa/rascal-ai/commit/cd9bd122b759bc95317a832ec85645470e277955))


### ✨ Features

* add automatic update system and improve Vite dev server ([5c58612](https://github.com/slemppa/rascal-ai/commit/5c58612f0e22089a075fca7c586b949c32f56b7c))
* add blog system, shared header and AI due diligence page ([60e0c9c](https://github.com/slemppa/rascal-ai/commit/60e0c9c28f00356b66e8531d0091439ed60e5845))
* add chatbot widget with contact form and remove unused ContactPage ([9fd3bad](https://github.com/slemppa/rascal-ai/commit/9fd3badada83140bac6136a26d2c0dbe9a62a2b6))
* add published status toggle and improve blog CRUD operations ([4527c46](https://github.com/slemppa/rascal-ai/commit/4527c46d6cb1acb94ca4d77be3a9797dd7ca9438))
* change social media image to favicon.png ([ca6431f](https://github.com/slemppa/rascal-ai/commit/ca6431fd67cd2aac83151ed4ecc6427b8722844c))
* ChatbotWidget vain julkkisilla + korjattu padding ([c60785c](https://github.com/slemppa/rascal-ai/commit/c60785ceb6cb92fb95059643c0de269ccad7c0e9))
* korjaa artikkelikorttien tyylit ja ulkoasu ([09a3ff4](https://github.com/slemppa/rascal-ai/commit/09a3ff4cec24162edc17b07c464402313f105dbd))
* make image upload required for blog articles ([4386db9](https://github.com/slemppa/rascal-ai/commit/4386db93d751779fc36b1679927dfc38608169c8))
* poista Service Worker kokonaan ja korjaa mobiiliongelmat ([4d459f6](https://github.com/slemppa/rascal-ai/commit/4d459f6ef97170c80759baffe31fbf635e1ff2f8))
* update SEO meta tags with marketing and sales focus ([b61263d](https://github.com/slemppa/rascal-ai/commit/b61263de4a8b5815cf0798c54f019af5ce625f16))


### 🐛 Bug Fixes

* add missing error state to AdminBlogPage ([92461ea](https://github.com/slemppa/rascal-ai/commit/92461ead3419ad8f91f6f93a521716871ddfd183))
* BlogArticlePage CSS-ristiriidat ja mobiili-tyylit ([c91cbdb](https://github.com/slemppa/rascal-ai/commit/c91cbdb0e28fde4764815e72cbeca9662bedf25b))
* BlogArticlePage mobiili-ongelmat ja nappien venytys ([12405d1](https://github.com/slemppa/rascal-ai/commit/12405d1760b1877ec7e521ee729e7a71dfa2bb31))
* improve mobile layout and fix demo button ([55eb871](https://github.com/slemppa/rascal-ai/commit/55eb871b6e5b8f7d23a916ad59e129190b28e35d))
* korjaa mobiiliongelmat ja Service Worker MIME type -virhe ([b1ad697](https://github.com/slemppa/rascal-ai/commit/b1ad69778aeb3622923a1c6c4ef5b1faadbaf6de))
* **layout:** allow pages to grow with content; remove root 100% height ([6f69c99](https://github.com/slemppa/rascal-ai/commit/6f69c997d298ed27522fdc94e2d14da48578e319))
* mobiili-skaalaus — poistettu fit-content ja napin 100% leveys ([6fd48fb](https://github.com/slemppa/rascal-ai/commit/6fd48fb5d16bff05901c7e5a3511db15c4a45fdb))
* resolve JavaScript module loading issue and update blog styling ([1e92548](https://github.com/slemppa/rascal-ai/commit/1e92548b9ab00bc582c7a7c99f99444722cd7d36))
* resolve Service Worker causing JS module loading issues ([dbc283a](https://github.com/slemppa/rascal-ai/commit/dbc283a5e9678d36ae0b39e0adc7b52bda36bc43))
* update vercel.json for proper frontend build and SPA routing ([a0ec6aa](https://github.com/slemppa/rascal-ai/commit/a0ec6aa3e2548835098061e19cecf3a896e8834f))

## [1.43.0](https://github.com/slemppa/rascal-ai/compare/v1.42.0...v1.43.0) (2025-08-22)


### ✨ Features

* shared header; AI Due Diligence page & CTA ([9f5df30](https://github.com/slemppa/rascal-ai/commit/9f5df30c57d5b037f16ada5d38dcd1f98da8b098))

## [1.42.0](https://github.com/slemppa/rascal-ai/compare/v1.41.0...v1.42.0) (2025-08-21)


### ✨ Features

* add remaining blog API endpoints and test utilities ([22868f8](https://github.com/slemppa/rascal-ai/commit/22868f8ee5a3b0b8034ecb73483d1fce9eccaa80))
* complete blog system and other feature updates ([da66595](https://github.com/slemppa/rascal-ai/commit/da66595e40671260adfbd678247bd169875eac87))
* migrate blog APIs from N8N to direct Supabase queries ([993eff8](https://github.com/slemppa/rascal-ai/commit/993eff81099f9f5afce5ba6a78e568325f8b08ba))

## [1.41.0](https://github.com/slemppa/rascal-ai/compare/v1.40.1...v1.41.0) (2025-08-21)


### ✨ Features

* **dev:** lisää dev-ympäristön työkalut ja sivut ([2f7fb79](https://github.com/slemppa/rascal-ai/commit/2f7fb79e8f383e61f409719f24c3f16237c36301))

### [1.40.1](https://github.com/slemppa/rascal-ai/compare/v1.40.0...v1.40.1) (2025-08-21)


### 🐛 Bug Fixes

* **auth:** pakota auth-modalin otsikon ja tekstien väri valkoiseksi ([7985400](https://github.com/slemppa/rascal-ai/commit/79854001844228e4a40e91da39404289579ed04f))
* **posts:** korjaa JSX syntaksivirheet ja palauta julkaisu-modaali ([3b56bbd](https://github.com/slemppa/rascal-ai/commit/3b56bbd464e5cab9bd23e924666f8a90386ad6b0))

## [1.40.0](https://github.com/slemppa/rascal-ai/compare/v1.39.1...v1.40.0) (2025-08-20)


### ♻️ Code Refactoring

* update sidebar to VAPI dashboard style ([7d53c68](https://github.com/slemppa/rascal-ai/commit/7d53c6816ab1409005948de72e6b5cb543f0df38))


### ✨ Features

* add blocked number filter to mass-call and validate-sheet APIs ([17a24d4](https://github.com/slemppa/rascal-ai/commit/17a24d4f69c95d5b4c60e86acfee75d979fa0a49))
* add Google Analytics tracking ([3ddd789](https://github.com/slemppa/rascal-ai/commit/3ddd7890fd24d233e2f072910299e29650475477))
* add hamburger menu, Instagram icon and update favicon ([71dcba5](https://github.com/slemppa/rascal-ai/commit/71dcba50d63ddbb67cd00a96099163f6fe6e64b3))
* LandingPage redesign - ammattimainen design ja koko sivun leveys ([769dbe8](https://github.com/slemppa/rascal-ai/commit/769dbe8fa9aea895c67520e33617eeed6caf336e))
* LandingPage redesign - ammattimainen design ja tiivistetty layout ([0f52fa2](https://github.com/slemppa/rascal-ai/commit/0f52fa29b40b677e0b683a63b28c5c6d30daf23e))
* lisää viestien kokonaishinta DashboardPage stats-osioon ([70316cc](https://github.com/slemppa/rascal-ai/commit/70316cc8932ff2cf6525a6ba72d1ec640087d9b9))
* rebrand ContentStrategyPage and add KPI functionality ([0067807](https://github.com/slemppa/rascal-ai/commit/0067807eea66b14b9b336d277082f489c11c8829))


### 💄 Styles

* brändi yhtenäinen /calls, /ai-chat, help ja asetukset ([9fa5978](https://github.com/slemppa/rascal-ai/commit/9fa59787c54c3733d6526095f05cea959be9287d))

### [1.39.1](https://github.com/slemppa/rascal-ai/compare/v1.39.0...v1.39.1) (2025-08-18)


### 🐛 Bug Fixes

* improve mass call modal layout and SMS preview ([c459013](https://github.com/slemppa/rascal-ai/commit/c4590130a4f922c9b3fee90fca1116789242c632))

## [1.39.0](https://github.com/slemppa/rascal-ai/compare/v1.38.0...v1.39.0) (2025-08-18)


### ✨ Features

* improve placeholder image handling in blog-newsletter ([ee1f4d7](https://github.com/slemppa/rascal-ai/commit/ee1f4d7a6544651348051f337f99d475bf6f0e6b))

## [1.38.0](https://github.com/slemppa/rascal-ai/compare/v1.37.0...v1.38.0) (2025-08-18)


### ✨ Features

* update EditCallTypeModal and CallPanel components ([d11efb4](https://github.com/slemppa/rascal-ai/commit/d11efb4222769a5a20c6d437b53ab6acb1a5ec7d))

## [1.37.0](https://github.com/slemppa/rascal-ai/compare/v1.36.0...v1.37.0) (2025-08-17)


### 📚 Documentation

* **help:** update calls section for new modal flows and scheduling ([6a598fb](https://github.com/slemppa/rascal-ai/commit/6a598fbf23a85e81c5e26e077afd11fe2ac1242d))


### ✨ Features

* **calls:** CSV-filtterit, pending-toiminnot ja UI-korjaukset ([7e04a05](https://github.com/slemppa/rascal-ai/commit/7e04a053115250e844f0f68b4595ce5e0a914354))

## [1.36.0](https://github.com/slemppa/rascal-ai/compare/v1.35.0...v1.36.0) (2025-08-15)


### 🐛 Bug Fixes

* **api:** allow anon key with user token; ui: send Authorization ([9cb3cd6](https://github.com/slemppa/rascal-ai/commit/9cb3cd609756a2603a130a8f6c049728d0442caa))
* **api:** create Supabase client lazily with service or anon+token ([1608b43](https://github.com/slemppa/rascal-ai/commit/1608b4376ddbd0dd5793775cb2d3247f4ba84c53))
* **api:** fallback to NEXT_PUBLIC_SUPABASE_URL; env diagnostics ([0353d33](https://github.com/slemppa/rascal-ai/commit/0353d332bda0474c5a14057204d4661da30daaf8))
* **api:** robust CSV fetch for Google Sheets (gid, timeout) ([4058eb2](https://github.com/slemppa/rascal-ai/commit/4058eb21ebf1a2df6ce092e40d251d5694b7a65d))
* **api:** use SUPABASE_URL fallback; send voice_id; round time ([15a64d1](https://github.com/slemppa/rascal-ai/commit/15a64d18424e00754dd050a0600616c6752bd999))


### ✨ Features

* **calls:** single-call modal flow; phone normalization ([6a4dc87](https://github.com/slemppa/rascal-ai/commit/6a4dc8725fee1503711561fe381b7a5bba8dfe07))

## [1.35.0](https://github.com/slemppa/rascal-ai/compare/v1.34.0...v1.35.0) (2025-08-15)


### 🐛 Bug Fixes

* korjaa admin paneelin Viestit-tabin virheenkäsittelyn ([0c16e98](https://github.com/slemppa/rascal-ai/commit/0c16e981ba3b598a00feb21acb612ef4a9330e61))
* korjaa admin-message-logs API sarakkeet ([6bad3b4](https://github.com/slemppa/rascal-ai/commit/6bad3b4746352f61b14e20095eb12a0a1e37ea47))


### ✨ Features

* **calls:** use backend for mass-calls; enforce 00/30 scheduling ([32bc02c](https://github.com/slemppa/rascal-ai/commit/32bc02c8566385a03a6687beda3034d114a32926))

## [1.34.0](https://github.com/slemppa/rascal-ai/compare/v1.33.2...v1.34.0) (2025-08-14)


### ✨ Features

* add first_sms field and Text Messages tab for call types ([e6b7273](https://github.com/slemppa/rascal-ai/commit/e6b727383aab4d2e2a9c863474a07565cf87c554))


### 🐛 Bug Fixes

* korjattu CallPanel padding ja lisätty outbound/inbound tilastot ([0f214d7](https://github.com/slemppa/rascal-ai/commit/0f214d751b2792c61bed286c52ff617a6cae9b15))

### [1.33.2](https://github.com/slemppa/rascal-ai/compare/v1.33.1...v1.33.2) (2025-08-13)


### 🐛 Bug Fixes

* **call-logs:** CSV export uses filters; email + crm_id capture ([d38f527](https://github.com/slemppa/rascal-ai/commit/d38f5274458949535f47835da718e1222e51aa76))

### [1.33.1](https://github.com/slemppa/rascal-ai/compare/v1.33.0...v1.33.1) (2025-08-13)


### ✨ Features

* **calls:** tallenna contact id crm_id-kenttään Mika-mass-calls ([c8580b1](https://github.com/slemppa/rascal-ai/commit/c8580b1479c377d8a03ec59acf3d9b85f8706a3f))

## [1.33.0](https://github.com/slemppa/rascal-ai/compare/v1.32.0...v1.33.0) (2025-08-13)


### ✨ Features

* **admin:** näytä versionumero package.jsonista ([6677ffd](https://github.com/slemppa/rascal-ai/commit/6677ffddafe6d4386fe9cdc0c5fbaef43c0556d9))

## [1.32.0](https://github.com/slemppa/rascal-ai/compare/v1.31.1...v1.32.0) (2025-08-13)


### ✨ Features

* **validate-sheet:** fallback ilman gid ja varalle gid=0 ([cfb69b8](https://github.com/slemppa/rascal-ai/commit/cfb69b86ee003c653edbef12b9536995f2f195b7))

### [1.31.1](https://github.com/slemppa/rascal-ai/compare/v1.31.0...v1.31.1) (2025-08-13)


### 🔧 Chores

* **manage-posts:** paikalliset muutokset ([d5e4a2b](https://github.com/slemppa/rascal-ai/commit/d5e4a2b78a3300413b29fa5d08b357b19b2fd2dc))

## [1.31.0](https://github.com/slemppa/rascal-ai/compare/v1.30.2...v1.31.0) (2025-08-13)


### ✨ Features

* **validate-sheet:** CSV-virhekäsittely, gid-tuki ja 'puhelinnumero' ([07d58a7](https://github.com/slemppa/rascal-ai/commit/07d58a71986757b0bc1bf9e90f6cad73bde6fc8d))

### [1.30.2](https://github.com/slemppa/rascal-ai/compare/v1.30.1...v1.30.2) (2025-08-12)


### ✨ Features

* **mika:** 'Lisää valitut' avaa calltype‑modaalin valituille ([0116d84](https://github.com/slemppa/rascal-ai/commit/0116d84574b661ae40dd40e4fef9cb5420565e12))

### [1.30.1](https://github.com/slemppa/rascal-ai/compare/v1.30.0...v1.30.1) (2025-08-11)


### 🐛 Bug Fixes

* **landing:** testimonial carousel styles and HTML structure ([05b3c3e](https://github.com/slemppa/rascal-ai/commit/05b3c3e3d984ab3570f2ae63f586c9ea94b7e4e3))

## [1.30.0](https://github.com/slemppa/rascal-ai/compare/v1.29.3...v1.30.0) (2025-08-11)


### ✨ Features

* **landing:** v4 visuals ([047292d](https://github.com/slemppa/rascal-ai/commit/047292dd53ac9ea6505bff2de6f945d12430eca0))

### [1.29.3](https://github.com/slemppa/rascal-ai/compare/v1.29.2...v1.29.3) (2025-08-11)


### 🐛 Bug Fixes

* **calls:** Yhteenveto venyy ja modaalin max‑korkeus 30vh ([d23a431](https://github.com/slemppa/rascal-ai/commit/d23a431d17068f6c5385237f2a195cd924be5315))

### [1.29.2](https://github.com/slemppa/rascal-ai/compare/v1.29.1...v1.29.2) (2025-08-10)


### 🔧 Chores

* **calls:** remove Mika Special VIP card from calls tab ([a36b8d2](https://github.com/slemppa/rascal-ai/commit/a36b8d2bf364f613942f82eed7b7911b022760d2))

### [1.29.1](https://github.com/slemppa/rascal-ai/compare/v1.29.0...v1.29.1) (2025-08-10)


### 🐛 Bug Fixes

* **calls:** mass-calls for all; Mika Special only ([957734e](https://github.com/slemppa/rascal-ai/commit/957734eb6659af46ee24316ccb5c058a5d497dd4))

## [1.29.0](https://github.com/slemppa/rascal-ai/compare/v1.28.1...v1.29.0) (2025-08-10)


### ✨ Features

* **posts:** send caption with new post to idea-generation ([675bce5](https://github.com/slemppa/rascal-ai/commit/675bce5aaa4dd9568b6896dc757b1ef73b7be0c1))

### [1.28.1](https://github.com/slemppa/rascal-ai/compare/v1.28.0...v1.28.1) (2025-08-10)


### ✨ Features

* **calls:** add analytics fields and guidance to modals ([63bf2d8](https://github.com/slemppa/rascal-ai/commit/63bf2d8835121c523c1b56fc6aaa1bd1c7bb8869))

## [1.28.0](https://github.com/slemppa/rascal-ai/compare/v1.27.0...v1.28.0) (2025-08-08)


### ✨ Features

* add email support to call logs and Google Sheets validation ([4ccb0ee](https://github.com/slemppa/rascal-ai/commit/4ccb0eeca93d0249a64b44bfc2bc5606b7370b49))
* add Mika special contacts and mass call functionality ([dcf1854](https://github.com/slemppa/rascal-ai/commit/dcf185479582a054f67f72a97c6ee0ea84c0fabb))

## [1.27.0](https://github.com/slemppa/rascal-ai/compare/v1.26.0...v1.27.0) (2025-08-07)


### ✨ Features

* add contact form webhook and update landing page header ([cdf9815](https://github.com/slemppa/rascal-ai/commit/cdf9815de2f1143f1bbcc20996e63104b3ef2fea))


### ♻️ Code Refactoring

* poista debug-logeja kaikista sivuista ([258f3ab](https://github.com/slemppa/rascal-ai/commit/258f3abdbb0e1eb12038ba649ad526a0d56912a1))


### 🐛 Bug Fixes

* implement Vercel Blob file upload for AI chat knowledge base ([33fe4f7](https://github.com/slemppa/rascal-ai/commit/33fe4f7f60212f7f906c4a867f2821735c88bd85))

## [1.26.0](https://github.com/slemppa/rascal-ai/compare/v1.25.1...v1.26.0) (2025-08-06)


### 🐛 Bug Fixes

* aseta selectedVoice käyttäjän oman äänen voice_id:ksi ([6cac287](https://github.com/slemppa/rascal-ai/commit/6cac287b79eeec75f15dbb045518451a6594a347))
* remove voice_id from call_types table and code ([3ac2ce9](https://github.com/slemppa/rascal-ai/commit/3ac2ce99cf4729539aa8dd2b0ac6026c181a57a4))
* voice_id tallennus mass-call ja single-call toiminnallisuudessa ([fb007b7](https://github.com/slemppa/rascal-ai/commit/fb007b70c8a1c4faa54e55787cab9ecad2a8c2c4))
* voiceover display and media handling in posts page ([18cabc5](https://github.com/slemppa/rascal-ai/commit/18cabc5faf5c10812c5e26ec85588ee5bb712160))


### ✨ Features

* automaattinen textarea korkeuden säätö strategy-sivulla ([082c102](https://github.com/slemppa/rascal-ai/commit/082c1024bfa8575ed70a5b8d669bf2d9e2ba2edb))
* implement auto-logout with inactivity detection ([c8e1d99](https://github.com/slemppa/rascal-ai/commit/c8e1d991d300455b6f238b6f0b2baf629c517f69))

### [1.25.1](https://github.com/slemppa/rascal-ai/compare/v1.25.0...v1.25.1) (2025-08-04)


### 🐛 Bug Fixes

* korjattu settings-sivun Mixpost-yhdistys ja avatar-kuvien haku ([032bcd6](https://github.com/slemppa/rascal-ai/commit/032bcd645d206d02fda5bfeaed10362cecdf79e6))

## [1.25.0](https://github.com/slemppa/rascal-ai/compare/v1.24.3...v1.25.0) (2025-08-04)


### 🐛 Bug Fixes

* Avatar-sarake näyttää nyt get-reels.js endpointin dataa ([53d1f30](https://github.com/slemppa/rascal-ai/commit/53d1f30d682143d244487343c6ea54cb8c131674))
* korjaa Avatar-sarake ja palauta ManagePostsPage ([b7515c3](https://github.com/slemppa/rascal-ai/commit/b7515c374a2a8aa726ba442822a55b5a0d8e7dd9))
* korjattu AIChatPage syntaksivirhe ([5b148c1](https://github.com/slemppa/rascal-ai/commit/5b148c1216f3c959c133a16b6ed38eabb265d761))


### ✨ Features

* päivitetty ResetPassword UI ja lisätty viestimaksut ([c48c643](https://github.com/slemppa/rascal-ai/commit/c48c6430a523671a8c681b7e7adbc2cfb6dbfa4e))

### [1.24.3](https://github.com/slemppa/rascal-ai/compare/v1.24.2...v1.24.3) (2025-08-04)


### 🐛 Bug Fixes

* korjattu API-kutsu CallPanel-komponentissa ([a410fd1](https://github.com/slemppa/rascal-ai/commit/a410fd1722c6da48e29bea06251df3cf4e519fcb))
* null reference errors and carousel navigation in posts page ([9832097](https://github.com/slemppa/rascal-ai/commit/9832097183eb3d54ca4edf01f019f0e02f9ef256))

### [1.24.2](https://github.com/slemppa/rascal-ai/compare/v1.24.1...v1.24.2) (2025-08-03)


### 🐛 Bug Fixes

* kriittiset suorituskykyoptimointeja - LCP 25s -> optimoitu ([0d07753](https://github.com/slemppa/rascal-ai/commit/0d077536318aefa01577dbe7bf28a011b231f95f))
* modal visibility and remove Mixpost from posts page ([62ab3e7](https://github.com/slemppa/rascal-ai/commit/62ab3e74a24ca65679a4dbd0d7f8c698ca1cbd55))


### ✨ Features

* add social media channel selection for publishing posts ([32cde15](https://github.com/slemppa/rascal-ai/commit/32cde1508ce99a66400c403ae76e3f95ca3f0092))
* analytics backend & iframe components, dashboard cleanup ([cc33b44](https://github.com/slemppa/rascal-ai/commit/cc33b442406f97a492f1fcf0728273f4abaf8931))

### [1.24.1](https://github.com/slemppa/rascal-ai/compare/v1.24.0...v1.24.1) (2025-07-31)


### ♻️ Code Refactoring

* Remove unused social media dashboard and navigation ([ba3da2b](https://github.com/slemppa/rascal-ai/commit/ba3da2bcb82efad7e65091feb997a206ed4979a0))
* yhtenäiset napit Button.jsx, poistettu vanhat nappityylit ([14748ce](https://github.com/slemppa/rascal-ai/commit/14748ce6a8183fa81438ff9249dfc4d6f8a08908))


### 🐛 Bug Fixes

* CSS-spesifisyysongelmat korjattu, modaalit toimivat oikein ([e197170](https://github.com/slemppa/rascal-ai/commit/e197170a9159000d71652ea9e9a59a2228adb36a))
* korjattu media-data ja mixpost_api_token lähettäminen ([e0826c5](https://github.com/slemppa/rascal-ai/commit/e0826c516343a20eb7980293cecba580a1d62142))
* korjattu media-data lähettäminen webhook:iin kaikille tyypeille ([0f4cb39](https://github.com/slemppa/rascal-ai/commit/0f4cb399bda22e702085645008b97a428bc514a6))
* korjattu Supabase-integraatio julkaisuprosessissa ([3cd7fb2](https://github.com/slemppa/rascal-ai/commit/3cd7fb2d48b75bf0bbbf4d7ff5c5ff629d6ba0a8))
* poista rekisteröitymislinkki SignIn-modalista ([dcbd55e](https://github.com/slemppa/rascal-ai/commit/dcbd55e9857c16971eb5bf1f40fda9fbc4f00330))

## [1.24.0](https://github.com/slemppa/rascal-ai/compare/v1.23.3...v1.24.0) (2025-07-27)


### 🐛 Bug Fixes

* lisätty puuttuvat /terms ja /privacy reitit App.jsx:ään ([e2904f6](https://github.com/slemppa/rascal-ai/commit/e2904f649dd33ae0677297212d23a7ceb0202de8))


### ✨ Features

* Add social media integration with Mixpost API ([3671416](https://github.com/slemppa/rascal-ai/commit/3671416a629329abd22d3ef6325f1cd156c8a094))
* lisätty sosiaalisen median meta-tagit ja PageMeta-komponentti ([f75c64a](https://github.com/slemppa/rascal-ai/commit/f75c64af112e77900a55dcc5bdc9622b64a503db))


### 🔧 Chores

* **release:** 1.10.0 ([d920354](https://github.com/slemppa/rascal-ai/commit/d92035458f383b9765f519094e82a79db80e19b1))
* Update version to 1.23.4 ([ae4fd5a](https://github.com/slemppa/rascal-ai/commit/ae4fd5ae7e72d84598a10d32ac79299adfc27786))

## [1.10.0](https://github.com/slemppa/rascal-ai/compare/v1.23.3...v1.10.0) (2025-07-27)


### 🐛 Bug Fixes

* lisätty puuttuvat /terms ja /privacy reitit App.jsx:ään ([e2904f6](https://github.com/slemppa/rascal-ai/commit/e2904f649dd33ae0677297212d23a7ceb0202de8))


### ✨ Features

* Add social media integration with Mixpost API ([3671416](https://github.com/slemppa/rascal-ai/commit/3671416a629329abd22d3ef6325f1cd156c8a094))
* lisätty sosiaalisen median meta-tagit ja PageMeta-komponentti ([f75c64a](https://github.com/slemppa/rascal-ai/commit/f75c64af112e77900a55dcc5bdc9622b64a503db))

## [1.23.3](https://github.com/slemppa/rascal-ai/compare/v1.23.2...v1.23.3) (2025-01-27)

### 🚀 BREAKING CHANGES

* **database:** Siirrytty Airtablesta Supabaseen - kaikki data on nyt Supabasessa
* **auth:** Kirjautuminen käyttää nyt Supabase Authia Airtable-autentikaation sijaan

### ✨ Features

* **admin:** Admin-paneelin puhelut-tab parannettu - poistettu Yhteenveto ja Tyyppi sarakkeet, lisätty Käyttäjä-sarake
* **admin:** Admin-paneelin viestit-tab lisätty kuukausittainen aggregaatio käyttäjittäin
* **admin:** Admin-paneelin käyttäjät-tab lisätty User ID -sarake (piilotettu oletuksena)
* **routing:** Korjattu reititys - kirjautumattomat käyttäjät ohjataan landing page -sivulle

### 🧹 Chores

* **api:** Poistettu ylimääräiset single-call API endpointit (2 ja 3)
* **database:** Täydellinen Supabase-migraatio valmis - kaikki toiminnallisuus käyttää nyt Supabasea

## [1.9.0](https://github.com/slemppa/rascal-ai/compare/v1.6.1...v1.9.0) (2025-07-26)


### 📚 Documentation

* ohjeet Airtable-Supabase-synkronointiin ([43be6d8](https://github.com/slemppa/rascal-ai/commit/43be6d82bdb5c2cd6e1948f92542baaaeffd0fb6))


### 🔧 Chores

* aloitettu supabase-migraatio omassa branchissa ([4e4b0c2](https://github.com/slemppa/rascal-ai/commit/4e4b0c2a63c0b2e5d100e28abf62c4086b6a15f8))
* **release:** 1.6.2 ([e174b4f](https://github.com/slemppa/rascal-ai/commit/e174b4fb739d368cb2eeabac11dad360f389302d))
* **release:** 1.7.0 ([2cc57cb](https://github.com/slemppa/rascal-ai/commit/2cc57cb6af4c6a47be813db82a6048757e6283c7))
* **release:** 1.8.0 ([facf892](https://github.com/slemppa/rascal-ai/commit/facf892cf35012abcde5b2559d80b3fb6a8d0ffc))


### 🐛 Bug Fixes

* korjaa logout, sessionin tyhjennys ja supabase-import-polku ([5bd56e8](https://github.com/slemppa/rascal-ai/commit/5bd56e87fc08b829a7852b451668cd021a931272))
* korjattu CallPanel.jsx - poistettu callLogsStats state ([a87cd59](https://github.com/slemppa/rascal-ai/commit/a87cd591a620694bd959fc7085ea7bf49c402906))
* rename files to remove spaces for Vercel compatibility ([e0a528a](https://github.com/slemppa/rascal-ai/commit/e0a528a9497e5962a506e670979dc37a2ae6538e))
* supabase env, js-importit ja dev-server debugointi ([ebd4607](https://github.com/slemppa/rascal-ai/commit/ebd4607e7dc40686bdc681ace37485b53349bccc))


### ✨ Features

* add /calls page with full functionality from main branch ([9cdd13c](https://github.com/slemppa/rascal-ai/commit/9cdd13c6edf8e653225fa71ed9c361683dce91e0))
* admin-paneelin parannukset ja reitityksen korjaus ([335aa69](https://github.com/slemppa/rascal-ai/commit/335aa6984271dd4f1bac15f46ec25989245496ce))
* **auth:** lisää käyttäjäprofiilin haku kirjautumisen jälkeen ([e9bdfe2](https://github.com/slemppa/rascal-ai/commit/e9bdfe22fab620a8d0c8f9591a770400a3c2d671))
* complete Supabase migration with new features ([e205a0c](https://github.com/slemppa/rascal-ai/commit/e205a0c00bcb1277d1a28c8ac64cc598a08eacb2))
* implement strategy page with N8N integration and UI improvements ([6ab466a](https://github.com/slemppa/rascal-ai/commit/6ab466aba11e43056885bd65525d7e83b1fb6547))
* supabase-integraatio, feature flagit ja dynaaminen navigaatio ([217b924](https://github.com/slemppa/rascal-ai/commit/217b924e05c176bb1e59807d447438d5dd5e525e))

## [1.8.0](https://github.com/slemppa/rascal-ai/compare/v1.6.1...v1.8.0) (2025-07-26)


### 📚 Documentation

* ohjeet Airtable-Supabase-synkronointiin ([43be6d8](https://github.com/slemppa/rascal-ai/commit/43be6d82bdb5c2cd6e1948f92542baaaeffd0fb6))


### 🐛 Bug Fixes

* korjaa logout, sessionin tyhjennys ja supabase-import-polku ([5bd56e8](https://github.com/slemppa/rascal-ai/commit/5bd56e87fc08b829a7852b451668cd021a931272))
* supabase env, js-importit ja dev-server debugointi ([ebd4607](https://github.com/slemppa/rascal-ai/commit/ebd4607e7dc40686bdc681ace37485b53349bccc))


### ✨ Features

* add /calls page with full functionality from main branch ([9cdd13c](https://github.com/slemppa/rascal-ai/commit/9cdd13c6edf8e653225fa71ed9c361683dce91e0))
* **auth:** lisää käyttäjäprofiilin haku kirjautumisen jälkeen ([e9bdfe2](https://github.com/slemppa/rascal-ai/commit/e9bdfe22fab620a8d0c8f9591a770400a3c2d671))
* implement strategy page with N8N integration and UI improvements ([6ab466a](https://github.com/slemppa/rascal-ai/commit/6ab466aba11e43056885bd65525d7e83b1fb6547))
* supabase-integraatio, feature flagit ja dynaaminen navigaatio ([217b924](https://github.com/slemppa/rascal-ai/commit/217b924e05c176bb1e59807d447438d5dd5e525e))


### 🔧 Chores

* aloitettu supabase-migraatio omassa branchissa ([4e4b0c2](https://github.com/slemppa/rascal-ai/commit/4e4b0c2a63c0b2e5d100e28abf62c4086b6a15f8))
* **release:** 1.6.2 ([e174b4f](https://github.com/slemppa/rascal-ai/commit/e174b4fb739d368cb2eeabac11dad360f389302d))
* **release:** 1.7.0 ([2cc57cb](https://github.com/slemppa/rascal-ai/commit/2cc57cb6af4c6a47be813db82a6048757e6283c7))

## [1.7.0](https://github.com/slemppa/rascal-ai/compare/v1.6.1...v1.7.0) (2025-07-26)


### 🔧 Chores

* aloitettu supabase-migraatio omassa branchissa ([4e4b0c2](https://github.com/slemppa/rascal-ai/commit/4e4b0c2a63c0b2e5d100e28abf62c4086b6a15f8))
* **release:** 1.6.2 ([e174b4f](https://github.com/slemppa/rascal-ai/commit/e174b4fb739d368cb2eeabac11dad360f389302d))


### 📚 Documentation

* ohjeet Airtable-Supabase-synkronointiin ([43be6d8](https://github.com/slemppa/rascal-ai/commit/43be6d82bdb5c2cd6e1948f92542baaaeffd0fb6))


### 🐛 Bug Fixes

* korjaa logout, sessionin tyhjennys ja supabase-import-polku ([5bd56e8](https://github.com/slemppa/rascal-ai/commit/5bd56e87fc08b829a7852b451668cd021a931272))
* supabase env, js-importit ja dev-server debugointi ([ebd4607](https://github.com/slemppa/rascal-ai/commit/ebd4607e7dc40686bdc681ace37485b53349bccc))


### ✨ Features

* add /calls page with full functionality from main branch ([9cdd13c](https://github.com/slemppa/rascal-ai/commit/9cdd13c6edf8e653225fa71ed9c361683dce91e0))
* **auth:** lisää käyttäjäprofiilin haku kirjautumisen jälkeen ([e9bdfe2](https://github.com/slemppa/rascal-ai/commit/e9bdfe22fab620a8d0c8f9591a770400a3c2d671))
* implement strategy page with N8N integration and UI improvements ([6ab466a](https://github.com/slemppa/rascal-ai/commit/6ab466aba11e43056885bd65525d7e83b1fb6547))
* supabase-integraatio, feature flagit ja dynaaminen navigaatio ([217b924](https://github.com/slemppa/rascal-ai/commit/217b924e05c176bb1e59807d447438d5dd5e525e))

### [1.6.2](https://github.com/slemppa/rascal-ai/compare/v1.6.1...v1.6.2) (2025-07-01)


### 🔧 Chores

* aloitettu supabase-migraatio omassa branchissa ([4e4b0c2](https://github.com/slemppa/rascal-ai/commit/4e4b0c2a63c0b2e5d100e28abf62c4086b6a15f8))

### [1.6.1](https://github.com/slemppa/rascal-ai/compare/v1.6.0...v1.6.1) (2025-07-01)


### 💄 Styles

* modernisoi karusellin napit ja pisteet brändin väreillä ([18a4af7](https://github.com/slemppa/rascal-ai/commit/18a4af7e9ca02db2230d3beb4219f55e617a6fcb))

## [1.6.0](https://github.com/slemppa/rascal-ai/compare/v1.5.1...v1.6.0) (2025-07-01)


### ✨ Features

* **layout:** responsiivisuus ja grid dashboardiin & postit ([615dd1b](https://github.com/slemppa/rascal-ai/commit/615dd1b403a977402b0e263161c30549aecb39de))
* parannettu julkaisujen hallinta modaalia ([2d6e088](https://github.com/slemppa/rascal-ai/commit/2d6e088e51d6846afa6769e159fba266594fbf5e))

### [1.5.1](https://github.com/slemppa/rascal-ai/compare/v1.5.0...v1.5.1) (2025-07-01)


### 🐛 Bug Fixes

* korjaa SettingsPage visuaaliset ongelmat ([40bb552](https://github.com/slemppa/rascal-ai/commit/40bb552404b6054259bb2517f85e4bf864e61cec))

## [1.5.0](https://github.com/slemppa/rascal-ai/compare/v1.4.11...v1.5.0) (2025-07-01)


### ✨ Features

* lisää placeholder-tekstit ja kehitysvaroitukset ([4c933b1](https://github.com/slemppa/rascal-ai/commit/4c933b174322a8f3e25e9a29ec0a2f3e67cca6b8))

### [1.4.11](https://github.com/slemppa/rascal-ai/compare/v1.4.10...v1.4.11) (2025-06-30)


### 🐛 Bug Fixes

* korjaa avatar-upload webhook-ongelmat ([8195fda](https://github.com/slemppa/rascal-ai/commit/8195fda7df4b611e1099563645e59fb06bd8a660))

### [1.4.10](https://github.com/slemppa/rascal-ai/compare/v1.4.9...v1.4.10) (2025-06-30)


### 🐛 Bug Fixes

* Get companyId from FormData and include in webhook payload ([bae460c](https://github.com/slemppa/rascal-ai/commit/bae460ca5f91ca9a0e4fc8d444c6bc706438cf40))

### [1.4.9](https://github.com/slemppa/rascal-ai/compare/v1.4.8...v1.4.9) (2025-06-30)


### ✨ Features

* add N8N webhook after avatar upload ([dbf3395](https://github.com/slemppa/rascal-ai/commit/dbf3395b92bd236239a040af573b1d84ebed3683))

### [1.4.8](https://github.com/slemppa/rascal-ai/compare/v1.4.7...v1.4.8) (2025-06-30)


### 🐛 Bug Fixes

* use formidable for multipart form parsing ([988aaad](https://github.com/slemppa/rascal-ai/commit/988aaad4ac96c7b0d77ae2c8d833e34c5e300110))

### [1.4.7](https://github.com/slemppa/rascal-ai/compare/v1.4.6...v1.4.7) (2025-06-30)


### 🐛 Bug Fixes

* use FormData for file uploads ([c5f6e8f](https://github.com/slemppa/rascal-ai/commit/c5f6e8fee0a4f9d5bc46a2eaf4a0be4a10a55691))

### [1.4.6](https://github.com/slemppa/rascal-ai/compare/v1.4.5...v1.4.6) (2025-06-30)


### 🐛 Bug Fixes

* add debug logging for filename parameter ([be2a9c9](https://github.com/slemppa/rascal-ai/commit/be2a9c9dff7749223fae491065332496a237de8c))

### [1.4.5](https://github.com/slemppa/rascal-ai/compare/v1.4.4...v1.4.5) (2025-06-30)


### 🐛 Bug Fixes

* remove bodyParser config for server upload ([b94a275](https://github.com/slemppa/rascal-ai/commit/b94a275569de49300138277fe4c9a4c08f470787))

### [1.4.4](https://github.com/slemppa/rascal-ai/compare/v1.4.3...v1.4.4) (2025-06-30)


### 🐛 Bug Fixes

* remove bodyParser: false for client upload ([d3655b5](https://github.com/slemppa/rascal-ai/commit/d3655b5654e9d9a0eee4451d4913a306b2d708da))

### [1.4.3](https://github.com/slemppa/rascal-ai/compare/v1.4.2...v1.4.3) (2025-06-30)


### ✨ Features

* switch to client upload for avatar files ([8cbc061](https://github.com/slemppa/rascal-ai/commit/8cbc061fe9d7b84561b7bc30175ded850403df7c))

### [1.4.2](https://github.com/slemppa/rascal-ai/compare/v1.4.1...v1.4.2) (2025-06-30)


### 🔧 Chores

* trigger redeploy after plan upgrade ([a0080a7](https://github.com/slemppa/rascal-ai/commit/a0080a706adf8d55f0ae3cc79f42f10b3fce1ee4))

### [1.4.1](https://github.com/slemppa/rascal-ai/compare/v1.4.0...v1.4.1) (2025-06-30)


### 🐛 Bug Fixes

* use @vercel/blob put in avatar-upload route (resolves 500) ([76aabf0](https://github.com/slemppa/rascal-ai/commit/76aabf0d6dd398f52b0b193dc5180a3f6f286bb2))

## [1.4.0](https://github.com/slemppa/rascal-ai/compare/v1.3.0...v1.4.0) (2025-06-29)


### ✨ Features

* bento grid, muokattava modal, media, js clamp, datetime-local ([d6ceb4f](https://github.com/slemppa/rascal-ai/commit/d6ceb4f8cd5c09971a37e79843cfe523596d8aae))

## [1.3.0](https://github.com/slemppa/rascal-ai/compare/v1.2.1...v1.3.0) (2025-06-29)


### ✨ Features

* dashboard näyttää tulevat postaukset ja visuaalisen listan ([ea5e4db](https://github.com/slemppa/rascal-ai/commit/ea5e4db80c21c64ea9f27cc14f332af26d37287e))

### [1.2.1](https://github.com/slemppa/rascal-ai/compare/v1.2.0...v1.2.1) (2025-06-29)


### 🐛 Bug Fixes

* Dashboard käyttää nyt /api/get-posts endpointia ([d86e71a](https://github.com/slemppa/rascal-ai/commit/d86e71a2d8f6441a7c7aa9ee9d3f8342c27c12ef))

## [1.2.0](https://github.com/slemppa/rascal-ai/compare/v1.1.16...v1.2.0) (2025-06-29)


### 🐛 Bug Fixes

* lisää fallback URL delete-files endpointtiin ([654ebbb](https://github.com/slemppa/rascal-ai/commit/654ebbbff4eb5ee11c911f775df0df61cfb7d1dc))
* lisää parempi debuggausta delete-files endpointtiin ([175bf79](https://github.com/slemppa/rascal-ai/commit/175bf79c2907b0eb9f8e72987eb33c11222c1fb5))


### ✨ Features

* yhtenäinen tumma yläpalkki kaikille pääsivuille (PageHeader) ([f8ae6b5](https://github.com/slemppa/rascal-ai/commit/f8ae6b5bd6808f198ab815c69b7a2120f9d6a4fe))

### [1.1.16](https://github.com/slemppa/rascal-ai/compare/v1.1.15...v1.1.16) (2025-06-29)


### 🐛 Bug Fixes

* korjaa Vercel-konfiguraatio API-endpointtien toimimiseksi ([4db76ee](https://github.com/slemppa/rascal-ai/commit/4db76ee6186e6a97886ac114fddca28eaf5ad9d3))

### [1.1.15](https://github.com/slemppa/rascal-ai/compare/v1.1.14...v1.1.15) (2025-06-29)


### 🐛 Bug Fixes

* paranna delete-files.js virheenkäsittelyä ja lokitusta ([3ef944f](https://github.com/slemppa/rascal-ai/commit/3ef944f39de72568aaf8532e154274a3b24ce03c))
* poista deprekoituneet rivit Husky-tiedostoista ([6b3e1c1](https://github.com/slemppa/rascal-ai/commit/6b3e1c162a5b80da81d3ec2e1e6a5704c48bf7a9))

### [1.1.14](https://github.com/slemppa/rascal-ai/compare/v1.1.13...v1.1.14) (2025-06-29)


### 🔧 Chores

* delete-files endpoint käyttää N8N_DELETE_FILES_URL env muuttujaa ([d974e60](https://github.com/slemppa/rascal-ai/commit/d974e600726552669c68d729c7280be90410f01c))

### [1.1.13](https://github.com/slemppa/rascal-ai/compare/v1.1.12...v1.1.13) (2025-06-29)


### 🐛 Bug Fixes

* lisätty duplex: 'half' tiedostojen upload-forwardaukseen ([4f6bf80](https://github.com/slemppa/rascal-ai/commit/4f6bf80c7424b02e17701b795bcb280213c9d303))

### [1.1.12](https://github.com/slemppa/rascal-ai/compare/v1.1.11...v1.1.12) (2025-06-29)


### 🐛 Bug Fixes

* yksinkertaistettu upload-knowledge endpoint ([1369152](https://github.com/slemppa/rascal-ai/commit/136915286d9b7ad637ea457b60da88e827e337b9))

### [1.1.11](https://github.com/slemppa/rascal-ai/compare/v1.1.10...v1.1.11) (2025-06-29)


### 🐛 Bug Fixes

* N8N_SECRET_KEY tarkistus ja header upload-knowledge endpointiin ([459f8dd](https://github.com/slemppa/rascal-ai/commit/459f8dd03f35fb913580e086c9fdc20b655e3533))

### [1.1.10](https://github.com/slemppa/rascal-ai/compare/v1.1.9...v1.1.10) (2025-06-29)


### 🐛 Bug Fixes

* N8N_SECRET_KEY tarkistus ja header ([bc94cf9](https://github.com/slemppa/rascal-ai/commit/bc94cf93c60dc093d333070d068d131b8b85b829))

### [1.1.9](https://github.com/slemppa/rascal-ai/compare/v1.1.8...v1.1.9) (2025-06-29)


### 🐛 Bug Fixes

* lisätty x-api-key header kaikkiin API-kutsuihin ([82203fe](https://github.com/slemppa/rascal-ai/commit/82203fe64a48ecbdb8e338dea137c52c839409e7))

### [1.1.8](https://github.com/slemppa/rascal-ai/compare/v1.1.7...v1.1.8) (2025-06-29)


### 🐛 Bug Fixes

* yksinkertaistettu vector-store-files endpoint ([ff646e3](https://github.com/slemppa/rascal-ai/commit/ff646e3fd89d6cc67bd3040e44df68a3abc75901))

### [1.1.7](https://github.com/slemppa/rascal-ai/compare/v1.1.6...v1.1.7) (2025-06-29)


### 🐛 Bug Fixes

* korjattu tiedostojen API-endpointit ja frontin funktiot ([58402f4](https://github.com/slemppa/rascal-ai/commit/58402f413169b3e4d7561991a23235e8d4c7bc10))

### [1.1.6](https://github.com/slemppa/rascal-ai/compare/v1.1.5...v1.1.6) (2025-06-29)


### 🐛 Bug Fixes

* **api:** GET vector-store-files käyttää taas N8N_VECTOR_STORE_FILES_URL ([013d394](https://github.com/slemppa/rascal-ai/commit/013d394f2bb5db53bbdf167691e38e16bcfcd2df))

### [1.1.5](https://github.com/slemppa/rascal-ai/compare/v1.1.4...v1.1.5) (2025-06-29)


### ✨ Features

* **api:** action feed/delete ja N8N_ASSISTANT_KNOWLEDGE_URL ([8e539c4](https://github.com/slemppa/rascal-ai/commit/8e539c47e5f44b7495c4f5da4363967d72e9196f))

### [1.1.4](https://github.com/slemppa/rascal-ai/compare/v1.1.3...v1.1.4) (2025-06-29)


### ✨ Features

* **ui:** tyhjätila-viesti tiedostolistaan, viimeistelyt ([818c49d](https://github.com/slemppa/rascal-ai/commit/818c49dfbab55e9d6132f0b88483f173679c4df2))

### [1.1.3](https://github.com/slemppa/rascal-ai/compare/v1.1.2...v1.1.3) (2025-06-29)


### ✨ Features

* **ui:** drag & drop tiedostolomake, moderni asettelu ([f202e9c](https://github.com/slemppa/rascal-ai/commit/f202e9cfce94b7576c6eef02af28c4e3ddcea9d7))

### [1.1.2](https://github.com/slemppa/rascal-ai/compare/v1.1.1...v1.1.2) (2025-06-29)


### ✨ Features

* **ui:** moderni tietokanta-näkymä, lomake ja tiedostot vierekkäin ([76c9338](https://github.com/slemppa/rascal-ai/commit/76c93385c86c424caabf7814b1810776c1044da6))

### [1.1.1](https://github.com/slemppa/rascal-ai/compare/v1.1.0...v1.1.1) (2025-06-29)


### 🐛 Bug Fixes

* **api:** GET-tuki vector-store-files endpointiin ([bb53d99](https://github.com/slemppa/rascal-ai/commit/bb53d99573c3de6fb9be96ddadc8035dd4b050b6))

## 1.1.0 (2025-06-29)


### ✨ Features

* implement semantic versioning system ([3314456](https://github.com/slemppa/rascal-ai/commit/3314456ab324ed24dfea2d3409a8e02d40f6bfd3))
* **ui:** parannettu landing page hero, chat-scroll fix, Lingui pois ([0744ad1](https://github.com/slemppa/rascal-ai/commit/0744ad12b2051e554b1fb919b6c5eb4b7da117e8))

## [1.0.0] - 2025-06-29

### ✨ Features
- Initial release of Rascal AI Dashboard
- Complete removal of Lingui internationalization system
- Single-language (Finnish) interface implementation
- Dashboard with post management functionality
- AI chat assistant with file upload capabilities
- Call management system with statistics
- Content strategy management
- User authentication and settings
- Responsive design for mobile and desktop

### 🐛 Bug Fixes
- Fixed build errors caused by Lingui dependencies
- Resolved import issues with @lingui/macro
- Corrected Vite configuration for production builds

### 🔧 Chores
- Removed all Lingui-related dependencies and configurations
- Updated package.json with proper versioning scripts
- Configured Vercel deployment pipeline
- Set up semantic versioning with standard-version 