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
![npms.io (final)](https://img.shields.io/npms-io/maintenance-score/@epicdesignlabs/gatsby-source-optimizely)
![npms.io (final)](https://img.shields.io/npms-io/quality-score/@epicdesignlabs/gatsby-source-optimizely)

## Features

- Support for multiple `optimizely/episerver` API versions
- Log level options for `optimizely/episerver` API endpoint requests: `info`, `debug`, `warn`, `error`
- Support for additional headers
- Support for custom request timeout in all `optimizely/episerver` API requests
- **[BETA]** Support for data caching on subsequent source plugin runs
- **[BETA]** Add support for `expanded` data on content blocks such as `images`, `dynamicStyles`, `items`

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
					OptimizelySites: "/v2.0/site",
				},
			},
		},
	],
};
```

## Configuration Options

### Endpoints

Add a single or multiple `endpoints`.

```javascript
options: {
	// ...

	endpoints: {
		// Single endpoint
		OptimizelySites: "/v2.0/site",

		// Multiple endpoints
		OptimizelyContent: "/v2.0/content/994?expand=*",
		OptimizelyContent: "/v2.0/content/994/children?expand=*",
		OptimizelySearchContent: "/v2.0/search/content?expand=*",
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

### Log Level

Set the log level for the Optimizely/Episerver API requests. Supports `info`, `debug`, `warn`, `error`.

**Default:** `info`.

```javascript
options: {
	// ...

	log_level: "info";
}
```

### [BETA] Caching

Enable caching of the Optimizely/Episerver API requests on subsequent source plugin runs. Supports `true`, `false`.

**Default:** `true`.

```javascript
options: {
	// ...

	enable_cache: true;
}
```

### Request Timeout

Set a custom request timeout for the Optimizely/Episerver API requests (in milliseconds).

**Default:** `0`.

```javascript
options: {
	// ...

	request_timeout: 0;
}
```

## How to Query

Assuming you correctly setup the plugin in `gatsby-config.js` and you have a `OptimizelyContent` node name and its valid endpoint:

```javascript
options: {
	// ...

	endpoints: {
		OptimizelyContent: "/v2.0/content/994?expand=*";
	}
}
```

you can query the data as follows:

```graphql
{
	allOptimizelyContent(limit: 1) {
		edges {
			node {
				contentBlocks {
					contentLink {
						id
						expanded {
							anchor1
							subHeading
							name
							altText1
							autoCrop
							body
							column1Body
							column1PrimaryCTA {
								target
								text
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
							contentType
							disableImageZoom
							displayFilter

							eyeBrow
							fourColumnDisplay
							fullBleed
							heading
							headingH1
							height
							image {
								url
								guidValue
								id
								workId
							}
							image1 {
								guidValue
								id
								url
								workId
							}
							imageRatio
							images {
								displayOption
							}
							items {
								displayOption
							}
							layout
							link {
								target
								text
								title
								url
							}
							logo {
								guidValue
								id
								url
								workId
							}
							logoAltText
							maxCount
							mediaTextColor
							noAutoPlay
							orientation
							parentPage {
								guidValue
								id
								url
								workId
							}
							primaryCTA {
								target
								text
								title
								url
							}
							recurse
							secondaryCTA {
								target
								text
								title
								url
							}
							style
							textAlign
							textPosition
							textPosition2
							themeColor
							useEpiSort
							usePrimaryLinkStyle
							video1 {
								guidValue
								id
								url
								workId
							}
						}
						guidValue
						workId
					}
					displayOption
				}
				metaDescription
				metaTitle
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
