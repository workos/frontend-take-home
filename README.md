# Frontend Take-Home Assignment

Welcome to the WorkOS Frontend Take-Home Assignment! 

In this exercise, you'll implement the UI for a simple two-tab layout that lists users and roles. You will also provide limited functionality for updating users and roles.

To get you started, we've included a [Figma design file](https://www.figma.com/design/fx1owLKquaBVfw6kt0Dy94/WorkOS---Frontend-Take-Home-Assignment?node-id=1-40&node-type=canvas&t=MiCSu7HNzqbeCLZ9-0) and a fully functional backend API. You won't need to implement all of the functionality that is implied by the design and the backend API, so be sure to follow the set of tasks listed below.

Feel free to use any frontend framework and libraries you prefer; you don't have to build everything from scratch--that isn't what you'd be doing here at WorkOS, since we use our own [Radix Themes](https://www.radix-ui.com/). If asked, be ready to explain why you chose specific libraries and how they benefit the project.

If you have any questions, feel free to reach out—we're happy to clarify anything.


## Time Consideration

We value your time! If the assignment takes you more than 8 hours, submit what you have.

Focus on quality. You should be proud of your submission. The code should be good enough for a demo, even if it is not 100% production ready.

Include a README outlining what you'd improve or do differently if you had more time.


## Getting Started

1. **Fork the Repo**: Start by forking this repository so that you have your own version to work with.
2. **Start the Backend API**:
   - Ensure you have the latest version of Node.js.
   - Run the following commands to install dependencies and start the API:
     ```bash
     cd server
     npm install
     npm run api
     ```
3. **Project Setup**: Add your project under the `client` directory.


## Design Reference

Access the [Figma Design File](https://www.figma.com/design/fx1owLKquaBVfw6kt0Dy94/WorkOS---Frontend-Take-Home-Assignment?node-id=1-40&node-type=canvas&t=MiCSu7HNzqbeCLZ9-0) for the initial design of the "Users" tab. 

**Note**: The design is a starting point—you'll need to fill in some details (e.g., loading states, error states, hover states). The "Roles" tab is not designed, so you'll create a design based on the "Users" tab.


## Backend API

The API provides full CRUD support for users and roles, but you won’t need to use every endpoint.

**Do not alter the backend API**.

The API includes intentional latency and random server errors to simulate real-world scenarios. Ensure your frontend handles these gracefully.

You can adjust the API speed using the `SERVER_SPEED` environment variable:
  - **slow**: Simulate slower network (`SERVER_SPEED=slow npm run api`)
  - **instant**: Remove latency (`SERVER_SPEED=instant npm run api`)

You can run backend tests by executing `npm run test` in the `server` directory. The test code is located at `server/src/api.test.ts`.


## Tasks Overview

Work on the following tasks in this order. If you can’t complete all tasks, focus on quality rather than quantity.

1. Setup the "Users" and "Roles" tab structure
2. Add the users table
3. Add support for filtering the users table via the "Search" input field
4. Add support for deleting a user via the "more" icon button dropdown menu
5. Add support for viewing all roles in the "Roles" tab
6. Add support for renaming a role in the "Roles" tab
7. [Bonus] Add pagination to the user table


## Evaluation Criteria

We’ll evaluate based on the following:

- **User Experience (UX)**: Clean and intuitive interface.
- **Component Composition**: Modular and reusable components.
- **State Management & Caching**: Efficient handling of data.
- **Error & Loading States**: Graceful handling of API delays and errors.
- **CSS Animations**: Best practices followed for smooth UI interactions.
- **Code Quality**: Clean, well-structured, and maintainable code.
- **Accessibility**: Keyboard navigability and a11y considerations.


## Submission Guidelines

**Do not submit a pull request against the WorkOS repo.**

Include a README explaining:
  - How to run your project.
  - What you'd improve or do differently if you had more time.

Share your GitHub repo URL with us. Ensure your code runs locally based on the instructions provided in your README.