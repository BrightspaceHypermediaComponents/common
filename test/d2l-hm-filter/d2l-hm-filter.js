import sinon from 'sinon/pkg/sinon-esm.js';
(function() {
	let filter;
	let expectedFilters = [];

	async function loadFilters(url) {
		const entity = await window.D2L.Siren.EntityStore.fetch(url, '');
		await filter._loadFilters(entity.entity);
	}

	function _assertFiltersEqualGiven(expected, filters) {
		for (let i = 0; i < expected.length; i++) {
			_assertObjectsEqual(expected[i], filters[i]);
		}
	}

	function _assertObjectsEqual(expected, obj) {
		if (expected === null || obj === null) {
			assert.equal(expected, obj);
			return;
		}
		for (const prop in obj) {
			if (obj.hasOwnProperty(prop) && prop[0] !== '_') {
				if (obj[prop] instanceof Array) {
					assert(expected[prop] instanceof Array);
					assert.equal(obj[prop].length, expected[prop].length);
					for (let i = 0; i < obj[prop].length; i++) {
						_assertObjectsEqual(expected[prop][i], obj[prop][i]);
					}
				} else if (obj[prop] instanceof Object) {
					_assertObjectsEqual(expected[prop], obj[prop]);
				} else {
					assert.equal(expected[prop], obj[prop]);
				}
			}
		}
	}

	function _fetchPromise(object) {
		return Promise.resolve({
			ok: true,
			json: function() {
				return Promise.resolve(JSON.stringify(object));
			}
		});
	}

	async function _toggleOption(f, o, fetch) {
		const result = fetch || sinon.stub(window.d2lfetch, 'fetch');
		result.withArgs(`${window.location.origin}/data/filters.json?n=e&existingState=`, sinon.match.any).returns(_fetchPromise(window.testFixtures.toggled_filters_result));
		result.withArgs(`${window.location.origin}/data/category1.json?n=e&existingState=`, sinon.match.any).returns(_fetchPromise(window.testFixtures.toggled_filters_category_1_result));
		await filter._toggleOption(filter._filters[f], filter._filters[f].options[o]);
		return result;
	}

	function _addExpectedOptions(f) {
		expectedFilters[f].options = [
			{
				title: 'Option 1',
				key: 'Option1',
				categoryKey: expectedFilters[f].key,
				selected: false,
				toggleAction: {
					name: 'add-filter',
					href: expectedFilters[f].href,
					method: 'GET',
					type: 'application/x-www-form-urlencoded',
					fields: [
						{
							name: 'existingState',
							type: 'hidden',
							value: ''
						}
					]
				}
			}
		];
		expectedFilters[f].loaded = true;
	}

	function _resetExpected() {
		expectedFilters = [];
		for (let i = 1; i <= 3; i++) {
			expectedFilters.push({
				key: `filter-category-${i}`,
				title: `By Filter Category ${i}`,
				href: `data/category${i}.json`,
				loaded: false,
				clearAction: null,
				options: []
			});
		}
		_addExpectedOptions(0);
	}

	suite('d2l-hm-filter', function() {
		setup(function() {
			filter = fixture('basic');
			_resetExpected();
		});
		test('instantiating the element works', function() {
			assert.equal('d2l-hm-filter', filter.tagName.toLowerCase());
		});
		test('attributes are set correctly', function() {
			assert.equal('blah', filter.href);
			assert.equal('t', filter.token);
		});
		test('filters are imported correctly', async() => {
			await loadFilters('data/filters.json');
			assert.equal(expectedFilters.length, filter._filters.length);
			_assertFiltersEqualGiven(expectedFilters, filter._filters);
		});
		test('whitelist filters and sorts available filters', async() => {
			const whiteList = ['filter-category-3', 'filter-category-1'];
			filter.categoryWhitelist = whiteList;
			await loadFilters('data/filters.json');
			assert.equal(whiteList.length, filter._filters.length);
			expectedFilters = expectedFilters.filter(ef => whiteList.includes(ef.key));
			expectedFilters = expectedFilters.sort((a, b) => {
				var a1 = whiteList.indexOf(a.key);
				var b1 = whiteList.indexOf(b.key);
				if (a1 > b1) { return 1; }
				if (b1 > a1) { return -1; }
				return 0;
			});
			for (let i = 0; i < expectedFilters.length; i++) {
				if (i === 0) {
					_addExpectedOptions(i);
				} else {
					expectedFilters[i].loaded = false;
					expectedFilters[i].options = [];
				}
			}
			_assertFiltersEqualGiven(expectedFilters, filter._filters);
		});
		test('switching to a new tab loads new filter options', async() => {
			await loadFilters('data/filters.json');
			const tFilter = 1;
			await filter._handleSelectedFilterChanged({detail: { selectedKey: expectedFilters[tFilter].key }});
			_addExpectedOptions(tFilter);
			_assertFiltersEqualGiven(expectedFilters, filter._filters);
		});
		test('switching to an already selected tab does not reload filter options', async() => {
			await loadFilters('data/filters.json');
			const tFilter = 1;
			await filter._handleSelectedFilterChanged({detail: { selectedKey: expectedFilters[tFilter].key }});
			_addExpectedOptions(tFilter);
			const getSpy = sinon.spy(filter, '_getFilterOptions');
			await filter._handleSelectedFilterChanged({detail: { selectedKey: expectedFilters[0].key }});
			assert.equal(0, getSpy.callCount);
			getSpy.restore();
		});
		test('toggling a filter works correctly', async() => {
			const tFilter = 0;
			const tOption = 0;
			await loadFilters('data/filters.json');
			const fetchStub = await _toggleOption(tFilter, tOption);
			fetchStub.restore();
			expectedFilters[tFilter].options[tOption].selected = true;
			expectedFilters[tFilter].options[tOption].toggleAction.name = 'remove-filter';
			_assertFiltersEqualGiven(expectedFilters, filter._filters);
		});
		test('clearing all filters works correctly', async() => {
			await loadFilters('data/filters.json');
			const fetchStub = await _toggleOption(0, 0);
			fetchStub.reset();
			fetchStub.withArgs(`${window.location.origin}/data/filters.json?n=e&existingState=`, sinon.match.any).returns(_fetchPromise(window.testFixtures.cleared_filters_result));
			await filter._clearAllOptions();
			fetchStub.restore();
			_assertFiltersEqualGiven(expectedFilters, filter._filters);
		});
	});
})();
