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
			_filters: {
				type: Array,
				value: [
					// {
					// 	key: '',
					//  title: '',
					//  href: '',
					//  loaded: false,
					// 	clearAction: {},
					// 	options: [
					// 		{
					// 			key: '',
					//  		title: '',
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
			_dropDown: {
				type: Object,
				value: {}
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
	}

	detached() {
		if (this.delayedFilter) {
			this.removeEventListener('d2l-filter-dropdown-closed', this._handleOptionsChanged);
		} else {
			this.removeEventListener('d2l-filter-dropdown-option-changed', this._handleOptionChanged);
		}
		this.removeEventListener('d2l-filter-selected-changed', this._handleSelectedFilterChanged);
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
		if (!entity || (this._filters && this._filters.length)) {
			return Promise.resolve();
		}
		try {
			this._clearAction = this._getAction(entity, 'clear');
			await this._parseFilters(entity);
			this._dropdown = this._getFilterDropdown();
			this._populateFilterDropdown();
		} catch (e) {
			//console.log(e);
			// Unable to get actions and/or filters.
		}
	}

	_getFilterDropdown() {
		return this.shadowRoot.querySelector('d2l-filter-dropdown');
	}

	_populateFilterDropdown(filter) {
		if (filter) {
			filter.options.forEach(function(o) {
				this._dropdown.addFilterOption(filter.key, o.key, o.title);
			}.bind(this));
		} else {
			this._filters.forEach(function(f) {
				this._dropdown.addFilterCategory(f.key, f.title);
				f.options.forEach(function(o) {
					this._dropdown.addFilterOption(f.key, o.key, o.title);
				}.bind(this));
			}.bind(this));
		}
	}

	async _parseFilters(entity) {
		const filters = [];
		for (let i = 0; i < entity.entities.length; i++) {
			const filter = entity.entities[i];
			const item = {
				key: this._getFilterKeyFromClasses(filter.class),
				title: filter.title.replace(/^_+/, ''),
				href: filter.href,
				loaded: false,
				clearAction: this._getAction(filter, 'clear'),
				options: []
			};
			filters.push(item);
		}

		if (filters && filters.length) {
			// The other filters are lazily loaded when their tab is opened for the first time.
			filters[0].options = await this._getFilterOptions(filters[0].href);
			filters[0].loaded = true;
			this._filters = filters;
		}
	}

	_getFilterKeyFromClasses(classes) {
		return this._findInArray(classes, c => c !== 'collection' && c !== 'filters');
	}

	_getOptionStatusFromClasses(classes) {
		return !!(this._findInArray(classes, c => c === 'on'));
	}

	async _handleOptionsChanged(event) {
		const applied = await this._toggleFilters(event.detail.selectedFilters);
		this._dispatchFiltersUpdated(applied);
	}

	async _handleOptionChanged(event) {
		let filter = this._getFilterByKey(event.detail.categoryKey);
		let option = this._getFilterOptionByKey(event.detail.categoryKey, event.detail.optionKey);
		if (option && option.selected != event.detail.newValue) {
			let apply = await this._toggleOption(filter, option);
			if (apply) {
				filter.clearAction = this._getAction(apply, 'clear');
				let applyAll = await this._apply(apply);
				if (applyAll) {
					this._clearAction = this._getAction(applyAll, 'clear');
					let applied =  await this._apply(applyAll);
					if (applied) {
						this._dispatchFiltersUpdated(applied);
					}
				}
			}
		}
	}

	async _handleSelectedFilterChanged(event) {
		const filter = this._findInArray(this._filters, f => f.key === event.detail.selectedKey);
		if (!filter.loaded) {
			filter.options = await this._getFilterOptions(filter.href);
			this._populateFilterDropdown(filter);
			filter.loaded = true;

		}
	}

	async _getFilterOptions(href) {
		const options = [];
		const filter = await this._fetchFromStore(href);
		for (let i = 0; i < filter.entity.entities.length; i++) {
			const o = filter.entity.entities[i];
			options.push({
				title: o.title,
				key: this._getOptionKey(o),
				categoryKey: this._getFilterKeyFromClasses(filter.entity.class),
				selected: this._getOptionStatusFromClasses(o.class),
				toggleAction: this._getOptionToggleAction(o)
			});
		}

		return options;
	}

	_getOptionKey(option) {
		return option.title.replace(/\s/g, '');
	}

	_getOptionToggleAction(option) {
		return this._getAction(option, this._getOptionStatusFromClasses(option.class) ? 'remove-filter' : 'add-filter');
	}

	async _toggleFilters(activatedOptions) {
		if (activatedOptions && activatedOptions.length) {
			let applyAll = null;
			for (let j = 0; j < this._filters.length; j++) {
				const f = this._filters[j];
				if (this._filterShouldBeCleared(f, activatedOptions)) {
					const cleared = await this.performSirenAction(f.clearAction);
					f.clearAction = this._getAction(cleared, 'clear');
					this._updateToggleActions(cleared, f);
				} else {
					let apply = null;
					for (let i = 0; i < f.options.length; i++) {
						const o = f.options[i];
						// XOR
						if (!(this._findInArray(activatedOptions, ao => ao.categoryKey === f.key && ao.optionKey === o.key)) !== !o.selected) {
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
		return await this.performSirenAction(this._getAction(entity, 'apply'));
	}

	async _toggleOption(filter, option) {
		let result = null;
		try {
			result = await this.performSirenAction(option.toggleAction);
			option.selected = !option.selected;
			this._updateToggleActions(result, filter);
		} catch (err) {
			result = null;
		}
		return result;
	}

	async _clearAllOptions() {
		const cleared = await this.performSirenAction(this._clearAction);
		this._clearAction = this._getAction(cleared, 'clear');
		for (let i = 0; i < cleared.entities.length; i++) {
			const filterEntity = await this._fetchFromStore(cleared.entities[i].href);
			const fKey = this._getFilterKeyFromClasses(filterEntity.entity.class);
			const filter = this._findInArray(this._filters, f => f.key === fKey);
			this._updateToggleActions(filterEntity.entity, filter);
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
		const ent = this._findInArray(filterEntity.entities, e => this._getOptionKey(e) === option.key);
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

	_dispatchFiltersUpdated(filtered) {
		this.dispatchEvent(
			new CustomEvent(
				'd2l-hm-filter-filters-updated',
				{
					detail: {
						filteredActivities: filtered
					},
					composed: true,
					bubbles: true
				}
			)
		);
	}
}

window.customElements.define(D2LHypermediaFilter.is, D2LHypermediaFilter);
