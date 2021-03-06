import '@polymer/iron-test-helpers/mock-interactions.js';

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

	function _getKeyGuid(cat) {
		const seg = cat.toString() + cat.toString() + cat.toString() + cat.toString();
		return `${seg}${seg}-${seg}-${seg}-${seg}-${seg}${seg}${seg}`;
	}

	async function _toggleOption(f, o, fetch) {
		const result = fetch || sinon.stub(window.d2lfetch, 'fetch');
		result.withArgs(sinon.match('/data/filters.json'), sinon.match.any).returns(_fetchPromise(window.D2LHMFilterTestFixtures.toggled_filters_result));
		result.withArgs(sinon.match(`/data/${_getKeyGuid(f + 1)}.json`), sinon.match.any).returns(_fetchPromise(window.D2LHMFilterTestFixtures[`toggled_filters_category_${f + 1}_result`]));
		await filter._toggleOption(filter._filters[f], filter._filters[f].options[o]);
		return result;
	}

	function _addExpectedOptions(f) {
		expectedFilters[f].options = [
			{
				title: 'Option 1',
				key: '1',
				categoryKey: expectedFilters[f].key,
				hidden: false,
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

	function _resetExpected(lazy) {
		expectedFilters = [];
		for (let i = 1; i <= 3; i++) {
			const key = _getKeyGuid(i);
			expectedFilters.push({
				key: key,
				title: `By Filter Category ${i}`,
				href: `data/${key}.json`,
				numOptionsSelected: 0,
				loaded: false,
				clearAction: null,
				options: []
			});
		}
		if (!lazy) {
			_addExpectedOptions(0);
		}
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
		test('includelist filters respected and sorts available filters', async() => {
			const includeList = ['33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111'];
			filter.categoryIncludeList = includeList;
			await loadFilters('data/filters.json');
			assert.equal(includeList.length, filter._filters.length);
			expectedFilters = expectedFilters.filter(ef => includeList.indexOf(ef.key) >= 0);
			expectedFilters = expectedFilters.sort((a, b) => {
				var a1 = includeList.indexOf(a.key);
				var b1 = includeList.indexOf(b.key);
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
			await filter._handleFilterCategorySelected({detail: { categoryKey: expectedFilters[tFilter].key }});
			_addExpectedOptions(tFilter);
			_assertFiltersEqualGiven(expectedFilters, filter._filters);
		});
		test('switching to an already selected tab does not reload filter options', async() => {
			await loadFilters('data/filters.json');
			const tFilter = 1;
			await filter._handleFilterCategorySelected({detail: { categoryKey: expectedFilters[tFilter].key }});
			_addExpectedOptions(tFilter);
			const getSpy = sinon.spy(filter, '_getFilterOptions');
			await filter._handleFilterCategorySelected({detail: { categoryKey: expectedFilters[0].key }});
			assert.equal(0, getSpy.callCount);
			getSpy.restore();
		});
		test('toggling a filter works correctly', async() => {
			const tFilter = 0;
			const tOption = 0;
			await loadFilters('data/filters.json');
			const fetchStub = await _toggleOption(tFilter, tOption);
			fetchStub.restore();
			expectedFilters[tFilter].numOptionsSelected++;
			expectedFilters[tFilter].options[tOption].selected = true;
			expectedFilters[tFilter].options[tOption].toggleAction.name = 'remove-filter';
			_assertFiltersEqualGiven(expectedFilters, filter._filters);
		});
		test('toggling multiple options works correctly', async() => {
			await loadFilters('data/filters.json');
			await filter._handleFilterCategorySelected({detail: { categoryKey: expectedFilters[1].key }});
			let fetchStub = await _toggleOption(0, 0);
			fetchStub = await _toggleOption(1, 0, fetchStub);
			fetchStub.restore();
			_addExpectedOptions(1);
			expectedFilters[0].numOptionsSelected++;
			expectedFilters[1].numOptionsSelected++;
			expectedFilters[0].options[0].selected = true;
			expectedFilters[1].options[0].selected = true;
			expectedFilters[0].options[0].toggleAction.name = 'remove-filter';
			expectedFilters[1].options[0].toggleAction.name = 'remove-filter';
			_assertFiltersEqualGiven(expectedFilters, filter._filters);
		});
		test('clearing all filters works correctly', async() => {
			await loadFilters('data/filters.json');
			const fetchStub = await _toggleOption(0, 0);
			fetchStub.reset();
			fetchStub.withArgs(`${window.location.origin}/data/filters.json?n=e&existingState=`, sinon.match.any).returns(_fetchPromise(window.D2LHMFilterTestFixtures.cleared_filters_result));
			await filter._clearAllOptions();
			fetchStub.restore();
			_assertFiltersEqualGiven(expectedFilters, filter._filters);
		});
		test('when the filters are loaded, an event is sent with the total number of filters', (done) => {
			filter.addEventListener('d2l-hm-filter-filters-loaded', function(e) {
				assert.equal(0, e.detail.totalSelectedFilters);
				done();
			});

			loadFilters('data/filters.json');
		});
		test('when preset filters are loaded, an event is sent with the total number of filters', (done) => {
			filter.addEventListener('d2l-hm-filter-filters-loaded', function(e) {
				assert.equal(1, e.detail.totalSelectedFilters);
				done();
			});

			loadFilters('data/filters-on.json');
		});
		test('searching a category filters out options that do not match', (done) => {
			filter.addEventListener('d2l-hm-filter-filters-loaded', function() {
				_assertFiltersEqualGiven(expectedFilters, filter._filters);

				expectedFilters[0].options[0].hidden = true;
				filter._handleFilterCategorySearched({detail: { categoryKey: expectedFilters[0].key, value: 'test' }});
				requestAnimationFrame(() => {
					_assertFiltersEqualGiven(expectedFilters, filter._filters);
					done();
				});
			});

			loadFilters('data/filters.json');

		});
		test('when filters are re-loaded, an applied search is re-applied', (done) => {
			let firstCategory,
				reload = false;

			filter.addEventListener('d2l-hm-filter-filters-loaded', function() {
				if (!reload) {
					reload = true;
					assert.equal(filter._filters[0].options[0].hidden, false);

					firstCategory = filter.shadowRoot.querySelector('d2l-labs-filter-dropdown-category');
					firstCategory.searchValue = 'test';
					loadFilters('data/filters-on.json');
				} else {
					assert.equal(firstCategory.searchValue, 'test');
					assert.equal(filter._filters[0].options[0].hidden, true);
					done();
				}
			});

			loadFilters('data/filters-on.json');
		});
		test('when we select a filter option, an event is sent to let the consumer know we are updating', (done) => {
			let fetchStub;
			filter.addEventListener('d2l-hm-filter-filters-updating', function() {
				filter.addEventListener('d2l-hm-filter-filters-updated', function() {
					fetchStub.restore();
					done();
				});
			});

			loadFilters('data/filters.json').then(function() {
				fetchStub = sinon.stub(window.d2lfetch, 'fetch');
				fetchStub.withArgs(`${window.location.origin}/data/11111111-1111-1111-1111-111111111111.json?n=e&existingState=`, sinon.match.any).returns(_fetchPromise(window.D2LHMFilterTestFixtures['toggled_filters_category_1_result']));
				filter._handleOptionChanged({detail: {categoryKey: '11111111-1111-1111-1111-111111111111', menuItemKey: '1'}});
			});
		});
		test('when we select the clear button, an event is sent to let the consumer know we are updating', (done) => {
			let clearStub;
			filter.addEventListener('d2l-hm-filter-filters-updating', function() {
				filter.addEventListener('d2l-hm-filter-filters-updated', function() {
					clearStub.restore();
					done();
				});
			});

			loadFilters('data/filters-on.json').then(function() {
				clearStub = sinon.stub(filter, '_clearAllOptions');
				filter._handleFiltersCleared();
			});
		});
		test('if we cannot parse the filters, an error event is sent', (done) => {
			filter.addEventListener('d2l-hm-filter-error', function() {
				done();
			});

			loadFilters('data/filters-error-no-href.json');
		});
		test('if we cannot toggle a filter option, an error event is sent', (done) => {
			filter.addEventListener('d2l-hm-filter-error', function() {
				done();
			});

			loadFilters('data/filters-error-no-clear.json').then(async function() {
				const fetchStub = await _toggleOption(0, 0);
				fetchStub.restore();
			});
		});
		test('if we cannot clear all options, an error event is sent', (done) => {
			filter.addEventListener('d2l-hm-filter-error', function() {
				done();
			});

			loadFilters('data/filters-error-no-clear-all.json').then(function() {
				filter._clearAllOptions();
			});
		});
		/* Tests for temporary _performSirenActionWithQueryParams workaround */
		test('when calling performSirenAction with no query params and no fields, the fields are empty', () => {
			const action = {
				href : 'http://127.0.0.1/',
				name: 'apply',
				type: 'application/x-www-form-urlencoded',
				method: 'GET'
			};

			const stub = sinon.stub(filter, 'performSirenAction', function(passedAction) {
				assert.deepEqual(action, passedAction);
			});
			filter._performSirenActionWithQueryParams(action);
			sinon.assert.calledWith(stub, action);
		});
		test('when calling performSirenAction with no query params, the fields are not modified', () => {

			const action = {
				href : 'http://127.0.0.1/',
				name: 'apply',
				type: 'application/x-www-form-urlencoded',
				method: 'GET',
				fields : [
					{
						type: 'hidden',
						name : 'existingField',
						value: 'existingValue'
					}]
			};

			const stub = sinon.stub(filter, 'performSirenAction', function(passedAction) {
				assert.deepEqual(action, passedAction);
			});
			filter._performSirenActionWithQueryParams(action);
			sinon.assert.calledWith(stub, action);
		});
		test('when calling performSirenAction with query params, the query params are added as fields', () => {

			const action = {
				href : 'http://127.0.0.1?testname=testvalue&anothertestname=anothertestvalue',
				name: 'apply',
				type: 'application/x-www-form-urlencoded',
				method: 'GET',
				fields : [
					{
						type: 'hidden',
						name : 'existingField',
						value: 'existingValue'
					}]
			};

			const expectedAction = {
				href : 'http://127.0.0.1?testname=testvalue&anothertestname=anothertestvalue',
				name: 'apply',
				type: 'application/x-www-form-urlencoded',
				method: 'GET',
				fields : [
					{
						type: 'hidden',
						name : 'existingField',
						value: 'existingValue'
					},
					{
						type: 'hidden',
						name : 'testname',
						value: 'testvalue'
					},
					{
						type: 'hidden',
						name : 'anothertestname',
						value: 'anothertestvalue'
					}]
			};

			const stub = sinon.stub(filter, 'performSirenAction', function(passedAction) {
				assert.deepEqual(expectedAction, passedAction);
			});
			filter._performSirenActionWithQueryParams(action);
			sinon.assert.calledWith(stub, action);
		});
		test('_parseQuery returns expected results', () => {
			assert.deepEqual(filter._parseQuery(), []);
			assert.deepEqual(filter._parseQuery(''), []);
			assert.deepEqual(filter._parseQuery(null), []);
			assert.deepEqual(filter._parseQuery('?key'), [['key', '']]);
			assert.deepEqual(filter._parseQuery('key'), [['key', '']]);
			assert.deepEqual(filter._parseQuery('?key=value'), [['key', 'value']]);
			assert.deepEqual(filter._parseQuery('key=value'), [['key', 'value']]);
			assert.deepEqual(filter._parseQuery('?key=value&anotherKey'), [['key', 'value'], ['anotherKey', '']]);
			assert.deepEqual(filter._parseQuery('key=value&anotherKey'), [['key', 'value'], ['anotherKey', '']]);
			assert.deepEqual(filter._parseQuery('?key=value&anotherKey=anotherValue'), [['key', 'value'], ['anotherKey', 'anotherValue']]);
			assert.deepEqual(filter._parseQuery('key=value&anotherKey=anotherValue'), [['key', 'value'], ['anotherKey', 'anotherValue']]);
			assert.deepEqual(filter._parseQuery('key=value&anotherKey=another%20Value'), [['key', 'value'], ['anotherKey', 'another Value']]);
			assert.deepEqual(filter._parseQuery('%3F%3F=1'), [['??', '1']]);
			assert.deepEqual(filter._parseQuery('key=value+with%2Bplus'), [['key', 'value with+plus']]);
			assert.deepEqual(filter._parseQuery('key+with%2Bplus=value+with%2Bplus'), [['key with+plus', 'value with+plus']]);
		});
		test('when calling perform siren action with no query params and no fields, the fields are empty', () => {

			const action = {
				href : 'http://127.0.0.1/',
				name: 'apply',
				type: 'application/x-www-form-urlencoded',
				method: 'GET'
			};

			const stub = sinon.stub(filter, 'performSirenAction', function(passedAction) {
				assert.deepEqual(action, passedAction);
			});

			filter._performSirenActionWithQueryParams(action);
			sinon.assert.calledWith(stub, action);
		});
		test('when calling perform siren action with no query params, the fields are not modified', () => {

			const action = {
				href : 'http://127.0.0.1/',
				name: 'apply',
				type: 'application/x-www-form-urlencoded',
				method: 'GET',
				fields : [
					{
						type: 'hidden',
						name : 'existingField',
						value: 'existingValue'
					}]
			};

			const stub = sinon.stub(filter, 'performSirenAction', function(passedAction) {
				assert.deepEqual(action, passedAction);
			});

			filter._performSirenActionWithQueryParams(action);
			sinon.assert.calledWith(stub, action);
		});
		test('when calling perform siren action with no query params and custom params, fields contain custom params', () => {

			const action = {
				href : 'http://127.0.0.1/',
				name: 'apply',
				type: 'application/x-www-form-urlencoded',
				method: 'GET'
			};

			const customParams = { customParam1: 'custom', customParam2: 'custom2' };
			sinon.stub(filter, 'performSirenAction', function(passedAction) {
				const fields = passedAction.fields;
				assert.equal(Object.keys(customParams).length, fields.length);

				Object.keys(customParams).forEach(function(p) {
					assert.isTrue(fields.some(function(elm) { return elm.name === p && elm.value === customParams[p]; }));
				});
			});

			filter._performSirenActionWithQueryParams(action, customParams);
		});
		test('when calling perform siren action with query params, the query params are added as fields', () => {

			const action = {
				href : 'http://127.0.0.1?testname=testvalue&anothertestname=anothertestvalue',
				name: 'apply',
				type: 'application/x-www-form-urlencoded',
				method: 'GET',
				fields : [
					{
						type: 'hidden',
						name : 'existingField',
						value: 'existingValue'
					}]
			};

			const expectedAction = {
				href : 'http://127.0.0.1?testname=testvalue&anothertestname=anothertestvalue',
				name: 'apply',
				type: 'application/x-www-form-urlencoded',
				method: 'GET',
				fields : [
					{
						type: 'hidden',
						name : 'existingField',
						value: 'existingValue'
					},
					{
						type: 'hidden',
						name : 'testname',
						value: 'testvalue'
					},
					{
						type: 'hidden',
						name : 'anothertestname',
						value: 'anothertestvalue'
					}]
			};

			const stub = sinon.stub(filter, 'performSirenAction', function(passedAction) {
				assert.deepEqual(expectedAction, passedAction);
			});

			filter._performSirenActionWithQueryParams(action);
			sinon.assert.calledWith(stub, action);
		});
		test('_getCustomPageSizeParams returns undefined when resultSize not set', function() {
			const customPageSizeParams = filter._getCustomPageSizeParams();
			assert.equal(undefined, customPageSizeParams);
		});
		[
			[-1, undefined],
			[0, {pageSize: 0}],
			[1, {pageSize: 1}]
		].forEach(function(testCase) {
			test(`_getCustomPageSizeParams returns ${JSON.stringify(testCase[1])} when resultSize is ${testCase[0]}`, function() {
				filter.resultSize = testCase[0];
				const customPageSizeParams = filter._getCustomPageSizeParams();
				assert.deepEqual(testCase[1], customPageSizeParams);
			});
		});
	});

	suite('d2l-hm-filter lazy', function() {
		setup(function() {
			filter = fixture('lazy');
			_resetExpected(true);
		});
		test('filters are imported correctly', async() => {
			await loadFilters('data/filters.json');
			assert.equal(expectedFilters.length, filter._filters.length);
			_assertFiltersEqualGiven(expectedFilters, filter._filters);
		});
		test('_selectedCategory loads on first dropdown open', async() => {
			await loadFilters('data/filters.json');
			await filter._handleDropdownOpened();
			_addExpectedOptions(0);
			_assertFiltersEqualGiven(expectedFilters, filter._filters);
		});
	});
})();
