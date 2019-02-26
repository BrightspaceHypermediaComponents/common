import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';

/**
 * `d2l-common`
 * Hypermedia components that can be used against standardized HM route workflows
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */

class Common extends PolymerElement {
	static get template() {
		return html`
			<style>
				:host {
					display: inline-block;
				}
			</style>
			<h2>Hello [[prop1]]!</h2>
		`;
	}

	static get properties() {
		return {
			prop1: {
				type: String,
				value: 'd2l-common'
			}
		};
	}
}

window.customElements.define('d2l-common', Common);
