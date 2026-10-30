/**
 * Middle-click close — Host half.
 *
 * Everything this plugin does happens in the Web page (see `client.js`): the
 * middle-click gesture and the Settings tab that switches it on or off. The
 * Host half exists only so the package has its row — the row is what makes the
 * browser half part of the Web module roster — and contributes no Host
 * behaviour of its own.
 *
 * The preferences live in the browser's `localStorage`, not in the Host
 * settings document: they describe one browser's mouse, so two machines that
 * open the same Host share the sessions but keep their own gesture switches.
 */

export function apply() {}
