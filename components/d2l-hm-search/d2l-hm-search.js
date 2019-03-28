import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import 'd2l-inputs/d2l-input-search.js';

/**
 * `d2l-hm-search`
 * Hypermedia components that can be used against standardized HM route workflows
 *
 * @customElement
 * @polymer
 * @demo demo/d2l-hm-search/d2l-hm-search.html
 */

class D2LHypermediaSearch extends PolymerElement {
	static get template() {
		return html `
		<d2l-input-search></d2l-input-search>
		`;
	}
	static get is() { return 'd2l-hm-search'; }
}

window.customElements.define(D2LHypermediaSearch.is, D2LHypermediaSearch);
