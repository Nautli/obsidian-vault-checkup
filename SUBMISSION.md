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
