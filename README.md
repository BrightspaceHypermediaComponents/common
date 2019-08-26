# d2l-common
[![Build status][ci-image]][ci-url]

Hypermedia components that can be used against standardized HM route workflows

## Usage

Include the [webcomponents.js](http://webcomponents.org/polyfills/) "loader" polyfill (for browsers who don't natively support web components), then import the components you want:

```html
<head>
	<script src="node_modules/@webcomponents/webcomponentsjs/webcomponents-loader.js"></script>
	<script type="module" src="node_modules/d2l-common/components/d2l-hm-filter/d2l-hm-filter.js"></script>
</head>
```

```html
<d2l-hm-filter></d2l-hm-filter>
```

## Components

### Filter

This is a HM wrapper around the filter component from `d2l-facet-filter-sort`.  It takes a `href` for a filters collection.

## Developing, Testing and Contributing

After cloning the repo, run `npm install` to install dependencies.

If you don't have it already, install the [Polymer CLI](https://www.polymer-project.org/3.0/docs/tools/polymer-cli) globally:

```shell
npm install -g polymer-cli
```

To start a [local web server](https://www.polymer-project.org/3.0/docs/tools/polymer-cli-commands#serve) that hosts the demo page and tests:

```shell
polymer serve
```

To lint ([eslint](http://eslint.org/) and [Polymer lint](https://www.polymer-project.org/3.0/docs/tools/polymer-cli-commands#lint)):

```shell
npm run lint
```

To run unit tests locally using [Polymer test](https://www.polymer-project.org/3.0/docs/tools/polymer-cli-commands#tests):

```shell
npm run test:polymer:local
```

To lint AND run local unit tests:

```shell
npm test
```

## Versioning, Releasing & Deploying

By default, when a pull request is merged the patch version in the `package.json` will be incremented, a tag will be created, and a Github release will be created.

Include `[increment major]`, `[increment minor]` or `[skip version]` in your merge commit message to change the default versioning behavior.

[ci-url]: https://travis-ci.com/BrightspaceHypermediaComponents/common
[ci-image]: https://travis-ci.com/BrightspaceHypermediaComponents/common.svg?branch=master
