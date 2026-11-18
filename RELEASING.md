# Releasing

New versions are staged on npm by GitHub Actions and go live only after approval with two-factor
authentication. No npm token exists anywhere.

1. Make the change, and add an entry to `CHANGELOG.md`.
2. Bump the version. This commits and creates the tag `vX.Y.Z`:

   ```sh
   npm version patch   # or minor / major
   ```

3. Push the commit and the tag:

   ```sh
   git push --follow-tags
   ```

4. The **Publish** workflow checks that the tag matches `package.json`, runs `npm run check` and
   stages the version on npm. Nothing is public yet.
5. Approve it with your second factor, on npmjs.com or from a terminal logged in to npm:

   ```sh
   npm stage list @pkiser/moontool
   npm stage approve <stage-id>
   ```

   If something looks wrong, `npm stage reject <stage-id>` discards it.

## Why staged

The trusted publisher on npmjs.com may only stage, not publish directly or move dist-tags. The
workflow installs dozens of third-party dev dependencies before publishing; with staging, none of
them can release a version on their own.

## Versions

[Semantic versioning](https://semver.org/). While the version is 0.x, a minor release may change
the API; from 1.0.0 on, breaking changes need a major release.
