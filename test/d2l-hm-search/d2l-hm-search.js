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
				done();
			});
			search.searchAction = searchAction;
			search._handleSearch({ detail: { value: 'test' }});
		});
		test('when we search for an empty string, a cleared event is sent with the search results', (done) => {
			const performActionStub = _stubPerformSirenAction();
			search.addEventListener('d2l-hm-search-results-cleared', function(e) {
				performActionStub.restore();
				assert.equal(searchResult, e.detail.results);
				done();
			});
			search.searchAction = searchAction;
			search._handleSearch({ detail: { value: '' }});
		});
		test('when there is an error performing the search, an error event is sent', (done) => {
			const performActionStub = sinon.stub(search, '_performSirenActionWithQueryParams');
			performActionStub.throws('error!');
			search.addEventListener('d2l-hm-search-error', function(e) {
				assert.include(e.detail.error.toString(), 'error!');
				done();
			});
			search.searchAction = searchAction;
			search._handleSearch({ detail: { value: '' }});
		});
	});
})();
