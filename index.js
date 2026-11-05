/**
 * Host half of the Japanese language pack.
 *
 * The bundle owns no Host behaviour: selecting a language and looking up
 * translated copy both happen in the browser through the locale service, so
 * the Client module (`./client`) carries the whole implementation and this
 * export only makes the row loadable — which is also what puts the package in
 * the client-modules scan that serves that bundle.
 */
export function apply() {}
