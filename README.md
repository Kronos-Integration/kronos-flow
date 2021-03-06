[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Build Status](https://secure.travis-ci.org/Kronos-Integration/kronos-flow.png)](http://travis-ci.org/Kronos-Integration/kronos-flow)
[![codecov.io](http://codecov.io/github/Kronos-Integration/kronos-flow/coverage.svg?branch=master)](http://codecov.io/github/Kronos-Integration/kronos-flow?branch=master)
[![Coverage Status](https://coveralls.io/repos/Kronos-Integration/kronos-flow/badge.svg)](https://coveralls.io/r/Kronos-Integration/kronos-flow)
[![Known Vulnerabilities](https://snyk.io/test/github/Kronos-Integration/kronos-flow/badge.svg)](https://snyk.io/test/github/Kronos-Integration/kronos-flow)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![npm](https://img.shields.io/npm/v/kronos-flow.svg)](https://www.npmjs.com/package/kronos-flow)
[![Greenkeeper](https://badges.greenkeeper.io/Kronos-Integration/kronos-flow.svg)](https://greenkeeper.io/)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/Kronos-Integration/kronos-flow)
[![License](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)
[![minified size](https://badgen.net/bundlephobia/min/kronos-flow)](https://bundlephobia.com/result?p=kronos-flow)
[![downloads](http://img.shields.io/npm/dm/kronos-flow.svg?style=flat-square)](https://npmjs.org/package/kronos-flow)
[![GitHub Issues](https://img.shields.io/github/issues/Kronos-Integration/kronos-flow.svg?style=flat-square)](https://github.com/Kronos-Integration/kronos-flow/issues)

# kronos-flow

A flow is a bunch of steps and the connection between the steps. So a flow is a directed graph.
The edges are the connections between the steps. The vertex is the step.
A flow has inbound and outbound steps and processing steps.
A flow must fulfill the following requirements:

-   It must have a name.
-   It must have a description.
-   It must have at least one inbound step.
-   All the steps must have at least one connection.
-   All steps must be reachable from the inbound steps.

A Flow may also have endpoints which could be connected to the steps. So it is
possible to bundle steps in a flow. From the outside the flows acts as a single step.

# API

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

### Table of Contents

-   [Flow](#flow)
    -   [endpointFor](#endpointfor)
    -   [connectEndpoints](#connectendpoints)
    -   [connectRootEndpoints](#connectrootendpoints)
    -   [name](#name)
-   [FlowProviderMixin](#flowprovidermixin)
-   [willBeUnregistered](#willbeunregistered)

## Flow

**Extends Step**

This is the flow implementation.
It holds all the steps.
Declares the following properties:
\-steps
\-autostart

**Parameters**

-   `config` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** the definition used to create the flow
-   `owner` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** owner of the flow

### endpointFor

Find endpoint for given expression

**Parameters**

-   `expression` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 
-   `wait` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** for endpoint to become present (deliver a promise)
-   `problems` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 

Returns **Endpoint** found endpoint

### connectEndpoints

set the target endpoints

**Parameters**

-   `stepDefinition`  

### connectRootEndpoints

A flow has only endpoint proxies. These will be replaced by the original endpoints
of the sub steps
get the original endpoints for the Flow.

### name

Returns **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 'kronos-flow'

## FlowProviderMixin

mixin to create a _Flow_ owner.
Also incorporates _Step_ and _Interceptor_ ownership

**Parameters**

-   `superclass` **class** 

Returns **class** with flow ownership support

## willBeUnregistered

Deletes a flow from the stored flow definitions. If the flow
is currently running, it will be stopped first. After it
is stopped, it will be deleted.

**Parameters**

-   `flow`  

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)** returns a promise that is fullfilled when the flow is removed
        or one that rejects if there is no flow for the given flowName

# install

With [npm](http://npmjs.org) do:

```shell
npm install kronos-flow
```

# license

BSD-2-Clause
