(function() {
	let search;

	const searchAction = {
		name: 'search',
		href: 'notvalid',
		method: 'GET',
		fields: [
			{
				name: 'collectionSearch',
				type: 'search'
			}
		],
		getFieldByName: function() { return this.fields; }
	};

	const searchResult = 'result';

	function _stubPerformSirenAction() {
		const result = sinon.stub(search, '_performSirenActionWithQueryParams');
		result.returns(searchResult);
		return result;
	}

	suite('d2l-hm-search', function() {
		setup(function() {
			search = fixture('basic');
		});
		test('instantiating the element works', function() {
			assert.equal('d2l-hm-search', search.tagName.toLowerCase());
		});
		test('when we set an initial value it does not fire an event', (done) => {
			const failIfFired = eventName =>
				search.addEventListener(eventName, () => done(new Error(`${eventName} should not have been fired`)));

			failIfFired('d2l-hm-search-results-loading');
			failIfFired('d2l-hm-search-results-loaded');
			failIfFired('d2l-hm-search-error');

			search.initialValue = 'fire';
			done();
		});
		test('when we search, an event is sent with the search results', (done) => {
			const  performActionStub = _stubPerformSirenAction();
			search.addEventListener('d2l-hm-search-results-loaded', function(e) {
				performActionStub.restore();
				assert.equal(searchResult, e.detail.results);
				assert.equal(false, e.detail.searchIsCleared);
				done();
			});
			search.searchAction = searchAction;
			search._handleSearch({ detail: { value: 'test' }});
		});
		test('when we search for an empty string, an event is sent with the search results', (done) => {
			const performActionStub = _stubPerformSirenAction();
			search.addEventListener('d2l-hm-search-results-loaded', function(e) {
				performActionStub.restore();
				assert.equal(searchResult, e.detail.results);
				assert.equal(true, e.detail.searchIsCleared);
				done();
			});
			search.searchAction = searchAction;
			search._handleSearch({ detail: { value: '' }});
		});
		test('when we submit a search, an event is sent to let the consumer know we are loading', (done) => {
			const performActionStub = _stubPerformSirenAction();
			search.addEventListener('d2l-hm-search-results-loading', function() {
				search.addEventListener('d2l-hm-search-results-loaded', function() {
					performActionStub.restore();
					done();
				});
			});

			search.searchAction = searchAction;
			search._handleSearch({ detail: { value: 'test' }});
		});
		test('when there is an error performing the search, an error event is sent', (done) => {
			const performActionStub = sinon.stub(search, '_performSirenActionWithQueryParams');
			performActionStub.throws('error!');
			search.addEventListener('d2l-hm-search-error', function(e) {
				performActionStub.restore();
				assert.include(e.detail.error.toString(), 'error!');
				done();
			});
			search.searchAction = searchAction;
			search._handleSearch({ detail: { value: '' }});
		});
		test('clearSearch causes search event to be thrown and value to be cleared', (done) => {
			const performActionStub = _stubPerformSirenAction();
			search.addEventListener('d2l-hm-search-results-loaded', function(e) {
				performActionStub.restore();
				assert.equal(searchResult, e.detail.results);
				assert.equal(true, e.detail.searchIsCleared);
				assert.equal('', search.shadowRoot.querySelector('d2l-input-search').value);
				done();
			});
			search.searchAction = searchAction;
			search.clearSearch();
		});
		test('_getCustomPageSizeParams returns undefined when resultSize not set', function() {
			const customPageSizeParams = search._getCustomPageSizeParams();
			assert.equal(undefined, customPageSizeParams);
		});
		[
			[undefined, undefined],
			[-1, undefined],
			[0, {pageSize: 0}],
			[1, {pageSize: 1}]
		].forEach(function(testCase) {
			test(`_getCustomPageSizeParams returns ${JSON.stringify(testCase[1])} when resultSize is ${testCase[0]}`, function() {
				search.resultSize = testCase[0];
				const customPageSizeParams = search._getCustomPageSizeParams();
				assert.deepEqual(testCase[1], customPageSizeParams);
			});
		});
		test('_parseQuery returns expected results search', function() {
			assert.deepEqual(search._parseQuery(), []);
			assert.deepEqual(search._parseQuery(''), []);
			assert.deepEqual(search._parseQuery(null), []);
			assert.deepEqual(search._parseQuery('?key'), [['key', '']]);
			assert.deepEqual(search._parseQuery('key'), [['key', '']]);
			assert.deepEqual(search._parseQuery('?key=value'), [['key', 'value']]);
			assert.deepEqual(search._parseQuery('key=value'), [['key', 'value']]);
			assert.deepEqual(search._parseQuery('?key=value&anotherKey'), [['key', 'value'], ['anotherKey', '']]);
			assert.deepEqual(search._parseQuery('key=value&anotherKey'), [['key', 'value'], ['anotherKey', '']]);
			assert.deepEqual(search._parseQuery('?key=value&anotherKey=anotherValue'), [['key', 'value'], ['anotherKey', 'anotherValue']]);
			assert.deepEqual(search._parseQuery('key=value&anotherKey=anotherValue'), [['key', 'value'], ['anotherKey', 'anotherValue']]);
			assert.deepEqual(search._parseQuery('key=value&anotherKey=another%20Value'), [['key', 'value'], ['anotherKey', 'another Value']]);
			assert.deepEqual(search._parseQuery('%3F%3F=1'), [['??', '1']]);
			assert.deepEqual(search._parseQuery('key+with%2Bplus=value+with%2Bplus'), [['key with+plus', 'value with+plus']]);
		});
	});
})();
