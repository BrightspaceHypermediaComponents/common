window.D2LHMFilterTestFixtures = {
	get toggled_filters_result() {
		return {
			class: ['collection-filters'],
			actions: [
				{
					name: 'clear',
					href: 'data/filters.json',
					method: 'GET',
					type: 'application/x-www-form-urlencoded',
					fields: [
						{
							name: 'existingState',
							class: ['base64', 'json'],
							type: 'hidden',
							value: ''
						}
					]
				}
			],
			entities:[
				{
					rel: ['item', 'https://api.brightspace.com/rels/filters/collection'],
					href: 'data/category1.json',
					class:['collection', 'filters', 'filter-category-1'],
					title: 'By Filter Category 1'
				}, {
					rel: ['item', 'https://api.brightspace.com/rels/filters/collection'],
					href: 'data/category2.json',
					class: ['collection', 'filters', 'filter-category-2'],
					title: 'By Filter Category 2'
				}, {
					rel: ['item', 'https://api.brightspace.com/rels/filters/collection'],
					href: 'data/category3.json',
					class: ['collection', 'filters', 'filter-category-3'],
					title: 'By Filter Category 3'
				}
			]
		};
	},
	get toggled_filters_category_1_result() {
		return {
			title: 'By Filter Category 1',
			class: ['collection', 'filters', 'filter-category-1'],
			actions: [
				{
					name: 'clear',
					href: 'data/category1.json',
					method: 'GET',
					type: 'application/x-www-form-urlencoded',
					fields: [
						{
							name: 'existingState',
							class: ['base64', 'json'],
							type: 'hidden',
							value: ''
						}
					]
				}
			],
			entities: [
				{
					rel: ['item', 'https://api.brightspace.com/rels/filter'],
					title: 'Option 1',
					class: ['filter', 'on'],
					properties: {
						filter: 1
					},
					actions: [
						{
							name: 'remove-filter',
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
					]
				}
			]
		};
	},
	get toggled_filters_category_2_result() {
		return {
			title: 'By Filter Category 2',
			class: ['collection', 'filters', 'filter-category-2'],
			actions: [
				{
					name: 'clear',
					href: 'data/category2.json',
					method: 'GET',
					type: 'application/x-www-form-urlencoded',
					fields: [
						{
							name: 'existingState',
							class: ['base64', 'json'],
							type: 'hidden',
							value: ''
						}
					]
				}
			],
			entities: [
				{
					rel: ['item', 'https://api.brightspace.com/rels/filter'],
					title: 'Option 1',
					class: ['filter', 'on'],
					properties: {
						filter: 1
					},
					actions: [
						{
							name: 'remove-filter',
							href: 'data/category2.json',
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
					]
				}
			]
		};
	},
	get cleared_filters_result() {
		return {
			class: ['collection-filters'],
			actions: [
				{
					name: 'clear',
					href: 'data/filters.json',
					method: 'GET',
					type: 'application/x-www-form-urlencoded',
					fields: [
						{
							name: 'existingState',
							class: ['base64', 'json'],
							type: 'hidden',
							value: ''
						}
					]
				}, {
					name: 'apply',
					href: 'data/filters.json',
					method: 'GET',
					type: 'application/x-www-form-urlencoded',
					fields: [
						{
							name: 'existingState',
							class: ['base64', 'json'],
							type: 'hidden',
							value: ''
						}
					]
				}
			],
			entities:[
				{
					rel: ['item', 'https://api.brightspace.com/rels/filters/collection'],
					href: 'data/category1.json',
					class:['collection', 'filters', 'filter-category-1'],
					title: '_By Filter Category 1'
				}, {
					rel: ['item', 'https://api.brightspace.com/rels/filters/collection'],
					href: 'data/category2.json',
					class: ['collection', 'filters', 'filter-category-2'],
					title: '_By Filter Category 2'
				}, {
					rel: ['item', 'https://api.brightspace.com/rels/filters/collection'],
					href: 'data/category3.json',
					class: ['collection', 'filters', 'filter-category-3'],
					title: '_By Filter Category 3'
				}
			]
		};
	}
};
