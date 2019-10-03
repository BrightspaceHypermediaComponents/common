import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { mixinBehaviors } from '@polymer/polymer/lib/legacy/class.js';
import 'd2l-inputs/d2l-input-search.js';
import 'd2l-polymer-siren-behaviors/store/siren-action-behavior.js';

/**
 * `d2l-hm-search`
 * Hypermedia components that can be used against standardized HM route workflows
 *
 * @customElement
 * @polymer
 * @demo demo/d2l-hm-search/d2l-hm-search.html
 */

class D2LHypermediaSearch extends mixinBehaviors([D2L.PolymerBehaviors.Siren.SirenActionBehavior], PolymerElement) {
	static get template() {
		return html `
		<d2l-input-search placeholder="[[placeholder]]" value="[[initialValue]]" label="[[label]]"></d2l-input-search>
		`;
	}
	static get is() { return 'd2l-hm-search'; }
	static get properties() {
		return {
			searchAction: {
				type: Object,
				value: {}
			},
			placeholder: {
				type: String,
				value: ''
			},
			resultSize: {
				type: Number,
				value: undefined,
				reflectToAttribute: true
			},
			initialValue: {
				type: String
			},
			label: {
				type: String
			}
		};
	}
	ready() {
		super.ready();
		this._handleSearch = this._handleSearch.bind(this);
	}
	attached() {
		const search = this._getSearchInput();
		search.addEventListener('d2l-input-search-searched', this._handleSearch);

	}
	detached() {
		const search = this._getSearchInput();
		search.removeEventListener('d2l-input-search-searched', this._handleSearch);
	}

	clearSearch() {
		const search = this._getSearchInput();
		search.value = '';
		search.search();
	}

	_getSearchInput() {
		return this.shadowRoot.querySelector('d2l-input-search');
	}

	_getCustomPageSizeParams() {
		const customParams = this.resultSize >= 0 ? {pageSize: this.resultSize} : undefined;
		return customParams;
	}

	async _handleSearch(e) {
		try {
			this._dispatchResultsLoading();
			const field = this.searchAction.getFieldByName('collectionSearch');
			field.value = e.detail.value;
			const results = await this._performSirenActionWithQueryParams(this.searchAction, this._getCustomPageSizeParams());
			this._dispatchResultsLoaded(results, !e.detail.value);
		} catch (err) {
			this._dispatchSearchError(err);
			Promise.reject(err);
		}
	}

	_dispatchResultsLoading() {
		this.dispatchEvent(
			new CustomEvent(
				'd2l-hm-search-results-loading',
				{
					composed: true,
					bubbles: true
				}
			)
		);
	}

	_dispatchResultsLoaded(results, searchIsCleared) {
		this.dispatchEvent(
			new CustomEvent(
				'd2l-hm-search-results-loaded',
				{
					composed: true,
					bubbles: true,
					detail: {
						results: results,
						searchIsCleared: searchIsCleared
					}
				}
			)
		);
	}

	_dispatchSearchError(err) {
		this.dispatchEvent(
			new CustomEvent(
				'd2l-hm-search-error',
				{
					detail: {
						error: err
					},
					composed: true,
					bubbles: true,
				}
			)
		);
	}

	/* Helper needed until we have fixed the functionality in SirenActionBehavior
	* Specifically, the getSirenFields function is broken: https://github.com/Brightspace/polymer-siren-behaviors/blob/master/store/siren-action-behavior.js#L14
	* It does not grab the query parameters correctly, and duplicate parameters and fields should not be included
	*/
	_performSirenActionWithQueryParams(action, customParams) {
		const url = new URL(action.href, window.location.origin);
		const searchParams = this._parseQuery(url.search);

		if (!action.fields) {
			action.fields = [];
		}

		searchParams.forEach(function(value) {
			if (!this._findInArray(action.fields, f => f.name === value[0])) {
				action.fields.push({ name: value[0], value: value[1], type: 'hidden' });
			}
		}.bind(this));

		if (customParams) {
			Object.keys(customParams).forEach(function(paramName) {
				action.fields.push({name: paramName, value: customParams[paramName], type: 'hidden'});
			});
		}

		return this.performSirenAction(action);
	}

	_parseQuery(queryString) {
		var query = [];
		if (queryString) {
			var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
			for (var i = 0; i < pairs.length; i++) {
				var pair = pairs[i].split('=');
				var decodedKey = this._urlDecodePlusAsSpace(pair[0]);
				var decodedValue = this._urlDecodePlusAsSpace(pair[1] || '');
				query[i] = [decodedKey, decodedValue];
			}
		}
		return query;
	}

	_urlDecodePlusAsSpace(str) {
		if (!str) {
			return str;
		}
		var strWithPlusAsSpace = str.replace('+', ' ');
		var strDecoded = window.decodeURIComponent(strWithPlusAsSpace);
		return strDecoded;
	}

	_findInArray(arr, func) {
		const results = arr.filter(func);
		if (results && results.length) {
			return results[0];
		}
	}
}

window.customElements.define(D2LHypermediaSearch.is, D2LHypermediaSearch);
