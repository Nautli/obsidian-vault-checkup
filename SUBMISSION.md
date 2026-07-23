# 제출 절차 (2026-07 신규 — 포털 방식)

⚠️ obsidian-releases 리포는 PR 접수를 껐다(2026-07-24 실측: compare 화면 "owner has disabled the ability to open pull requests", pulls API 404). 현행 절차는 포털:

1. https://community.obsidian.md 접속 → **Obsidian 계정 로그인** (유저 직접)
2. 프로필에 **GitHub 계정 연동** (리포 소유 검증용)
3. 사이드바 Plugins → **New plugin**
4. 리포 URL 입력: `https://github.com/Nautli/obsidian-vault-checkup`
5. Developer policies 동의 → **Submit**

## 사전 준비 상태 (완료 — 2026-07-24)
- [x] 퍼블릭 리포 + README(프라이버시 명시) + LICENSE(MIT)
- [x] manifest.json: id=vault-checkup, version=1.0.0, author=nautli, authorUrl
- [x] GitHub Release `1.0.0` (태그=버전 정확 일치, v 접두사 없음) + main.js/manifest.json/styles.css 개별 에셋
- [x] 빌드·테스트 그린, 네트워크 API 0건(grep 검증)

---

## (구) PR 방식 체크리스트 — 참고용

# Obsidian community-plugin submission checklist

Use this when opening the `obsidian-releases` pull request for Vault Checkup.

- [ ] The release repository is public and includes an OSI-approved license.
- [ ] `manifest.json` has the stable plugin id `vault-checkup`, name, semantic version, description, author, and `minAppVersion` of `1.4.0` or later.
- [ ] The release tag matches `manifest.json` and `versions.json` is updated for that version.
- [ ] The release assets include `main.js`, `manifest.json`, and `styles.css`.
- [ ] `README.md` explains installation, features, and the local-only privacy model.
- [ ] The plugin has been manually checked in a desktop and mobile-compatible Obsidian vault.
- [ ] No telemetry, background connections, LLM calls, bundled secrets, or remote code loading are present.
- [ ] The nautli destination is an explicit user-click link; it does not open automatically and carries only the `ref=obsidian-plugin` attribution value.
- [ ] The share card remains local: it is a device-generated PNG with no upload path.
- [ ] The repository follows the current Obsidian community-plugin guidelines and the release PR uses their required submission format.

Before submitting, build and test the release, then inspect the source and bundled artifact for network-client APIs. Privacy-related prose is expected to mention the policy; executable network-client code is not.

Run:

```bash
npm run build
npm test
```
