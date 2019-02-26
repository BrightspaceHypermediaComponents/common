import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

/**
 * `d2l-hm-filter`
 * Hypermedia components that can be used against standardized HM route workflows
 *
 * @customElement
 * @polymer
 * @demo demo/d2l-hm-filter/d2l-hm-filter.html
 */

class D2LHypermediaFilter extends PolymerElement {
	static get template() {
		return html`
			<style>
				:host {
					display: inline-block;
				}
			</style>
			<h2>[[prop1]]</h2>
		`;
	}

	static get properties() {
		return {
			prop1: {
				type: String,
				value: 'd2l-hm-filter'
			}
		};
	}
}

window.customElements.define('d2l-hm-filter', D2LHypermediaFilter);
