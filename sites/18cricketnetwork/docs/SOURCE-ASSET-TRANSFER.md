# Portable source assets

The homepage PNG is preserved byte-for-byte in `source-assets` as base64 text parts with a SHA-256 manifest. This permits source transfer through the connected GitHub API without a single oversized binary upload. `npm run build` restores the original `public/cricket-globe-hero.png` before the build; it checks the digest before using or writing the asset. No image editing, quality loss, external download or dependency on Sites hosting is involved.

After a fresh checkout, run `node scripts/restore-source-assets.mjs` before local development, or simply run `npm run build`. The live Site source also retains the original PNG; the GitHub copy uses the encoded source representation. All other source files are synchronised normally under `sites/18cricketnetwork`, preserving the rest of the existing repository.
