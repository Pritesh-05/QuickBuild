/** sessionStorage key used to hand a resolved BuildState from a
 * /share/:id page's "Continue editing" button into the /build page,
 * which adopts it as the active (unsaved) build on mount. One-shot —
 * the receiving side clears it immediately after reading. */
export const SHARED_HANDOFF_KEY = "quickbuild.shared-handoff.v1";

/** sessionStorage key used to hand a saved build's id from the /account
 * page's "Load" button into the /build page, which then loads that build
 * itself (via its own useBuild() instance — see the comment on
 * LOAD_BUILD_HANDOFF_KEY's usage in pages/build.tsx for why this can't
 * just call loadSavedBuild() from /account directly). One-shot — the
 * receiving side clears it immediately after reading. */
export const LOAD_BUILD_HANDOFF_KEY = "quickbuild.load-build-handoff.v1";