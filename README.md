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

Provide support for the following features:

- Multiple `optimizely/episerver` API versions
- Multiple, additional custom headers
- Custom request timeout in all `optimizely/episerver` API requests
- Data caching on subsequent `gatsby` source plugin runs
- Request timeouts in all `optimizely/episerver` API requests
- Throttling, debouncing, and adjusting the number of concurrent `optimizely/episerver` API requests
- Add support for `expanded` data on some content blocks: `images`, `dynamicStyles`, `items`, `form`, `image1`, `image` key fields are currently supported with more to come in the future
- Option for opting out of type inference for `optimizely/episerver` API `gatsby` nodes or add custom `gatsby` node schemas for `optimizely/episerver` API `gatsby` nodes
<!-- - Image optimizations for `optimizely/episerver` API `gatsby` nodes with `localFile` as the `gatsby` node field -->

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
        endpoints: [
          {
            nodeName: "OptimizelyPageContent",
            endpoint:
              "/api/episerver/v2.0/content?references=14099,14104,14105,14106,14107,14109,14111,14110,14112,16621,14118,14117,14119,14980&expand=*",
            schema: null
          },
          {
            nodeName: "OptimizelyHomePageContentChildren",
            endpoint: "/api/episerver/v2.0/content/14099/children?expand=*",
            schema: null
          },
          {
            nodeName: "OptimizelyLocations",
            endpoint: "/api/locations?lang=en-us&market=US",
            schema: `
              id: ID!
              images: [String]
              inRiverId: Int!
              latitude: String
              sharpenImages: [File] @link(from: "fields.localFile")
            `
          }
        ]
      },
    },
  ],
};
```

## Configuration Options

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

### Endpoints

Add a single or multiple `endpoints`.

> **Note**: The `endpoints` should start with `/api/**/*` as the base URL will be added automatically to your `options.auth.site_url` value.

```javascript
options: {
  // ...

  endpoints: [
    // Single endpoint
    {
      nodeName: "OptimizelyPageContent",
      endpoint: "/api/episerver/v2.0/content?references=14099,14104,14105,14106,14107,14109,14111,14110,14112,16621,14118,14117,14119,14980&expand=*",
      schema: null
    },

    // Multiple endpoints
    {
      nodeName: "OptimizelyHomePageContentChildren",
      endpoint: "/api/episerver/v2.0/content/14099/children?expand=*",
      schema: null
    },
    {
      nodeName: "OptimizelyLocations",
      endpoint: "/api/locations?lang=en-us&market=US",
      schema: `
        type OptimizelyLocations implements Node {
          id: ID!
          images: [String]
          inRiverId: Int!
          latitude: String
          sharpenImages: [File] @link(from: "fields.localFile")
        }
      `
    }
  ];
}
```

### Global Schema

Add a global schema to all `endpoints`. This will be merged with the `endpoint` schema. This is useful for adding global types that affect multiple `endpoints`.

```javascript
options: {
  // ...

  globals: {
    schema: `
      type ContentLink {
        id: Int!
        url: String!
      }
    `
  },
  endpoints: [
    {
      nodeName: "OptimizelyPageContent",
      endpoint: "/api/episerver/v2.0/content?references=14099,14104,14105,14106,14107,14109,14111,14110,14112,16621,14118,14117,14119,14980&expand=*",
      schema: `
        id: ID!
        name: String
        metaTitle: String
        metaDescription: String
        contentLink: ContentLink
      `
    }
  ]
}
```

### Request Timeout

Set a custom request timeout for the Optimizely/Episerver API requests (in milliseconds).

**Default:** `0` _(0 second)_.

```javascript
options: {
  // ...

  request_timeout: 0;
}
```

### Request Throttling

Set a custom request throttling interval for the Optimizely/Episerver API requests (in milliseconds).

**Default:** `0` _(0 second)_.

```javascript
options: {
  // ...

  request_throttle_interval: 0;
}
```

### Request Debouncing

Set a custom request debouncing interval for the Optimizely/Episerver API requests (in milliseconds).

**Default:** `0` _(0 seconds)_.

```javascript
options: {
  // ...

  request_debounce_interval: 0;
}
```

### Request Concurrency

Set a custom request concurrency for the Optimizely/Episerver API requests.

**Default:** `10000`.

```javascript
options: {
  // ...

  request_concurrency: 10000;
}
```

## How to Query

Assuming you correctly setup the plugin in `gatsby-config.js` and you have a `OptimizelyContent` node name and its valid endpoint:

```javascript
options: {
  // ...

  globals: {
    schema: `
      type ContentLink {
        id: Int!
        url: String!
      }
    `
  },
  endpoints: [
    {
      nodeName: "OptimizelyPageContent",
      endpoint: "/api/episerver/v2.0/content?references=14099,14104,14105,14106,14107,14109,14111,14110,14112,16621,14118,14117,14119,14980&expand=*",
      schema: `
        type OptimizelyPageContent implements Node {
          id: ID!
          name: String
          metaTitle: String
          metaDescription: String
          contentLink: ContentLink
        }
      `
    }
  ]
}
```

you can query the data as follows:

```graphql
{
  allOptimizelyPageContent {
    edges {
      node {
        id
        name
        metaTitle
        metaDescription
        contentLink {
          id
          url
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
