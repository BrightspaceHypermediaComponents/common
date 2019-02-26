import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import 'd2l-polymer-siren-behaviors/store/entity-behavior.js';
import {mixinBehaviors} from '@polymer/polymer/lib/legacy/class.js';

/**
 * `d2l-hm-filter`
 * Hypermedia components that can be used against standardized HM route workflows
 *
 * @customElement
 * @polymer
 * @demo demo/d2l-hm-filter/d2l-hm-filter.html
 */

class D2LHypermediaFilter extends mixinBehaviors([D2L.PolymerBehaviors.Siren.EntityBehavior], PolymerElement) {
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
