# Use GraphQL and Apollo for Settings Redesign

- Deciders: Lauren Zugai, Ben Bangert, Wil Clouser, Jody Heavener, Les Orchard, Danny Coates, Barry Chen, Vijay Budhram, Dave Justice, Alex Davis
- Date: 2020-05-05

## Context and Problem Statement

The [Settings Redesign project](https://jira.mozilla.com/browse/FXA-840) will be created [as a new React application](https://github.com/mozilla/fxa/blob/master/docs/adr/0011-create-new-react-app-for-settings-redesign.md) and in turn, has opened the door to assess certain pieces of our technology stack.

[GraphQL](https://graphql.org/), or GQL, is not a database query language, but is instead a query language for APIs. It _describes_ data requirements, and is a powerful alternative to REST. Some benefits can be gained by using it on top of existing REST architecture.

"Apollo" in this document refers to the "Apollo client" and "Apollo server" pieces of the Apollo platform¹, which can be described as a unified data layer that enables applications to interact with data from data stores and APIs. In other words, it allows us to write and handle GraphQL on the client and server. Apollo also gives us many tools out of the box like caching.

This ADR serves to lay out pros and cons of using GraphQL and Apollo in the Settings Redesign project as an alternative to hitting our conventional REST endpoints.

¹Apollo also offers Apollo Graph Manager and Apollo Federation which are paid services, [read more from their docs](https://www.apollographql.com/docs/intro/platform/). We do not need to use these to use GQL with Apollo server or Apollo client.

## Decision Drivers

- Performance
- Easy API setup and React integration
- Clarity around "what's happening?" and data received from the server
- Development speed, both around initial setup and as new features roll out

## Considered Options

- Option A - Send standard CRUD requests to our REST endpoints
- Option B - Layer GraphQL and Apollo on top of our REST architecture, making direct database calls for basic operations
- Option C - Full GraphQL and Apollo integration with direct database calls

## Decision Outcome

Chosen option: "B - Layer GraphQL on top of our REST architecture", because:

- GQL seems to be the ideal solution to the heavy number of network requests on the main Settings page where around 17 different requests are sent to our REST API, and a lot of data received is superfluous. GQL moves us towards a performant solution that consolidates these initial requests and reduces overfetching in other requests.
- Allowing developers to query for and expect only exactly what is needed with end-to-end typing and a more "declarative" way of thinking towards data requirements makes it painfully clear what's being sent and received between client and server.
- The React Settings application will only have to manage interacting with a single endpoint and Apollo Client makes managing the data in our React app straightforward.
- Does not preclude option C, as we can replace or supplement direct calls to the FxA auth-server down the line. This is faster for initial development, and this option over option C will also help mitigate risk around using a relatively novel piece of technology for FxA.

## Pros and Cons of the Options

### Option A - Send standard CRUD requests to our REST endpoints

#### Description

- Don't use GraphQL. Send all requests to their corresponding endpoints.

##### Pros:

- No novel tech.
- No additional setup time.
- No new technical debt.
- Our REST API setup has been vetted by years of use in production.

##### Cons:

- We'd still want to work towards optimizing the way we do our Settings page network calls, which has around 17 executed sequentially. REST results in either overfetching data, doing more queries than is needed, or spending additional time manually optimizing calls as we update the Settings page.
- We may need to figure out a more ideal way to organize our API calls than using `fxa-payments-server` as a blueprint.
- We'll be turning down all of the benefits laid out in the GraphQL section, like clarity on the client-side around what data is being sent and received.
- If we later choose to use GraphQL, even with the option B approach, we'll face a lot of refactoring at a later time that could be mitigated now.

### Options B & C - use GraphQL and Apollo

#### Description

This section outlines the pros and cons for using GraphQL and Apollo in general and applies to both options B and C.

While GraphQL will be novel tech to the FxA stack, it's not entirely novel to the FxA ecosystem. That is to say, the Admin Panel project (`fxa-admin-panel`/`fxa-admin-server` packages) served as a prototype for experimenting with GQL and Apollo.

##### Pros

- We can use GQL for all Settings Redesign needs and won't need to mix GQL and REST.
- GQL can consolidate network requests. Even if some GQL queries need to be fed into the auth-server (option B), the client will be relieved of a heavy network request burden and instead, a single request from the client asks the server to perform all of the requests. This will offer a performance boost especially on the main Settings page, where currently around 17 different requests must be made.
- Since only required data will be requested, the data returned won't be overfetched like it is in traditional REST architecture, resulting in a smaller payload.
- GQL offers a flexible and declarative approach to data - both FE and BE developers can focus on describing the data rather than implementing and optimizing numerous REST endpoints. This makes it painfully clear what's being sent and received between client and server which can improve visibility into what's happening in components.
- GraphQL and Apollo have gained a lot of popularity over the years and now have substantial community support and company backing (Airbnb, Facebook, SurveyGizmo, Github, and many others).
- This stack promotes strong end-to-end typing.
- Apollo offers great features out of the box like caching, error handling, optimistic rendering, and nice integration tools for React (and even provides React hooks).
- The React Settings application will only have to manage interacting with a single endpoint and Apollo Client makes managing the data in our React app straightforward. Apollo Client creates its own internal Redux store under the hood and allows us to store local data in the Apollo cache, the same place that data from network requests will be stored.
- Apollo also provides a "GraphQL playground" which is a graphical, interactive, in-browser GQL IDE. It not only provides easy to access schemas (and is "self-documenting" in a way), but it allows developers to write queries or mutations to send to the server so the developer can verify it behaves as expected. This can then be copied directly over to where it needs to be used in the application.
- GraphQL makes it easier to evolve APIs over time. It provides a way to deprecate schema members and discourage usage of certain parts of APIs with custom messaging.
- GraphQL is database agnostic.
- GraphQL queries are easy to write and understand.

#### Neutral

- Queries always return a 200 status code, even if the query errored. If the query is unsuccessful, the response will instead have an `errors` key with associated error messages and stacktrace. However, the error messaging can be quite detailed and include all the resolvers and refer to the exact part of the query at fault.

##### Cons

- The learning curve that comes with introducing new tech.
- Initial setup time of another service (`graphql-api-server`).
- While GQL caching can be done at the database or client level though Apollo, GQL doesn't rely on HTTP caching methods.
- While GQL has been around long enough to gain excellent community support, REST has been around with established patterns for even longer.

### Option B - Layer GraphQL and Apollo on top of our REST architecture, making direct database calls for basic operations

#### Description

- This option allows us to begin working with GraphQL and Apollo on top of our REST architecture, proxying existing auth-server calls, except where it makes sense to interact with the database directly for simple operations.

##### Pros:

- Less risk and less upfront work than option C.
- We'll still heavily reduce the number of initial network requests performed on the Settings frontend with an incremental approach. The Apollo Server can orchestrate the REST requests sufficient to fulfil just that query and return exactly the data requested.
- Apollo server can proxy to existing auth-server calls. We can incrementally swap out auth-server API calls with direct implementation.

##### Cons:

- Creates tech debt. We won't be fully integrated until we finish swapping out the auth-server API calls.
- Our stack will be less universal across FxA. We'll use REST for non-Settings FxA pages and for the payments server until refactoring can be done.
- While GraphQL is database agnostic, we will be unable to use [GraphQL Subscriptions](https://www.apollographql.com/docs/react/data/subscriptions/) because our database does not support real-time data.

### Option C - Full GraphQL and Apollo integration with direct database calls

#### Description

- This option would extend option B. The more complex operations routed through the auth-server would be directly implemented through the Apollo server.

##### Pros

- Less tech debt later.
- We would see a performance boost over option B.
- An all-out dedication to this approach could open the door to evaluating our database options (and being able to work with [GraphQL subscriptions](https://www.apollographql.com/docs/react/data/subscriptions/)) or more quickly pave a path to move our backend off of MySQL to something else for a more regional conscious architecture.

##### Cons

- Increased risk. While we'll be pushing the new Settings app to staging and production while we're building it out, the Settings Redesign project already has a lot of moving parts and an incremental approach definitely feels more ideal.
- Much more time needed for setup, and access control, auth, and security already implemented by auth-server might be expensive to reinvent.

## Additional Links

- [Settings Redesign project](https://jira.mozilla.com/browse/FXA-840) (Jira)
- [ADR for Settings Redesign as a new React App](https://github.com/mozilla/fxa/blob/master/docs/adr/0011-create-new-react-app-for-settings-redesign.md)
- [GraphQL docs](https://graphql.org/learn/)
- [Apollo docs](https://www.apollographql.com/docs/intro/platform/)
- [GraphQL subscriptions](https://www.apollographql.com/docs/react/data/subscriptions/)
- [GraphQL API Technical Specification Doc](https://docs.google.com/document/d/1ZoUsCCGwgObiG3_f99tNANODr7FZfvck2R4sOij0Lj4/edit#heading=h.2gazcsgmxkub) for Settings Redesign
