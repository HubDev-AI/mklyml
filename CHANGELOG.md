# Changelog

## [0.3.0](https://github.com/HubDev-AI/mklyml/compare/core-v0.2.0...core-v0.3.0) (2026-03-10)


### Features

* add &gt;tag descendant target syntax for per-element styling ([#1](https://github.com/HubDev-AI/mklyml/issues/1)) ([056d7db](https://github.com/HubDev-AI/mklyml/commit/056d7dbcacfc336ed245b3e503f33f9720a20ba9))
* add 100 Google Fonts to font picker with auto-loading support ([#12](https://github.com/HubDev-AI/mklyml/issues/12)) ([21d2ada](https://github.com/HubDev-AI/mklyml/commit/21d2adaa6947dd037d59a1b70cc22694294cc604))
* expand Google Fonts to 305, fix style graph label selectors and img alignment ([#13](https://github.com/HubDev-AI/mklyml/issues/13)) ([7c519de](https://github.com/HubDev-AI/mklyml/commit/7c519de259de9b14193c5bc7525950b78ce391c9))


### Bug Fixes

* add missing styleHints for consistency across core blocks ([9b3fb98](https://github.com/HubDev-AI/mklyml/commit/9b3fb98c0e7db1005fcc05529acfee38e47c81db))
* decode &apos; entity and resolve nested var() fallbacks ([#6](https://github.com/HubDev-AI/mklyml/issues/6)) ([f5eb5c9](https://github.com/HubDev-AI/mklyml/commit/f5eb5c9461127009f593cedca22a7e5b19349f5c))
* decode HTML entities in block content extraction ([#10](https://github.com/HubDev-AI/mklyml/issues/10)) ([692d5a3](https://github.com/HubDev-AI/mklyml/commit/692d5a3e300a4b4f9ff7d959db8e2fcf1d87a800))
* emit user-defined variables as CSS custom properties and fix mixed tab/space indentation ([#7](https://github.com/HubDev-AI/mklyml/issues/7)) ([a09dca6](https://github.com/HubDev-AI/mklyml/commit/a09dca654b47a6e2069e3439840d47ae7099b63a))
* merge interleaved self rules during serialization ([#8](https://github.com/HubDev-AI/mklyml/issues/8)) ([eace13c](https://github.com/HubDev-AI/mklyml/commit/eace13c59d7bad42676adba6ab4da5a8d4cd8f8e))
* normalize style block serialization and reverse markdown text ([b7747f5](https://github.com/HubDev-AI/mklyml/commit/b7747f5af2f0925e6e348e889530515aae8ff7be))
* propagate inherited text styles and remove strong/em theme overrides ([0820a45](https://github.com/HubDev-AI/mklyml/commit/0820a4541f23c3f9f2f5ee0fd1575906cdb942d4))
* remove text-align expansion, add * list prefix ([#2](https://github.com/HubDev-AI/mklyml/issues/2)) ([cf15525](https://github.com/HubDev-AI/mklyml/commit/cf155259f9eff0bf206c013f4765f73ad702bdaf))

## [0.1.3](https://github.com/HubDev-AI/mklyml/compare/core-v0.1.2...core-v0.1.3) (2026-03-10)


### Features

* add &gt;tag descendant target syntax for per-element styling ([#1](https://github.com/HubDev-AI/mklyml/issues/1)) ([d402923](https://github.com/HubDev-AI/mklyml/commit/d402923dccb9f137a22fbda1b7c7f0f85b6e09d2))
* add 100 Google Fonts to font picker with auto-loading support ([#12](https://github.com/HubDev-AI/mklyml/issues/12)) ([23e61b6](https://github.com/HubDev-AI/mklyml/commit/23e61b63d03bb5c2bf6007f8cdd95d3dcd96e573))
* expand Google Fonts to 305, fix style graph label selectors and img alignment ([#13](https://github.com/HubDev-AI/mklyml/issues/13)) ([f02f2d5](https://github.com/HubDev-AI/mklyml/commit/f02f2d5fee8e89418d2841cdc73218ebc8857f59))
* zero-boilerplate — make --- use: and --- meta optional ([#11](https://github.com/HubDev-AI/mklyml/issues/11)) ([4aec4d3](https://github.com/HubDev-AI/mklyml/commit/4aec4d3e992cc94fa4a91a1f875fdc57fe6e248e))


### Bug Fixes

* add missing styleHints for consistency across core blocks ([622309d](https://github.com/HubDev-AI/mklyml/commit/622309de67cf1a4c385de2af6daacf71fb2d3cca))
* decode &apos; entity and resolve nested var() fallbacks ([#6](https://github.com/HubDev-AI/mklyml/issues/6)) ([3ef3023](https://github.com/HubDev-AI/mklyml/commit/3ef3023e5d6aa284b94fdc1ef84ccd78240c90b6))
* decode HTML entities in block content extraction ([#10](https://github.com/HubDev-AI/mklyml/issues/10)) ([ab7af56](https://github.com/HubDev-AI/mklyml/commit/ab7af566898a1322e4a45567120606a526e52d90))
* depth-aware document extraction in reverseWeb ([#9](https://github.com/HubDev-AI/mklyml/issues/9)) ([e1342a9](https://github.com/HubDev-AI/mklyml/commit/e1342a980c8148610470e9ef36be6353760ae913))
* emit user-defined variables as CSS custom properties and fix mixed tab/space indentation ([#7](https://github.com/HubDev-AI/mklyml/issues/7)) ([ed8f9d8](https://github.com/HubDev-AI/mklyml/commit/ed8f9d87034bbcddc067134ace6c87ced21f7606))
* improve inherited text style propagation ([4583b3e](https://github.com/HubDev-AI/mklyml/commit/4583b3e9f2a6222a75ef84a10123b947dfe5f872))
* merge interleaved self rules during serialization ([#8](https://github.com/HubDev-AI/mklyml/issues/8)) ([324bb5a](https://github.com/HubDev-AI/mklyml/commit/324bb5addc4a63f05e28280c1c9e14016b0f93cf))
* normalize style block serialization and reverse markdown text ([8fc9368](https://github.com/HubDev-AI/mklyml/commit/8fc9368bdf4d848ac05fe68f8750febb4d6f563b))
* normalize style block serialization and reverse markdown text ([e6586d1](https://github.com/HubDev-AI/mklyml/commit/e6586d1eeffc225256c70e0c657521c319fea804))
* propagate inherited text styles and remove strong/em theme overrides ([062616e](https://github.com/HubDev-AI/mklyml/commit/062616eb29b261275d06dc10170cbb8029233c79))
* remove text-align expansion, add * list prefix ([#2](https://github.com/HubDev-AI/mklyml/issues/2)) ([5e27e6e](https://github.com/HubDev-AI/mklyml/commit/5e27e6e4f49a7a237234dc1b1f8322b73ddbb2a7))
