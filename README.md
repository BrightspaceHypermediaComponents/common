# d2l-common
[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/BrightspaceUI/common)
[![NPM version][npm-image]][npm-url]
[![Build status][ci-image]][ci-url]

Hypermedia components that can be used against standardized HM route workflows

## Installation

`d2l-common` can be installed from [NPM][npm-url]:
```shell
npm install d2l-common
```

## Usage

Include the [webcomponents.js](http://webcomponents.org/polyfills/) "loader" polyfill (for browsers who don't natively support web components), then import `d2l-common.js`:

```html
<head>
	<script src="node_modules/@webcomponents/webcomponentsjs/webcomponents-loader.js"></script>
	<script type="module" src="node_modules/d2l-common/d2l-common.js"></script>
</head>
```

```html
<d2l-common></d2l-common>
```

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

[npm-url]: https://www.npmjs.org/package/d2l-common
[npm-image]: https://img.shields.io/npm/v/d2l-common.svg
[ci-url]: https://travis-ci.org/BrightspaceUI/common
[ci-image]: https://travis-ci.org/BrightspaceUI/common.svg?branch=master
