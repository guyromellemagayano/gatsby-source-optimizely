# @epicdesignlabs/gatsby-source-optimizely

This unofficial source plugin makes Optimizely/Episerver API data available in GatsbyJS sites. Currently in active development.

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
![GitHub](https://img.shields.io/github/license/Epic-Design-Labs/gatsby-source-optimizely)
![npm](https://img.shields.io/npm/dt/@epicdesignlabs/gatsby-source-optimizely)
![GitHub issues](https://img.shields.io/github/issues/Epic-Design-Labs/gatsby-source-optimizely)
![GitHub closed issues](https://img.shields.io/github/issues-closed/Epic-Design-Labs/gatsby-source-optimizely)
![GitHub pull requests](https://img.shields.io/github/issues-pr/Epic-Design-Labs/gatsby-source-optimizely)
![GitHub closed pull requests](https://img.shields.io/github/issues-pr-closed/Epic-Design-Labs/gatsby-source-optimizely)
![GitHub contributors](https://img.shields.io/github/contributors/Epic-Design-Labs/gatsby-source-optimizely)
![GitHub package.json version](https://img.shields.io/github/package-json/v/Epic-Design-Labs/gatsby-source-optimizely)
![GitHub commit activity](https://img.shields.io/github/commit-activity/y/Epic-Design-Labs/gatsby-source-optimizely)

## Features

- Support for multiple `optimizely/episerver` API versions
- Support for multiple, additional custom headers
- Support for custom request timeout in all `optimizely/episerver` API requests
- Support for data caching on subsequent `gatsby` source plugin runs
- Support for request timeouts in all `optimizely/episerver` API requests
- Support for throttling, debouncing, and adjusting the number of concurrent `optimizely/episerver` API requests
- Add support for `expanded` data on some content blocks: `images`, `dynamicStyles`, `items`, `form` key fields are currently supported with more to come in the future

## Installation and Setup

For `npm`:

```console
npm install @epicdesignlabs/gatsby-source-optimizely
```

For `yarn`:

```console
yarn add @epicdesignlabs/gatsby-source-optimizely
```

Setup this plugin in `gatsby-config.js` as follows **_(\*required fields)_**:

```javascript
module.exports = {
	// ...

	plugins: [
		// ...

		{
			resolve: "@epicdesignlabs/gatsby-source-optimizely",
			options: {
				auth: {
					site_url: process.env.OPTMIZELY_API_SITE_URL // The URL of the Optimizely/Episerver API site,
					username: process.env.OPTMIZELY_API_USERNAME // The username of the Optimizely/Episerver API user.,
					password: process.env.OPTMIZELY_API_PASSWORD // The password of the Optimizely/Episerver API user.,
					grant_type: process.env.OPTMIZELY_API_GRANT_TYPE, // // The grant type of the Optimizely/Episerver API user. Default is "password"
					client_id: process.env.OPTMIZELY_API_CLIENT_ID, // The client ID of the Optimizely/Episerver API user. Default is "Default"
				},
				endpoints: {
					OptimizelyLocations: "/api/locations?lang=en-us&market=US",
					OptimizelyAboutUsDesignersPageContentChildren: "/api/episerver/v2.0/content/14675/children?expand=*",
					OptimizelyAboutUsPageContentChildren: "/api/episerver/v2.0/content/14110/children?expand=*",
					OptimizelyBedAccessoriesHeadboardsPageContentChildren: "/api/episerver/v2.0/content/14129/children?expand=*",
					OptimizelyBedAccessoriesLegsPageContentChildren: "/api/episerver/v2.0/content/14131/children?expand=*",
				},
			},
		},
	],
};
```

## Configuration Options

### Endpoints

Add a single or multiple `endpoints`.

> **Note**: The `endpoints` should start with `/api/**/*` as the base URL will be added automatically via your `options.auth.site_url` value.

```javascript
options: {
	// ...

	endpoints: {
		// Single endpoint
		OptimizelyAboutUsDesignersPageContentChildren: "/api/episerver/v2.0/content/14675/children?expand=*",

		// Multiple endpoints
		OptimizelyLocations: "/api/locations?lang=en-us&market=US",
		OptimizelyAboutUsPageContentChildren: "/api/episerver/v2.0/content/14110/children?expand=*",
		OptimizelyBedAccessoriesHeadboardsPageContentChildren: "/api/episerver/v2.0/content/14129/children?expand=*",
		OptimizelyBedAccessoriesLegsPageContentChildren: "/api/episerver/v2.0/content/14131/children?expand=*",
	}
}
```

### Additional Headers

Add additional headers to the request as follows:

```javascript
options: {
	// ...

	auth: {
		headers: {
			// Single header
			"X-Custom-Header": "Custom Value",

			// Mutiple headers
			"Access-Control-Allow-Headers": "Custom Value",
			"Access-Control-Allow-Credentials": "Custom Value",
			"Access-Control-Allow-Origin": "Custom Value",
			"Access-Control-Allow-Methods": "Custom Value"
		}
	}
}
```

### Request Timeout

Set a custom request timeout for the Optimizely/Episerver API requests (in milliseconds).

**Default:** `10000` _(10 seconds)_.

```javascript
options: {
	// ...

	request_timeout: 10000;
}
```

### Request Throttling

Set a custom request throttling interval for the Optimizely/Episerver API requests (in milliseconds).

**Default:** `500` _(0.5 seconds)_.

```javascript
options: {
	// ...

	request_throttle_interval: 500;
}
```

### Request Debouncing

Set a custom request debouncing interval for the Optimizely/Episerver API requests (in milliseconds).

**Default:** `500` _(0.5 seconds)_.

```javascript
options: {
	// ...

	request_debounce_interval: 500;
}
```

### Request Concurrency

Set a custom request concurrency for the Optimizely/Episerver API requests.

**Default:** `50`.

```javascript
options: {
	// ...

	request_concurrency: 50;
}
```

## How to Query

Assuming you correctly setup the plugin in `gatsby-config.js` and you have a `OptimizelyContent` node name and its valid endpoint:

```javascript
options: {
	// ...

	endpoints: {
		OptimizelyAboutUsDesignersPageContentChildren: "/api/episerver/v2.0/content/14675/children?expand=*",
	}
}
```

you can query the data as follows:

```graphql
{
	allOptimizelyAboutUsDesignersPageContentChildren(filter: { status: { eq: "Published" } }) {
		edges {
			node {
				id
				name
				contentLink {
					id
					url
				}
				contentType
				language {
					displayName
					link
					name
				}
				status
				contentBlocks {
					displayOption
					contentLink {
						expanded {
							body
							column1Body
							column1PrimaryCTA {
								text
								target
								title
								url
							}
							column1SecondaryCTA {
								target
								text
								title
								url
							}
							column2PrimaryCTA {
								target
								text
								title
								url
							}
							column2SecondaryCTA {
								target
								text
								title
								url
							}
							contentLink {
								id
							}
							contentType
							disableImageZoom
							dynamicStyles {
								contentLink {
									id
								}
								themeColor
							}
							eyeBrow
							heading
							headingH1
							items {
								contentLink {
									id
								}
								body
								contentType
								eyeBrow
								heading
								image {
									id
									url
									expanded {
										contentLink {
											id
											url
										}
										contentType
										height
										name
										status
										url
										width
										size
									}
								}
								link {
									target
									text
									title
									url
								}
								name
								status
								parentLink {
									id
									url
								}
							}
							language {
								displayName
								name
							}
							layout
							primaryCTA {
								text
								url
								title
								target
							}
							secondaryCTA {
								target
								text
								title
								url
							}
							status
							style
							textPosition
							textPosition2
							image1 {
								id
								url
							}
						}
					}
				}
			}
		}
	}
}
```

## Contributing

Please feel free to contribute! PRs are always welcome.

## License

This source code is licensed under the **MIT** license found in the [LICENSE](LICENSE) file in the root directory of this source tree.

## Author

[**Epic Design Labs**](https://epicdesignlabs.com)
