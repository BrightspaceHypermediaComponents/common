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
	});
})();
