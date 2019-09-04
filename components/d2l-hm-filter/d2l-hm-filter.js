import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { mixinBehaviors } from '@polymer/polymer/lib/legacy/class.js';
import 'd2l-facet-filter-sort/components/d2l-filter-dropdown/d2l-filter-dropdown.js';
import 'd2l-polymer-siren-behaviors/store/entity-behavior.js';
import 'd2l-polymer-siren-behaviors/store/siren-action-behavior.js';
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

		<d2l-filter-dropdown  total-selected-option-count="[[totalSelectedCount]]">
			<dom-repeat items="[[_filters]]" as="c">
				<template>
					<d2l-filter-dropdown-category key="[[c.key]]" category-text="[[c.title]]" selected-option-count="[[_calculateCategoryCount(c.selectedCount)]]">
						<dom-repeat items="[[c.options]]" as="o">
							<template>
								<d2l-menu-item-checkbox text="[[o.title]]" value="[[o.key]]" selected="[[o.selected]]"></d2l-menu-item-checkbox>
							</template>
						</dom-repeat>
					</d2l-filter-dropdown-category>
				</template>
			</dom-repeat>
		</d2l-filter-dropdown>
		`;
	}
	static get is() { return 'd2l-hm-filter'; }
	static get properties() {
		return {
			delayedFilter: {
				type: Boolean,
				value: false
			},
			categoryWhitelist: {
				type: Array,
				value: []
			},
			resultSize: {
				type: Number,
				value: undefined,
				reflectToAttribute: true
			},
			totalSelectedCount: {
				type: Number,
				value: 0,
			},
			_filters: {
				type: Array,
				value: [
					// {
					// 	key: '',
					// 	startingApplied: 0,
					// 	title: '',
					// 	href: '',
					// 	loaded: false,
					// 	clearAction: {},
					// 	options: [
					// 		{
					// 			key: '',
					//  			title: '',
					// 			selected: '',
					// 			toggleAction: {}
					// 		}
					// 	]
					// }
				]
			},
			_clearAction: {
				type: Object,
				value: {}
			},
			_dropdown: {
				type: Object,
				value: {}
			},
			_selectedCategory: {
				type: String
			}
		};
	}
	static get observers() {
		return [
			'_loadFilters(entity)',
		];
	}

	attached() {
		if (this.delayedFilter) {
			this.addEventListener('d2l-filter-dropdown-close', this._handleOptionsChanged);
		} else {
			this.addEventListener('d2l-filter-dropdown-menu-item-change', this._handleOptionChanged);
		}
		this.addEventListener('d2l-filter-dropdown-category-selected', this._handleSelectedFilterCategoryChanged);
		this.addEventListener('d2l-filter-dropdown-cleared', this._handleFiltersCleared);
	}

	detached() {
		if (this.delayedFilter) {
			this.removeEventListener('d2l-filter-dropdown-close', this._handleOptionsChanged);
		} else {
			this.removeEventListener('d2l-filter-dropdown-menu-item-change', this._handleOptionChanged);
		}
		this.removeEventListener('d2l-filter-dropdown-category-selected', this._handleSelectedFilterCategoryChanged);
		this.removeEventListener('d2l-filter-dropdown-cleared', this._handleFiltersCleared);
	}

	_fetchFromStore(url) {
		return window.D2L.Siren.EntityStore.fetch(url, this.token);
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

	async _loadFilters(entity) {
		// var tempResponse = window.D2L.Siren.EntityStore.fetch("data/11111111-1111-1111-1111-111111111111.json",
		// 	"eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6ImVmZTA3YWNkLTk5MTktNDk1Mi1iNzVlLTExODA0N2JiYWRlYyJ9.eyJpc3MiOiJodHRwczovL2FwaS5icmlnaHRzcGFjZS5jb20vYXV0aCIsImF1ZCI6Imh0dHBzOi8vYXBpLmJyaWdodHNwYWNlLmNvbS9hdXRoL3Rva2VuIiwiZXhwIjoxNTY2OTIzODU1LCJuYmYiOjE1NjY5MjAyNTUsInN1YiI6IjMxNjcxIiwidGVuYW50aWQiOiJmMjA4NTBmOS0wNmQxLTRlNzgtYTQwNS05Y2I3MjlhZmVlYjkiLCJhenAiOiJsbXM6ZjIwODUwZjktMDZkMS00ZTc4LWE0MDUtOWNiNzI5YWZlZWI5Iiwic2NvcGUiOiIqOio6KiIsImp0aSI6ImI1MTI1MDhmLTYxOWEtNGMzZC05NTIzLTgyOTE1OTMzNzI3NyJ9.jaLhWEaACMZQhu_jqU1Y5orWZ4x6YdmvjhrP1J9T-MYrfuUhwzxu7Y40Gx-H3tx3uNDK1l2s0oAAm_eVjZrASmWaw6rAxEwuojiMQCIHiywjBiW_AFY843jplsHakwkAoo-_IIHByw47sbx2XAiaiY32rwngSjXd6-mWQyy8vAbw_63LDIkdn9Rmaxtj60pAXOjvNhpkUixQ1YOpFLVpmyA8NX2JK_p4HPfQ4269qe7S6mi0n-Fmy3U4srapq14CC2UI-eE3uDf3u52VNbaYXcUZeGVLwyxRwYGQQsooV5Dobp82TwARazzJVj2T1pdrpl1y3ggAnG-INKAdhla0UQ", this.disableEntityCache);
		// tempResponse.then((response)=> {
		// 	console.log("response: ", response);
		// });
		// console.log("_loadFilters, tempResponse: ", tempResponse);
		// console.log("_loadFilters, entity changed", entity);
		if (!entity) {
			return Promise.resolve();
		}
		try {
			this._clearAction = this._getAction(entity, 'clear');
			await this._parseFilters(entity);
			this._dropdown = this._getFilterDropdown();
			this._populateFilterDropdown();
			this._dispatchFiltersLoaded();
		} catch (err) {
			// Unable to get actions and/or filters.
			this._dispatchFilterError(err);
			Promise.reject(err);
		}
	}

	_getFilterDropdown() {
		return this.shadowRoot.querySelector('d2l-filter-dropdown');
	}

	_populateFilterDropdown(filter) {
		console.log("_populateFilterDropdown, filter", filter, "this._filters", this._filters);
		return;
		if (filter) {
			filter.options.forEach(function(o) {
				this._dropdown.addFilterOption(filter.key, o.key, o.title, o.selected);
			}.bind(this));
		} else {
			this._filters.forEach(function(f) {
				this._dropdown.addFilterCategory(f.key, f.title, f.startingApplied);
				f.options.forEach(function(o) {
					this._dropdown.addFilterOption(f.key, o.key, o.title, o.selected);
				}.bind(this));
			}.bind(this));
		}
	}

	_shouldApplyWhitelist() {
		return this.categoryWhitelist && this.categoryWhitelist.length;
	}

	_parseEntityToFilter(entity, numApplied) {
		if (entity) {
			const key = this._getCategoryKeyFromHref(entity.href);
			return {
				key: key,
				startingApplied: numApplied[key] || 0,
				selectedCount: 0,
				title: entity.title,
				href: entity.href,
				loaded: false,
				clearAction: this._getAction(entity, 'clear'),
				options: []
			};
		}
	}

	async _parseFilters(entity) {
		if (entity) {
			const filters = [];
			if (this._shouldApplyWhitelist()) {
				this.categoryWhitelist.forEach(cw => {
					const found = this._findInArray(entity.entities, e => e.href.indexOf(cw) >= 0);
					if (found) {
						filters.push(this._parseEntityToFilter(found, entity.properties.applied));
					}
				});
			} else {
				for (let i = 0; i < entity.entities.length; i++) {
					// console.log("_parseEntityToFilter, subentitiy", entity.entities[i],
					// "parsed result", this._parseEntityToFilter(entity.entities[i], entity.properties.applied));
					filters.push(this._parseEntityToFilter(entity.entities[i], entity.properties.applied));
				}
			}
			if (filters && filters.length) {
				var selectedFilterIndex = this._selectedCategory ? this._getCategoryIndexFromKey(filters, this._selectedCategory) : 0;

				// The other filters are lazily loaded when their tab is opened for the first time.
				filters[selectedFilterIndex].options = await this._getFilterOptions(filters[selectedFilterIndex].href, filters[selectedFilterIndex].key);
				filters[selectedFilterIndex].loaded = true;

				this._filters = filters;
			}
		}
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

	_getCategoryIndexFromKey(filters, key) {
		for (var i = 0 ; i < filters.length; i++) {
			if (filters[i].key === key) {
				return i;
			}
		}
		return -1;
	}

	_getOptionStatusFromClasses(classes) {
		// console.log("_getOptionStatusFromClasses, classes:", classes);
		return !!(this._findInArray(classes, c => c === 'on'));
	}

	_getCustomPageSizeParams() {
		const customParams = this.resultSize >= 0 ? {pageSize: this.resultSize} : undefined;
		return customParams;
	}

	async _handleOptionsChanged(e) {
		console.log("all options changed!!");
		this._dispatchFiltersUpdating();
		const applied = await this._toggleFilterOptions(e.detail.selectedFilters);
		this._dispatchFiltersUpdated(applied);
	}

	_calculateCategoryCount(selectedCount) {
		return selectedCount || 0;
	}

	_calculateTotalCount() {
		return this._filters.reduce((total, filter)=> {
			return total + this._calculateCategoryCount(filter.selectedCount);
		}, 0);
	}

	async _handleOptionChanged(e) {
		console.log("some options changed, not all of them tho");
		// console.log("_handleOptionChanged, this._filters", this._filters);
		// console.log("_handleOptionChanged, e.detail.categoryKey", e.detail.categoryKey, "e.detail.menuItemKey", e.detail.menuItemKey);
		const option = this._getFilterOptionByKey(e.detail.categoryKey, e.detail.menuItemKey);
		// console.log("_handleOptionChanged, option", option);
		if (option && option.selected !== e.detail.newValue) {
			this._dispatchFiltersUpdating();
			const filter = this._getFilterCategoryByKey(e.detail.categoryKey);
			const apply = await this._toggleOption(filter, option);
			if (option.selected) {
				this.set(`_filters.${this._filters.findIndex(f => f.key === e.detail.categoryKey)}.selectedCount`, filter.selectedCount+1 || 1);
				this.set("totalSelectedCount", this.totalSelectedCount+1);
			} else {
				this.set(`_filters.${this._filters.findIndex(f => f.key === e.detail.categoryKey)}.selectedCount`, filter.selectedCount-1 || 0);
				this.set("totalSelectedCount", this.totalSelectedCount-1);
			}
			if (apply) {
				filter.clearAction = this._getAction(apply, 'clear');
				const applyAll = await this._apply(apply);
				if (applyAll) {
					this._clearAction = this._getAction(applyAll, 'clear');

					const customParams = this._getCustomPageSizeParams();
					const applied =  await this._apply(applyAll, customParams);
					if (applied) {
						this._dispatchFiltersUpdated(applied);
					}
				}
			}
		}
	}

	async _handleSelectedFilterCategoryChanged(e) {
		// console.log("_handleSelectedFilterCategoryChanged, e.detail.categoryKey: ", e.detail.categoryKey);
		// console.log("_handleSelectedFilterCategoryChanged, this._filters", this._filters);
		const filter = this._findInArray(this._filters, f => f.key === e.detail.categoryKey);
		this._selectedCategory = e.detail.categoryKey;
		if (!filter.loaded) {
			filter.options = await this._getFilterOptions(filter.href, filter.key);
			this._populateFilterDropdown(filter);
			filter.loaded = true;
			this.notifyPath(`_filters.${this._filters.findIndex(f => f.key === e.detail.categoryKey)}.options`);
		}
	}

	async _handleFiltersCleared() {
		this._dispatchFiltersUpdating();
		const result = await this._clearAllOptions();
		this._dispatchFiltersUpdated(result);
	}

	async _getFilterOptions(href, cKey) {
		const filter = await this._fetchFromStore(href);
		if (filter && filter.entity && filter.entity.entities) {
			return filter.entity.entities.map(o => {
				return {
					title: o.title,
					key: o.properties.filter,
					categoryKey: cKey,
					selected: this._getOptionStatusFromClasses(o.class),
					toggleAction: this._getOptionToggleAction(o)
				};
			});
		}

		return [];
	}

	_getOptionToggleAction(option) {
		const actionName = this._getOptionStatusFromClasses(option.class) ? 'remove-filter' : 'add-filter';
		return this._getAction(option, actionName);
	}

	async _toggleFilterOptions(activatedOptions) {
		if (activatedOptions && activatedOptions.length) {
			let applyAll = null;
			for (let j = 0; j < this._filters.length; j++) {
				const f = this._filters[j];
				if (this._filterCategoryShouldBeCleared(f, activatedOptions)) {
					let cleared;
					try {
						cleared = await this._performSirenActionWithQueryParams(f.clearAction);
					} catch (err) {
						this._dispatchFilterError(err);
						Promise.reject(err);
					}
					f.clearAction = this._getAction(cleared, 'clear');
					this._updateToggleActions(cleared, f);
					f.options.forEach(o => {
						o.selected = false;
					});
					applyAll = await this._apply(cleared);
				} else {
					let apply = null;
					for (let i = 0; i < f.options.length; i++) {
						const o = f.options[i];
						const optionShouldBeSelected = this._findInArray(activatedOptions, ao => ao.categoryKey === f.key && ao.menuItemKey === o.key);
						// XOR
						if (!(optionShouldBeSelected) !== !o.selected) {
							apply = await this._toggleOption(f, o);
						}
					}
					if (apply) {
						f.clearAction = this._getAction(apply, 'clear');
						applyAll = await this._apply(apply);
					}
				}
			}
			if (applyAll) {
				this._clearAction = this._getAction(applyAll, 'clear');

				const customParams = this._getCustomPageSizeParams();
				return await this._apply(applyAll, customParams);
			}
		} else {
			return await this._clearAllOptions();
		}
	}

	async _apply(entity, customParams) {
		// console.log("_apply, entity: ", entity, "customParams:", customParams);
		// console.log("action: ", this._getAction(entity, 'apply'));
		try {
			return await this._performSirenActionWithQueryParams(this._getAction(entity, 'apply'), customParams);
		} catch (err) {
			this._dispatchFilterError(err);
			return Promise.reject(err);
		}
	}

	async _toggleOption(filter, option) {
		let result = null;
		try {
			console.log("option.toggleAction", option.toggleAction);
			result = await this._performSirenActionWithQueryParams(option.toggleAction);
			// console.log("result", result);
			option.selected = !option.selected;
			this._updateToggleActions(result, filter);
		} catch (err) {
			this._dispatchFilterError(err);
			Promise.reject(err);
		}
		return result;
	}

	async _clearAllOptions() {
		let cleared;
		try {
			cleared = await this._performSirenActionWithQueryParams(this._clearAction);
		} catch (err) {
			this._dispatchFilterError(err);
			return Promise.reject(err);
		}
		this._clearAction = this._getAction(cleared, 'clear');
		for (let i = 0; i < this._filters.length; i++) {
			const f = this._filters[i];
			const found = this._findInArray(cleared.entities, e => e.href.indexOf(f.key) > -1);
			if (found) {
				const filterEntity = await this._fetchFromStore(found.href);
				f.clearAction = this._getAction(filterEntity, 'clear');
				this._updateToggleActions(filterEntity.entity, f);
			}
		}
		this._filters.forEach(f => {
			f.options.forEach(o => {
				o.selected = false;
			});
			this.totalSelectedCount = 0;
		});

		const customParams = this._getCustomPageSizeParams();
		return await this._apply(cleared, customParams);
	}

	_updateToggleActions(entity, filter) {
		filter.options.forEach(function(o) {
			o.toggleAction = this._getToggleOptionAction(entity, o);
		}.bind(this));
	}

	_getToggleOptionAction(filterEntity, option) {
		const ent = this._findInArray(filterEntity.entities, e => e.properties.filter === option.key);
		return this._getOptionToggleAction(ent);
	}

	_filterCategoryShouldBeCleared(filter, selected) {
		if (!filter.options) { return false; }
		if (!filter.options.length) { return false; }
		if (!this._findInArray(filter.options, o => o.selected)) { return false; }
		if (this._findInArray(selected, s => s.categoryKey === filter.key)) { return false; }

		return true;
	}

	_getFilterCategoryByKey(key) {
		return this._findInArray(this._filters, f => f.key === key);
	}

	_getFilterOptionByKey(cKey, oKey) {
		const filter = this._getFilterCategoryByKey(cKey);
		if (filter) {
			return this._findInArray(filter.options, o => o.key === oKey);
		}
	}

	_findInArray(arr, func) {
		const results = arr.filter(func);
		if (results && results.length) {
			return results[0];
		}
	}

	_getTotalSelectedFilterOptions() {
		let result = 0;
		for (let i = 0; i < this._filters.length; i++) {
			if (this._filters[i].options.length) {
				for (let j = 0; j < this._filters[i].options.length; j++) {
					if (this._filters[i].options[j].selected) {
						result++;
					}
				}
			} else {
				result += this._filters[i].startingApplied;
			}
		}
		return result;
	}

	_dispatchFiltersUpdating() {
		this.dispatchEvent(
			new CustomEvent(
				'd2l-hm-filter-filters-updating',
				{
					composed: true,
					bubbles: true
				}
			)
		);
	}

	_dispatchFiltersUpdated(filtered) {
		console.log("_dispatchFiltersUpdated", this._filters.map(c=>c.options.map(o=>o.toggleAction.fields[0].value)));

		this.dispatchEvent(
			new CustomEvent(
				'd2l-hm-filter-filters-updated',
				{
					detail: {
						filteredActivities: filtered,
						totalSelectedFilters: this._getTotalSelectedFilterOptions()
					},
					composed: true,
					bubbles: true
				}
			)
		);
	}

	_dispatchFiltersLoaded() {
		this.dispatchEvent(
			new CustomEvent(
				'd2l-hm-filter-filters-loaded',
				{
					detail: {
						totalSelectedFilters: this._getTotalSelectedFilterOptions()
					},
					composed: true,
					bubbles: true
				}
			)
		);
	}

	_dispatchFilterError(err) {
		this.dispatchEvent(
			new CustomEvent(
				'd2l-hm-filter-error',
				{
					detail: {
						error: err
					},
					composed: true,
					bubbles: true
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
}

window.customElements.define(D2LHypermediaFilter.is, D2LHypermediaFilter);
