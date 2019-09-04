import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { mixinBehaviors } from '@polymer/polymer/lib/legacy/class.js';
import 'd2l-facet-filter-sort/components/d2l-filter-dropdown/d2l-filter-dropdown.js';
import 'd2l-polymer-siren-behaviors/store/entity-behavior.js';
import 'd2l-polymer-siren-behaviors/store/siren-action-behavior.js';

import "@webcomponents/webcomponentsjs/webcomponents-loader.js"
import "d2l-facet-filter-sort/components/d2l-filter-dropdown/d2l-filter-dropdown.js"
import "d2l-facet-filter-sort/components/d2l-filter-dropdown/d2l-filter-dropdown-category.js"
import "d2l-menu/d2l-menu-item-checkbox.js"

/**
 * `d2l-hm-filter`
 * Hypermedia components that can be used against standardized HM route workflows
 *
 * @customElement
 * @polymer
 * @demo demo/d2l-hm-filter/d2l-hm-filter.html
 */

class D2LHypermediaFilter extends mixinBehaviors([D2L.PolymerBehaviors.Siren.EntityBehavior, D2L.PolymerBehaviors.Siren.SirenActionBehavior], PolymerElement) {
	static get template() {
		return html`
		<!-- <d2l-filter-dropdown></d2l-filter-dropdown> -->



		<!-- <d2l-filter-dropdown total-selected-option-count="3"> -->
		<d2l-filter-dropdown>

			<dom-repeat items="[[categories]]" as="c">
				<template>
					<d2l-filter-dropdown-category key="[[index]]" category-text="[[c.title]]">
						<dom-repeat items="[[c.options]]" as="o">
							<template>
								<d2l-menu-item-checkbox text="[[o.title]]" value="[[o.title]]"></d2l-menu-item-checkbox>
							</template>
						</dom-repeat>
					</d2l-filter-dropdown-category>
				</template>
			</dom-repeat>
			<!-- <d2l-filter-dropdown-category key="1" category-text="Category 1" selected-option-count="2"> -->
			<!-- <d2l-filter-dropdown-category key="2" category-text="Category 1" selected-option-count="[[computedSelected(2, currentSelectedCategory)]]">
				<d2l-menu-item-checkbox selected text="Option 1 - 1" value="1"></d2l-menu-item-checkbox>
				<d2l-menu-item-checkbox text="Option 1 - 2" value="2"></d2l-menu-item-checkbox>
				<d2l-menu-item-checkbox selected text="Option 1 - 3" value="3"></d2l-menu-item-checkbox>
			</d2l-filter-dropdown-category> -->
			<!-- <d2l-filter-dropdown-category key="1" category-text="Category 1" selected-option-count="2">
				<d2l-menu-item-checkbox selected text="Option 1 - 1" value="1"></d2l-menu-item-checkbox>
				<d2l-menu-item-checkbox text="Option 1 - 2" value="2"></d2l-menu-item-checkbox>
				<d2l-menu-item-checkbox selected text="Option 1 - 3" value="3"></d2l-menu-item-checkbox>
			</d2l-filter-dropdown-category>
			<d2l-filter-dropdown-category key="2" category-text="Category 2" selected-option-count="1">
				<d2l-menu-item-checkbox selected text="Option 2 - 1" value="1"></d2l-menu-item-checkbox>
				<d2l-menu-item-checkbox text="Option 2 - 2" value="2"></d2l-menu-item-checkbox>
			</d2l-filter-dropdown-category>
			<d2l-filter-dropdown-category key="3" category-text="Category 3" disable-search>
				<d2l-menu-item-checkbox text="Option 3 - 1" value="1"></d2l-menu-item-checkbox>
				<d2l-menu-item-checkbox text="Option 3 - 2" value="2"></d2l-menu-item-checkbox>
				<d2l-menu-item-checkbox text="Option 3 - 3" value="3"></d2l-menu-item-checkbox>
			</d2l-filter-dropdown-category> -->
		</d2l-filter-dropdown>
		`;
	}

	static get is() { return 'd2l-hm-filter'; }
	static get properties() {
		return {
			categories: {
				type: Array,
				value: [],
			},
			currentSelectedCategory: {
				type: Number,
				value: 0,
			}
		};
	}


	static get observers() {
		return [
			'_initialAssignCategories(entity)'
		];
	}

	attached() {
		this.addEventListener('d2l-filter-dropdown-category-selected', this._handleCategorySelected);
		this.addEventListener('d2l-filter-dropdown-menu-item-change', this._handleMenuItemChange);
	}

	detached() {
		this.removeEventListener('d2l-filter-dropdown-category-selected', this._handleCategorySelected);
	}

	_initialAssignCategories(entity) {
		if (!entity) return;
		this.categories = [...entity.entities];
		this.categories.forEach((category)=> {
			category.options = [];
			category.loaded = false;
		})
	}

	computedSelected(index, selected) {
		return index === selected? 100 : 1;
	}

	async _handleCategorySelected({detail: {categoryKey}}) {
		this.currentSelectedCategory = categoryKey;
		const currCategory = this.categories[this.currentSelectedCategory];
		if (!currCategory.loaded) {
			const fetchedCategory = await this._fetchFromStore(currCategory.href);
			if (!(fetchedCategory && fetchedCategory.entity && fetchedCategory.entity.entities)) return;
			currCategory.loaded = true;
			// we do this so that dom-repeat is notified of changes in the options array
			this.set(`categories.${categoryKey}.options`, fetchedCategory.entity.entities);
		}
	}

	_handleMenuItemChange(e) {
		console.log("_handleMenuItemChange, e:", e);
	}

	_getCategoryKeyFromHref(href) {
		const url = new window.URL(href, 'https://notused.com');
		if (url) {
			const keyRegex = /[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}/i;
			const match = keyRegex.exec(url.pathname);
			if (match && match.length) {
				return match[0];
			}
		}
	}

	_getAction(entity, name) {
		if (entity) {
			if (entity.hasActionByName) {
				if (entity.hasActionByName(name)) {
					return entity.getActionByName(name);
				}
			} else {
				if (entity.actions) {
					return this._findInArray(entity.actions, a => a.name === name);
				}
			}
		}
		return null;
	}

	_fetchFromStore(url) {
		// console.log("expensive fetch operation...");
		return window.D2L.Siren.EntityStore.fetch(url, this.token);
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
}

window.customElements.define(D2LHypermediaFilter.is, D2LHypermediaFilter);
