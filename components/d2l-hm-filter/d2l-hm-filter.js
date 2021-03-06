import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { mixinBehaviors } from '@polymer/polymer/lib/legacy/class.js';
import '@brightspace-ui-labs/facet-filter-sort/components/filter-dropdown/filter-dropdown.js';
import '@brightspace-ui-labs/facet-filter-sort/components/filter-dropdown/filter-dropdown-category.js';
import '@brightspace-ui-labs/facet-filter-sort/components/filter-dropdown/filter-dropdown-option.js';
import 'd2l-polymer-siren-behaviors/store/entity-behavior.js';
import 'd2l-polymer-siren-behaviors/store/siren-action-behavior.js';

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
		<d2l-labs-filter-dropdown total-selected-option-count="[[_totalSelectedCount]]">
			<dom-repeat items="[[_filters]]" as="category">
				<template>
					<d2l-labs-filter-dropdown-category
						category-text="[[category.title]]"
						key="[[category.key]]"
						selected-option-count="[[category.numOptionsSelected]]">

						<dom-repeat items="[[category.options]]" as="option">
							<template>
								<d2l-labs-filter-dropdown-option
									hidden$="[[option.hidden]]"
									selected="[[option.selected]]"
									text="[[option.title]]"
									value="[[option.key]]">
								</d2l-labs-filter-dropdown-option>
							</template>
						</dom-repeat>

					</d2l-labs-filter-dropdown-category>
				</template>
			</dom-repeat>
		</d2l-labs-filter-dropdown>
		`;
	}
	static get is() { return 'd2l-hm-filter'; }
	static get properties() {
		return {
			delayedFilter: {
				type: Boolean,
				value: false
			},
			categoryIncludeList: {
				type: Array,
				value: []
			},
			resultSize: {
				type: Number,
				value: undefined,
				reflectToAttribute: true
			},
			lazyLoadOptions: {
				type: Boolean,
				value: false
			},
			_filters: {
				type: Array,
				value: [
					// {
					// 	key: '',
					// 	numOptionsSelected: 0,
					// 	title: '',
					// 	href: '',
					// 	loaded: false,
					// 	clearAction: {},
					// 	options: [
					// 		{
					// 			hidden: false,
					// 			key: '',
					// 			title: '',
					// 			selected: '',
					// 			toggleAction: {}
					// 		}
					// 	]
					// }
				]
			},
			_totalSelectedCount: {
				type: Number,
				value: 0,
			},
			_clearAction: {
				type: Object,
				value: {}
			},
			_selectedCategory: {
				type: String
			},
			_shouldLoadOptions: {
				type: Boolean,
				value: false
			}
		};
	}
	static get observers() {
		return [
			'_loadFilters(entity)'
		];
	}

	attached() {
		if (this.delayedFilter) {
			this.addEventListener('d2l-labs-filter-dropdown-close', this._handleOptionsChanged);
		} else {
			this.addEventListener('d2l-labs-filter-dropdown-option-change', this._handleOptionChanged);
		}
		if (this.lazyLoadOptions) {
			this.addEventListener('d2l-dropdown-open', this._handleDropdownOpened);
		}
		this.addEventListener('d2l-labs-filter-dropdown-category-selected', this._handleFilterCategorySelected);
		this.addEventListener('d2l-labs-filter-dropdown-category-searched', this._handleFilterCategorySearched);
		this.addEventListener('d2l-labs-filter-dropdown-cleared', this._handleFiltersCleared);
	}

	detached() {
		if (this.delayedFilter) {
			this.removeEventListener('d2l-labs-filter-dropdown-close', this._handleOptionsChanged);
		} else {
			this.removeEventListener('d2l-labs-filter-dropdown-option-change', this._handleOptionChanged);
		}
		if (this.lazyLoadOptions) {
			this.removeEventListener('d2l-dropdown-open', this._handleDropdownOpened);
		}
		this.removeEventListener('d2l-labs-filter-dropdown-category-selected', this._handleFilterCategorySelected);
		this.removeEventListener('d2l-labs-filter-dropdown-category-searched', this._handleFilterCategorySearched);
		this.removeEventListener('d2l-labs-filter-dropdown-cleared', this._handleFiltersCleared);
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
		if (!entity) {
			return Promise.resolve();
		}
		try {
			this._clearAction = this._getAction(entity, 'clear');
			await this._parseFilters(entity);
			this._dispatchFiltersLoaded();
		} catch (err) {
			// Unable to get actions and/or filters.
			this._dispatchFilterError(err);
			Promise.reject(err);
		}
	}

	_shouldApplyIncludeList() {
		return this.categoryIncludeList && this.categoryIncludeList.length;
	}

	_parseEntityToFilter(entity, numApplied) {
		if (entity) {
			const key = this._getCategoryKeyFromHref(entity.href);
			this._totalSelectedCount += numApplied[key] || 0;
			return {
				key: key,
				numOptionsSelected: numApplied[key] || 0,
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
			this._totalSelectedCount = 0;
			if (this._shouldApplyIncludeList()) {
				this.categoryIncludeList.forEach(cw => {
					const found = this._findInArray(entity.entities, e => e.href.indexOf(cw) >= 0);
					if (found) {
						filters.push(this._parseEntityToFilter(found, entity.properties.applied));
					}
				});
			} else {
				for (let i = 0; i < entity.entities.length; i++) {
					filters.push(this._parseEntityToFilter(entity.entities[i], entity.properties.applied));
				}
			}
			if (filters && filters.length) {
				if (!this.lazyLoadOptions || this._shouldLoadOptions) {
					const selectedFilterIndex = this._selectedCategory ? this._getCategoryIndexFromKey(filters, this._selectedCategory) : 0;

					// The other filters are lazily loaded when their tab is opened for the first time.
					filters[selectedFilterIndex].options = await this._getFilterOptions(filters[selectedFilterIndex].href, filters[selectedFilterIndex].key);
					filters[selectedFilterIndex].loaded = true;
				}

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
		for (let i = 0 ; i < filters.length; i++) {
			if (filters[i].key === key) {
				return i;
			}
		}
		return -1;
	}

	_getOptionStatusFromClasses(classes) {
		return !!(this._findInArray(classes, c => c === 'on'));
	}

	_getCustomPageSizeParams() {
		const customParams = this.resultSize >= 0 ? {pageSize: this.resultSize} : undefined;
		return customParams;
	}

	async _handleOptionsChanged() {
		this._dispatchFiltersUpdating();

		const applied = await this._toggleFilterOptions(this._getAllSelectedOptions());
		this._dispatchFiltersUpdated(applied);
	}

	async _handleDropdownOpened() {
		if (this.lazyLoadOptions && this._filters && this._filters.length) {
			this._shouldLoadOptions = true;
			await this._handleFilterCategorySelected({detail: {categoryKey: this._selectedCategory || this._filters[0].key}});
		}
	}

	async _handleOptionChanged(e) {
		const option = this._getFilterOptionByKey(e.detail.categoryKey, e.detail.menuItemKey);
		if (option && option.selected !== e.detail.selected) {
			this._dispatchFiltersUpdating();
			const filter = this._getFilterCategoryByKey(e.detail.categoryKey);
			const apply = await this._toggleOption(filter, option);
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

	async _handleFilterCategorySelected(e) {
		this._selectedCategory = e.detail.categoryKey;
		if (!this._shouldLoadOptions) {
			this._shouldLoadOptions = true;
			if (this.lazyLoadOptions) {
				return;
			}
		}

		const filterIndex = this._filters.findIndex(f => f.key === e.detail.categoryKey);
		const filter = this._filters[filterIndex];
		if (!filter.loaded) {
			const options = await this._getFilterOptions(filter.href, filter.key);
			this.set(`_filters.${filterIndex}.options`, options);
			filter.loaded = true;
		}
	}

	_handleFilterCategorySearched(e) {
		for (let i = 0; i < this._filters.length; i++) {
			if (this._filters[i].key === e.detail.categoryKey) {
				for (let j = 0; j < this._filters[i].options.length; j++) {
					if (e.detail.value === '') {
						this.set(`_filters.${i}.options.${j}.hidden`, false);
					} else {
						if (this._filters[i].options[j].title.toLowerCase().indexOf(e.detail.value.toLowerCase()) > -1) {
							this.set(`_filters.${i}.options.${j}.hidden`, false);
						} else {
							this.set(`_filters.${i}.options.${j}.hidden`, true);
						}
					}
				}
			}
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
			const categories = this.shadowRoot.querySelectorAll('d2l-labs-filter-dropdown-category');
			const categoriesArray = Array.from(categories);
			const category = categoriesArray.find(cat => cat.key === cKey);
			const search = (category && category.searchValue) ? category.searchValue : '';

			return filter.entity.entities.map(o => {
				return {
					title: o.title,
					key: o.properties.filter,
					categoryKey: cKey,
					hidden: search !== '' && !o.title.toLowerCase().includes(search),
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
					this._totalSelectedCount -= f.numOptionsSelected;
					this.set(`_filters.${j}.numOptionsSelected`, 0);
					for (let i = 0; i < this._filters[j].options.length; i++) {
						this.set(`_filters.${j}.options.${i}.selected`, false);
					}
					applyAll = await this._apply(cleared);
				} else {
					let apply = null;
					for (let i = 0; i < f.options.length; i++) {
						const o = f.options[i];
						const optionShouldBeSelected = this._findInArray(activatedOptions, ao => ao.categoryKey === f.key && ao.optionKey === o.key);
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
		try {
			return await this._performSirenActionWithQueryParams(this._getAction(entity, 'apply'), customParams);
		} catch (err) {
			this._dispatchFilterError(err);
			return Promise.reject(err);
		}
	}

	async _toggleOption(filter, option) {
		let result = null;
		const filterIndex = this._filters.findIndex(f => f.key === filter.key);
		try {
			result = await this._performSirenActionWithQueryParams(option.toggleAction);
			option.selected = !option.selected;
			if (option.selected) {
				this.set(`_filters.${filterIndex}.numOptionsSelected`, filter.numOptionsSelected + 1);
				this._totalSelectedCount++;
			} else {
				this.set(`_filters.${filterIndex}.numOptionsSelected`, filter.numOptionsSelected - 1);
				this._totalSelectedCount--;
			}
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
		for (let i = 0; i < this._filters.length; i++) {
			this.set(`_filters.${i}.numOptionsSelected`, 0);
			for (let j = 0; j < this._filters[i].options.length; j++) {
				this.set(`_filters.${i}.options.${j}.selected`, false);
			}
		}
		this._totalSelectedCount = 0;

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

	_getAllSelectedOptions() {
		const result = [];
		const categories = this.shadowRoot.querySelectorAll('d2l-labs-filter-dropdown-category');
		for (let i = 0; i < categories.length; i++) {
			const options = categories[i].querySelectorAll('d2l-labs-filter-dropdown-option');
			for (let j = 0; j < options.length; j++) {
				if (options[j].selected) {
					result.push({categoryKey: categories[i].key, optionKey: options[j].value});
				}
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
		this.dispatchEvent(
			new CustomEvent(
				'd2l-hm-filter-filters-updated',
				{
					detail: {
						filteredActivities: filtered,
						totalSelectedFilters: this._totalSelectedCount
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
						totalSelectedFilters: this._totalSelectedCount
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
		const query = [];
		if (queryString) {
			const pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
			for (let i = 0; i < pairs.length; i++) {
				const pair = pairs[i].split('=');
				const decodedKey = this._urlDecodePlusAsSpace(pair[0]);
				const decodedValue = this._urlDecodePlusAsSpace(pair[1] || '');
				query[i] = [decodedKey, decodedValue];
			}
		}
		return query;
	}

	_urlDecodePlusAsSpace(str) {
		if (!str) {
			return str;
		}
		const strWithPlusAsSpace = str.replace('+', ' ');
		const strDecoded = window.decodeURIComponent(strWithPlusAsSpace);
		return strDecoded;
	}
}

window.customElements.define(D2LHypermediaFilter.is, D2LHypermediaFilter);
