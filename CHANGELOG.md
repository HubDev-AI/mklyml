# Changelog

## [0.2.1](https://github.com/HubDev-AI/mklyml/compare/core-v0.2.0...core-v0.2.1) (2026-03-10)


### Bug Fixes

* **ci:** add sibling deps clone and graceful NPM_TOKEN skip in publish workflow ([#26](https://github.com/HubDev-AI/mklyml/issues/26)) ([e23328b](https://github.com/HubDev-AI/mklyml/commit/e23328b3ed7e35e2ad52d39c5bf29489926301ea))
* npm imports for @mklyml/kits + CI publish fix ([#28](https://github.com/HubDev-AI/mklyml/issues/28)) ([73274da](https://github.com/HubDev-AI/mklyml/commit/73274da9b21a8952a3f84e5563f09abd4f5663db))
* refresh bun lockfile ([b95c87e](https://github.com/HubDev-AI/mklyml/commit/b95c87ef7755b364da37c359039b274e817a36f8))
* refresh bun lockfile ([54134e3](https://github.com/HubDev-AI/mklyml/commit/54134e300c9c58cf76937f5779eb5d08ca29c8cc))
* sync dev to main — dep ranges and self-reference path ([19b5c11](https://github.com/HubDev-AI/mklyml/commit/19b5c11b14cea20cc5503c1e955b1aab3d9f1981))
* use &gt;=0.1.0 for @mklyml/kits dep range and add self-reference path ([#30](https://github.com/HubDev-AI/mklyml/issues/30)) ([3728afd](https://github.com/HubDev-AI/mklyml/commit/3728afdcb92db8fcf9da2f9952a3543439b667c1))
* use npm imports for @mklyml/kits instead of relative paths ([#27](https://github.com/HubDev-AI/mklyml/issues/27)) ([afac73e](https://github.com/HubDev-AI/mklyml/commit/afac73ea598b892f80fe85048d99bec1d91c28ec))

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
