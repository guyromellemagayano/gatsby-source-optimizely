# @epicdesignlabs/gatsby-source-optimizely

This official source plugin makes BigCommerce API data available in GatsbyJS sites. Currently in active development.

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

## Features

- Support for multiple Optimizely API versions
- Support for additional headers

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
					site_url: process.env.OPTMIZELY_API_SITE_URL // The URL of the Optimizely API site,
					username: process.env.OPTMIZELY_API_USERNAME // The username of the Optimizely API user.,
					password: process.env.OPTMIZELY_API_PASSWORD // The password of the Optimizely API user.,
					grant_type: process.env.OPTMIZELY_API_GRANT_TYPE, // // The grant type of the Optimizely API user. Default is "password"
					client_id: process.env.OPTMIZELY_API_CLIENT_ID, // The client ID of the Optimizely API user. Default is "Default"
				},

				// Add single or multiple `Optimizely` API endpoints to the source.
				endpoints: {
					OptimizelySites: "/v2.0/site",
					OptimizelyContent: "/v2.0/content/994?expand=*",
					OptimizelyContent: "/v2.0/content/994/children?expand=*",
					OptimizelySearchContent: "/v2.0/search/content?expand=*",
				},
			},
		},
	],
};
```

## Additional Options

### Headers

Add additional headers to the `auth` request as follows:

```javascript
options: {
	// ...

	auth: {
		siteUrl: process.env.OPTMIZELY_API_SITE_URL,
		username: process.env.OPTMIZELY_API_USERNAME,
		password: process.env.OPTMIZELY_API_PASSWORD,
		grant_type: process.env.OPTMIZELY_API_GRANT_TYPE,
		client_id: process.env.OPTMIZELY_API_CLIENT_ID,
		headers: {
			// Single header
			"X-Custom-Header": "Custom Value",

			// Mutiple headers
			"Access-Control-Allow-Credentials": "Custom Value",
			"Access-Control-Allow-Origin": "Custom Value",

			// Additional `optimizely` headers
			"Accept-Language": "en"
		}
	},
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
	allBigCommerceProducts {
		nodes {
			name
			price
			id
			sku
			variants {
				id
				product_id
				price
				cost_price
				image_url
				sku
			}
			reviews_count
			reviews_rating_sum
			page_title
			images {
				id
				description
				product_id
				date_modified
			}
			bigcommerce_id
			brand_id
			custom_url {
				url
			}
			categories
			availability
		}
		totalCount
	}
}
```

## Contributing

Please feel free to contribute! PRs are always welcome.

## License

This source code is licensed under the **MIT** license found in the [LICENSE](LICENSE) file in the root directory of this source tree.

## Author

[**Epic Design Labs**](https://epicdesignlabs.com)

## License

Released under the [MIT license](LICENSE).
