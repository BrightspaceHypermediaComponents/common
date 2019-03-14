import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { mixinBehaviors } from '@polymer/polymer/lib/legacy/class.js';
import 'd2l-facet-filter-sort/components/d2l-filter-dropdown/d2l-filter-dropdown.js';
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
		<d2l-filter-dropdown></d2l-filter-dropdown>
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
			'_loadFilters(entity)'
		];
	}

	attached() {
		if (this.delayedFilter) {
			this.addEventListener('d2l-filter-dropdown-closed', this._handleOptionsChanged);
		} else {
			this.addEventListener('d2l-filter-dropdown-option-changed', this._handleOptionChanged);
		}
		this.addEventListener('d2l-filter-selected-changed', this._handleSelectedFilterChanged);
		this.addEventListener('d2l-filter-dropdown-cleared', this._handleFiltersCleared);
	}

	detached() {
		if (this.delayedFilter) {
			this.removeEventListener('d2l-filter-dropdown-closed', this._handleOptionsChanged);
		} else {
			this.removeEventListener('d2l-filter-dropdown-option-changed', this._handleOptionChanged);
		}
		this.removeEventListener('d2l-filter-selected-changed', this._handleSelectedFilterChanged);
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
			this._dispatchFilterError();
			Promise.reject(err);
		}
	}

	_getFilterDropdown() {
		return this.shadowRoot.querySelector('d2l-filter-dropdown');
	}

	_populateFilterDropdown(filter) {
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
					filters.push(this._parseEntityToFilter(entity.entities[i], entity.properties.applied));
				}
			}
			if (filters && filters.length) {
				var selectedFilterIndex = this._selectedCategory ? this._getFilterIndexFromKey(filters, this._selectedCategory) : 0;

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

	_getFilterIndexFromKey(filters, key) {
		for (var i = 0 ; i < filters.length; i++) {
			if (filters[i].key === key) {
				return i;
			}
		}
		return -1;
	}

	_getOptionStatusFromClasses(classes) {
		return !!(this._findInArray(classes, c => c === 'on'));
	}

	async _handleOptionsChanged(e) {
		const applied = await this._toggleFilters(e.detail.selectedFilters);
		this._dispatchFiltersUpdated(applied);
	}

	async _handleOptionChanged(e) {
		const option = this._getFilterOptionByKey(e.detail.categoryKey, e.detail.optionKey);
		if (option && option.selected !== e.detail.newValue) {
			const filter = this._getFilterByKey(e.detail.categoryKey);
			const apply = await this._toggleOption(filter, option);
			if (apply) {
				filter.clearAction = this._getAction(apply, 'clear');
				const applyAll = await this._apply(apply);
				if (applyAll) {
					this._clearAction = this._getAction(applyAll, 'clear');
					const applied =  await this._apply(applyAll);
					if (applied) {
						this._dispatchFiltersUpdated(applied);
					}
				}
			}
		}
	}

	async _handleSelectedFilterChanged(e) {
		const filter = this._findInArray(this._filters, f => f.key === e.detail.selectedKey);
		this._selectedCategory = e.detail.selectedKey;
		if (!filter.loaded) {
			filter.options = await this._getFilterOptions(filter.href, filter.key);
			this._populateFilterDropdown(filter);
			filter.loaded = true;
		}
	}

	async _handleFiltersCleared() {
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

	async _toggleFilters(activatedOptions) {
		if (activatedOptions && activatedOptions.length) {
			let applyAll = null;
			for (let j = 0; j < this._filters.length; j++) {
				const f = this._filters[j];
				if (this._filterShouldBeCleared(f, activatedOptions)) {
					let cleared;
					try {
						cleared = await this._performSirenActionWithQueryParams(f.clearAction);
					} catch (err) {
						this._dispatchFilterError();
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
				return await this._apply(applyAll);
			}
		} else {
			return await this._clearAllOptions();
		}
	}

	async _apply(entity) {
		try {
			return await this._performSirenActionWithQueryParams(this._getAction(entity, 'apply'));
		} catch (err) {
			this._dispatchFilterError();
			return Promise.reject(err);
		}
	}

	async _toggleOption(filter, option) {
		let result = null;
		try {
			result = await this._performSirenActionWithQueryParams(option.toggleAction);
			option.selected = !option.selected;
			this._updateToggleActions(result, filter);
		} catch (err) {
			this._dispatchFilterError();
			Promise.reject(err);
		}
		return result;
	}

	async _clearAllOptions() {
		let cleared;
		try {
			cleared = await this._performSirenActionWithQueryParams(this._clearAction);
		} catch (err) {
			this._dispatchFilterError();
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
		});
		return await this._apply(cleared);
	}

	_updateToggleActions(entity, filter) {
		filter.options.forEach(function(o) {
			o.toggleAction = this._getToggleFilterAction(entity, o);
		}.bind(this));
	}

	_getToggleFilterAction(filterEntity, option) {
		const ent = this._findInArray(filterEntity.entities, e => e.properties.filter === option.key);
		return this._getOptionToggleAction(ent);
	}

	_filterShouldBeCleared(filter, selected) {
		if (!filter.options) { return false; }
		if (!filter.options.length) { return false; }
		if (!this._findInArray(filter.options, o => o.selected)) { return false; }
		if (this._findInArray(selected, s => s.categoryKey === filter.key)) { return false; }

		return true;
	}

	_getFilterByKey(key) {
		return this._findInArray(this._filters, f => f.key === key);
	}

	_getFilterOptionByKey(cKey, oKey) {
		const filter = this._getFilterByKey(cKey);
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

	_getTotalSelectedFilters() {
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

	_dispatchFiltersUpdated(filtered) {
		this.dispatchEvent(
			new CustomEvent(
				'd2l-hm-filter-filters-updated',
				{
					detail: {
						filteredActivities: filtered,
						totalSelectedFilters: this._getTotalSelectedFilters()
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
						totalSelectedFilters: this._getTotalSelectedFilters()
					},
					composed: true,
					bubbles: true
				}
			)
		);
	}

	_dispatchFilterError() {
		this.dispatchEvent(
			new CustomEvent(
				'd2l-hm-filter-error',
				{
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
	_performSirenActionWithQueryParams(action) {
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

		return this.performSirenAction(action);
	}

	_parseQuery(queryString) {
		var query = [];
		if (queryString) {
			var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
			for (var i = 0; i < pairs.length; i++) {
				var pair = pairs[i].split('=');
				query[i] = [pair[0], pair[1] || ''];
			}
		}
		return query;
	}
}

window.customElements.define(D2LHypermediaFilter.is, D2LHypermediaFilter);
