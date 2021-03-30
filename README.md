# Welcome to Learning Circle!
Learning Circle is a freemium blog post web application developed primarily in TypeScript; Express.js and React.js.

Learning Circle offers a paid premium monthly subscription for eligible users that allows access to our site's premium blog posts and allows subscribed users contribute posts as well. 

To retain the premium subscription, the subscribed user must contribute a post once a week to the Learning Circle. Otherwise, membership will be canceled and no refund will be available.

# Functionalities
As a **free** user, they can...

- apply for premium membership eligibility
		- if accepted, option to pay for premium subscription
- read free posts
- search for blog posts and users based on the post **author name** and the **post's title and description**
- sort the Homepage's blog lists by **most recent (default)**, **most favorited**, and **least favorited**
- view user profiles
- favorite posts
- write comments
- reply to comments
- create an account
- login an account
- logout an account

As a **subscribed** user, in addition to the free user functions, they can...

- read both premium and free posts
- create posts, both free or premium (contribute content)
- edit/delete their posts
- view their subscription details in Settings page
- cancel their active subscription

# Technologies
| bloggies_frontend | versions |bloggies_backend | versions |
|--|--|--|--|
|TypeScript| ^4.0.3 |TypeScript  |  ^4.1.3 |
|React | ^17.0.1|ts-node |^9.1.1|
|react-dom |^17.0.1|Express| ^4.17.1|
|react-router-dom| ^5.1.7|Json Web Token | ^8.5.1 |
|redux |^4.0.5 |Bcrypt | ^5.0.0|
|react-redux| ^7.2.2 |pg |^8.5.1|
|redux-thunk |^2.3.0 |ts-jest | ^26.4.4|
 |redux-persist | ^6.0.0 |Supertest| ^6.1.3 |
 |react-bootstrap  |^1.4.3 |Docker |20.10.5|
 |styled-components  |^5.2.1 |
 |moment  |^2.29.1 |
 |stripe.js  | ^1.13.1 |
 |stripe | ^8.139.0 |
 |react-stripe-elements  |^6.1.2 |

# Installation
To run this project, you must have Docker installed and download/clone this repository to get the `bloggies_backend` and `bloggies_frontend` files. The Stripe CLI is also recommended to allow for subscription/payments. Learning Circle utilizes the Stripe webhook events to update memberships in the database.  

To setup the **backend** run the following commands in the command line (from the root directory):
	
	$ cd bloggies_backend
	$ npm install			**NOTE: Setup .env file with DB_USERNAME, DB_PASSWORD, DB_PORT variables before moving on**
	$ docker build -t learning_circle_db --build-arg DB_PASSWORD=YOUR_PASSWORD_HERE .
	$ docker run -dp YOUR_PORT_HERE:5432 --name lc_db learning_circle_db 
	$ npm start				**code will be on localhost:5000**
**To run backend tests, run `$ npm test` in `bloggies_backend/`**

To setup the **frontend** run the following commands in the command line (from the root directory):

	$ cd bloggies_frontend
	$ yarn add yarn.lock
	$ npm start  		**code will be on localhost:3000**
**To run frontend tests, run `$ npm test` in `bloggies_frontend/`**

(Stripe CLI required) To setup Stripe webhooks locally: 
	$ stripe listen --forward-to localhost:5000/checkout/webhook

#  Architecture Pattern

| Area |Type  |
|--|--|
|Entire app  |Layered architecture  |
|Frontend | Flux architecture|
|Backend | Repository pattern |

## Frontend Architecture

Learning Circle's frontend is a **Single Page Application** using React. The frontend architecture is the **Flux architecture**. The frontend utilizes a form of separation through **separation by UI component** and each component is written with their related functioning logic included within. Depending on the components, Learning Circle's **higher-order** components are more likely to contain heavier logic to pass down their child components in order to keep **lower-order** components *reusable and flexible* and be maintainable as the project grows in the future.

Data in the frontend is handled by a state management library, **Redux**, through a Provider that enables application-wide access to a Store of states. Every component under the Provider have the ability to subscribe to read the Store's states and dispatch actions to alter the the states of the Store. Global state management was used in order to **reduce prop-drilling**. **Redux** was chosen as the favorable global state management over React's `useContext` hook because Redux state can be persisted with the use of `redux-persist` library and by doing so, a user can be logged in despite ending a session without needing to do additional API calls by persisting the user-related data: `user object` and `favorites array`. Another advantage of using Redux is the usage of action creators and a rootReducer, which allows the code to be more organized by creating modular action creators and a main rootReducer that deals with only changing the global state object (the store).

>Future considerations: Separate `Routes/` into `PublicRoutes/` and `PrivateRoutes/` to add route protection.

## Backend Architecture
Files are separated by `routes/` , that allows frontend code to request data from available endpoints, and `models/`, which allows view functions to invoke a model's class method(s) to access the PostgreSQL database (through the `pg` library).

> In summary, the backend architecture utilizes the **repository pattern**.

 `Express` was used to create endpoints. `routes/` were separated by `resource` (RESTful) and uses proper HTTP verbs for each CRUD operation. Each file in `models/` is a Class representing a table (join tables excluded) in the Database Schema: `users`, `user_auth`, `posts`, `bookmarks`, and `comments`. These model classes have class methods to be invoked within the view functions of `routes/`. Each class method was written to perform a single query to simplify as much as possible.
> exception is the `Checkout model` for Stripe API, which does not has its own table within our database.

The Stripe API is used for creating purchases and subscriptions for our premium memberships. A `Checkout class` was created with methods for Stripe-related methods. 

## Database Schema (PSQL)
![learning_circle_schema](https://i.imgur.com/FgBP2gu.png)

When planning the database schema, a couple points were kept in mind:

1. Reduce unnecessary columns

- Although having such columns can make it easier to write queries for, extra columns in the long run can take up extra space and thus, increasing costs and maintenance. Unnecessary columns are data columns that can be obtained through a more complex SQL query using `JOIN`'s and `GROUP BY`'s. For example, getting the `number of bookmarks` for a post.

2. Data required for specific functionalities

- Since Learning Circle was a project that had a base functionality guideline, tables and columns were designed to meet the needs of those functionalities. The Stripe API recommended a minimum of data to store in the database as well to keep track of customers and subscriptions.

3. User satisfaction

- When thinking of data to store, a user's perspective was used to think of what informations were too much to provide and what type of data they would like to view in the application. User registration information required was reduced to `email` , `password` and a `display_name`. The `join_date` would allow users to be able to differentiate between each other when searching for a user using the **search function**. The `display_name` is  unique for the author name for a post and the user's `email` is only used for authentication purposes and email notifications.

Learning Circle's database is composed of six tables:

1.  **user_auth** - The `user_auth` table keeps a user's authentication information.
- `email` and `hashed_pwd` is required to be stored to login.
- The `join_date` is used to track the date the user registered.

>**user_auth relationships to other tables:**
>-`user_auth` *one to one* `users`

2.  **users** - The `users` table keeps a registered user's information.
- `display_name` is a required field to represent a user in the frontend.
- `membership_status` has 5 states: `none, pending, accepted, active, inactive` 
- `membership_start_date` `membership_end_date` are dates from Stripe for when a subscribed user's `current_period_start` and `current_period_end` dates.
- `last_submission_date` tracks the user's contributions for our weekly contribution requirement.
- `cancel_at` date will record the date that the user must contribute by to retain their subscription.
- `customer_id` and `subscription_id` are the ids of the user's associated Stripe customer and subscription object.

>**users relationships to other tables:**
>-  `users`  *one-to-many* && *many-to-many* `posts`,
>-  `users`  *one-to-many*  `bookmarks`,
>-  `users`  *one-to-many*  `comments`
>-  `users`  *one-to-one*  `user_auth`

3.  **posts** - The `posts` table keeps a blog post's data.

- `title` is a required column in order to create a post.
- `description` is a short 'sub-title' to the blog post and is optional.
- `body`of a post is used as the main article of the blog post and is optional.
- An `author_id` is required to create a post because only registered users may create posts.
- `created_at` and `last_updated_at` are timestamps to show users how old a post is and when the post was last updated. This will also allow users to sort the posts by most recents.
- `is_premium` marks a post as either a premium post or free post.

>**posts relationships to other tables:**
>-  `posts`  *one-to-many*  `bookmarks`,
>-  `posts`  *one-to-many*  `comments`,
>-  `posts`  *many-to-one* && *many-to-many*  `users`

4.  **bookmarks** - The `bookmarks` table is a **join** table between the `users` and `posts` for a user bookmarking a post. (ex. *a user may have many bookmarked posts and a post may have many bookmarks by users.*)

- A unique pair of `post_id` and `user_id` is kept in this table to ensure that a user may only like a specific post once at a time.
- A `GROUP BY` query will be able to show the number of favorites a post has and sort by most/least favorited.

5.  **comments** - The `comments` table stores all comments to a post.

- `author_id` is required to make a comment. Only logged in users may comment.
- `post_id` is required since a comment may only be made to a post.
- `body` is a required column and is the comment's text/main content.
- `created_at` is a timestamp that shows users when a comment was made.
- `is_reply` is a boolean that denotes whether a comment was made as a comment to a post or a comment to another comment (a **reply**)

>**comments relationships to other tables:**
>-  `comments`  *many-to-one*  `users`,
>-  `comments`  *many-to-one*  `posts`,
>-  `comments`  *one-to-many*  `replies`

6.  **replies**- The `replies` table stores two foreign keys related to the `comments`'s `id` column.

- `comment_id` is the `id` of the **reply comment**
- `reply_to_comment_id` is the `id` of the comment the `replies.comment_id` is meant to be a reply for. `reply_to_comment_id` is an `id` from the `comments` table.

>**replies relationships to other tables:**
>-  `replies`  *one-to-many*  `comments`
  
## Backend API Endpoints

|  | Endpoint | Body | Purpose |
|--|--| --| --|
| POST |/user-auth/register  | email: string, password: string, display_name: string|Registers a new user.
| POST |/user-auth/login | email: string, password: string|Authenticate credentials and logins a user.
| GET | /users | |Login required. Retrieve the currently logged in user. 
| GET |/users/search?term=[term] | | Retrieve all users matching search term.
| PATCH |/users/status-update | appStatus: string | Login required. Updates the user's membership_status
| GET |/users/membership-status | |Login required. Retrieves current user's membership status. 
| GET |/posts | | Retrieve all free posts for regular users and all posts for premium users.
|POST |/posts | title: string, description: string, body: string, is_premium: boolean | Login required. Creates a new post if current user is a subscriber.
| GET|/posts/search?term=[term] | | Retrieve all posts matching search term.
|GET|/posts/:postId | | Retrieve a specific post by post id.
|GET |/posts/user/:userId | | Retrieve a user's posts by user id.
|PATCH |/posts/:postId| | Login required. Updates a specific post by post id if current user is the author of post.
|DELETE | /posts/:postId| | Login required. Deletes a specific post by post id if current user is the author of post.
|POST|/email/send-confirmation |sendTo: string, type: string | Sends an email confirmation based on application status.
|POST |/checkout/webhook | event: object | Handles events that occur within a Stripe account via Webhook.
|POST |/checkout/create-customer | | Login required. Creates a Stripe customer object for current user.
|POST |/checkout/create-subscription | paymentMethodId: string, customerId: string| Login required. Creates a Stripe subscription for current user.
|DELETE|/checkout/cancel-subscription |subscription_id: string | Cancels a Stripe subscription by subscription id.
|POST |/checkout/retry-invoice| customer_id: string, paymentMethodId: string, invoiceId: string | Update the customer with new payment method and assign it as the default payment for subscription invoices.
|GET |/bookmarks/:userId | |Retrieves bookmarked posts for a user by user id
|POST|/bookmarks | postId: number | Login required. Creates a bookmarked post for current user.
|DELETE|/bookmarks | postId: number | Login required. Deletes a bookmarked post for current user.
|GET |/comments/:postId| | Retrieves comments for a post by post id.
|GET|/comments/:commentId/replies | | Retrieves replies for a comment by comment id.
|POST|/comments | body: string, post_id: number, author_id: number, is_reply: boolean, reply_to_comment_id: number | Creates a new comment for a post or reply for a comment.

## React Components
![lc_react_components_diagram](https://i.imgur.com/mknpGVB.png)

The diagram above illustrates the components used to develop the frontend UIs.

Aside from the components, the following files are also included:
-  `custom.d.ts` : stores customized interfaces for objects such as a
`Post`, `Comment`, `User`, `PostFormData`, `CustomReduxState`,
`SearchResults`
-  `helpers.tsx` : stores helper functions that are used throughout the project such as `isFavorited()`, `changeToURLFriendly()`, `checkSignUpDataValid()`, and `checkSignUpDateValid()`.
-  `redux/` folder that holds redux-related files of the following:
- `actionCreators.tsx` : stores functions that are used with `dispatch()` to invoke the rootReducer function in `rootReducer.tsx`
- `actionTypes.tsx` : stores variables that have a string value to reduce mistakes due to typos
- `rootReducer.tsx` : stores the rootReducer function that alters the states within the store


# Testing

Unit tests were written for the backend **models** and **routes**. Tests were done using **Jest** and **supertest**. Frontend uses Enzyme and Jest for testing.

>To view these test files, they are stored within `bloggies_backend/src/__tests__`.

1.  `user.test.ts` are the tests for the **User model**'s class methods.
2.  `usersRoutes.test.ts` are tests for the **users endpoint routes**.
3. `userAuth.test.ts` are tests for the **UserAuth model**'s class methods.
4.  `post.test.ts` are the tests for the **Post model**'s class methods.
5.  `postsRoutes.test.ts` are tests for the **posts endpoint routes**.
6.  `bookmark.test.ts` are the tests for the **Bookmark model**'s class methods.
7.  `bookmarksRoutes.test.ts` are tests for the **bookmarks endpoint routes**
8.  `comments.test.ts` are the tests for the **Comment model**'s class methods.
9. `stripe.test.ts` are tests for the **Checkout model**'s class methods.
10. `stripeRoutes.test.ts` are tests for the **checkout endpoint routes**. 
