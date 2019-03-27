(function() {
	let search;

	suite('d2l-hm-search', function() {
		setup(function() {
			search = fixture('basic');
		});
		test('instantiating the element works', function() {
			assert.equal('d2l-hm-search', search.tagName.toLowerCase());
		});
	});
})();
