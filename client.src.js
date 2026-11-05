/**
 * Client half of the Japanese language pack.
 *
 * Two registrations, both owned effects so unloading the plugin returns the
 * selector and the copy to the shipped state:
 *
 * 1. `addLanguage` appends 日本語 to the locale catalog, which is what the
 *    Settings → General → Language row lists. Its fallback is English, so a key
 *    this pack does not translate still renders the shipped English string
 *    instead of the key itself.
 * 2. One `register(namespace, 'ja', dictionary)` per namespace this pack
 *    translates. Language packs use the per-locale form: the owning package
 *    already registered `zh`/`en` for the namespace, and registering `ja` adds
 *    a third column rather than replacing anything.
 *
 * `DICTIONARIES` is generated from `dictionaries/*.json` by `tools/build.mjs`;
 * edit those files, never this artifact's data.
 */
window.__ModuleLoader__.load({
	id: '@local/dsh-locale-ja',
	factory() {
		/** Locale id this pack adds; BCP 47 primary subtag for Japanese. */
		const LOCALE_ID = 'ja';
		/** Display name written in the represented language, as the catalog requires. */
		const LOCALE_LABEL = '日本語';
		/** Dictionary namespace → Japanese copy. Generated; see tools/build.mjs. */
		const DICTIONARIES = __DICTIONARIES__;

		return {
			inject: ['locale'],
			/**
			 * Register the language and every dictionary it carries.
			 * @param ctx - Client root context carrying the locale service.
			 */
			apply(ctx) {
				ctx.effect(
					() => ctx.locale.addLanguage({ id: LOCALE_ID, label: LOCALE_LABEL, fallback: 'en' }),
					'locale-ja: language',
				);
				for (const [namespace, dictionary] of Object.entries(DICTIONARIES)) {
					ctx.effect(() => {
						try {
							return ctx.locale.register(namespace, LOCALE_ID, dictionary);
						} catch (error) {
							/* A namespace this pack claims may also be claimed by a
							   newer build of its own package (a duplicate registration
							   throws). Losing one namespace must not cost the whole
							   pack, so report it and keep the rest. */
							console.warn(`locale-ja: namespace "${namespace}" not registered`, error);
							return () => {};
						}
					}, `locale-ja: ${namespace}`);
				}
			},
		};
	},
});
