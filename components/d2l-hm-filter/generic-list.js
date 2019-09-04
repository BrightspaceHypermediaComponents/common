import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { mixinBehaviors } from '@polymer/polymer/lib/legacy/class.js';
import 'd2l-facet-filter-sort/components/d2l-filter-dropdown/d2l-filter-dropdown.js';
import 'd2l-polymer-siren-behaviors/store/entity-behavior.js';
import 'd2l-polymer-siren-behaviors/store/siren-action-behavior.js';
// import './d2l-hm-filter.js';
import './d2l-new-filter.js';

class GenericList extends mixinBehaviors([D2L.PolymerBehaviors.Siren.EntityBehavior, D2L.PolymerBehaviors.Siren.SirenActionBehavior], PolymerElement) {
	static get template() {
		return html`
		<d2l-hm-filter href="[[href]]" token="[[token]]"></d2l-hm-filter>
		<!-- <d2l-hm-filter href="[[_computeFilterHref(entity)]]" token="[[token]]"></d2l-hm-filter> -->
		<dom-repeat items="[[headerColumn.headers]]" as="header">
			<template>
			</template>
		</dom-repeat>
		<div> hello!</div>
		`;
	}

	static get properties() {
		return {
			href: {
				type: String,
				value: ""
			}
			// delayedFilter: {
			// 	type: Boolean,
			// 	value: false
			// },
			// categoryWhitelist: {
			// 	type: Array,
			// 	value: []
			// }
		};
	}

	attached () {
		// this.addEventListener('d2l-hm-filter-filters-loaded', this._onFiltersLoaded);
		// this.addEventListener('d2l-hm-filter-filters-updating', this._onFiltersUpdating);
		this.addEventListener('d2l-hm-filter-filters-updated', this._onFiltersUpdated);
		// this.addEventListener('d2l-hm-filter-error', this._onFilterError);
	}

	detached() {
		// this.removeEventListener('d2l-hm-filter-filters-loaded', this._onFiltersLoaded);
		// this.removeEventListener('d2l-hm-filter-filters-updating', this._onFiltersUpdating);
		this.removeEventListener('d2l-hm-filter-filters-updated', this._onFiltersUpdated);
		// this.removeEventListener('d2l-hm-filter-error', this._onFilterError);
	}

	_computeFilterHref(entity) {
		console.log("the href is", this._getHref(entity, "https://api.brightspace.com/rels/filters"));
		return this._getHref(entity, "https://api.brightspace.com/rels/filters");
	}

	_getHref(entity, rel) {
		if (entity && entity.hasLinkByRel && entity.hasLinkByRel(rel)) {
			return entity.getLinkByRel(rel).href;
		}
		return '';
	}

	static get observers() {
		return [
			'_loadData(entity)'
		];
	}
	_loadData() {
		// console.log("the entity is", this.entity);

	}
	_onFiltersUpdated(e) {
		console.log("e", e);
		//
		this.entity = e.detail.filteredActivities;
	}
}

window.customElements.define("generic-list", GenericList);
