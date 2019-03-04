(function() {
	let filter;

	async function loadFilters(url) {
		const entity = await window.D2L.Siren.EntityStore.fetch(url, '');
		await filter._loadFilters(entity.entity);
	}

	const expectedFilters = [
		{
			key: 'filter-category-1',
			title: 'By Filter Category 1',
			href: 'data/category1.json',
			loaded: true,
			clearAction: null,
			options:[
				{
					title: 'Option 1',
					key: 'Option1',
					categoryKey: 'filter-category-1',
					selected: false,
					toggleAction: {
						name: 'add-filter',
						href: 'data/category1.json',
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
			]
		}, {
			key: 'filter-category-2',
			title: 'By Filter Category 2',
			href: 'data/category2.json',
			loaded: false,
			clearAction: null,
			options:[]
		}
	];

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
		for (var prop in obj) {
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

	suite('d2l-hm-filter', function() {
		setup(function() {
			filter = fixture('basic');
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
	});
})();
