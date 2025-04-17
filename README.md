# Scholar
[![Deploy](https://github.com/woodRock/ionic-scholar/actions/workflows/deploy.yml/badge.svg)](https://github.com/woodRock/ionic-scholar/actions/workflows/deploy.yml)
[![Netlify Status](https://api.netlify.com/api/v1/badges/6a024dc9-e34e-48c9-9866-ab33e0d6f8f2/deploy-status)](https://app.netlify.com/sites/ionic-scholar/deploys)

## Overview

This **individually** developed app keeps track of academic references. The app remembers the users _progress_, _keywords_, _quotes_. Also it can generate _citations_. We design the app to reduce the stress of academic writing. Frequently it can be problematic to maintain track of several numerous scholarly articles when trying to prepare a paper.

## Features

- _Register_ - the user registers an account with Email or Google authentication (2 hours)
- _Sign In_ - the user signs in to the application using Email or Google authentication (3 hours)
- _Search_ - a search engine which can query the Google Scholar database for scholarly articles (4 hours)
- _Library_ - a collection of the scholarly articles the user has saved
- _View Paper_ - displays a summary of the meta-data for a paper (title, author, year, etc), additionally includes (if any exist) their quotations, keywords and progress, with an ability to generate a citation (2 hours)
- _Edit Paper_ - allows them to remove a paper from their library. CRUD (create/remove / update/delete) (if any exist) their quotations, keywords and progress (3 hours)

## External Library

1. [Google Scholar API](https://www.npmjs.com/package/scholarly) to query the scholary articles and generate a variety of citations types for a given paper (or book, website, etc...). (Note: different library to app description)
2. [Firestore](https://firebase.google.com/docs/firestore) to store the user's scholary articles, including Google Scholar ID, and their keywords, quotes and progress
3. [Firebase Authentication](https://firebase.google.com/docs/auth) allows for 3rd party Email/Google Authentication. As a result we can use the application across multiple devices.

## Citations
```bib
@online { ionic,
  author = {Jesse Wood},
  title = {Ionic Scholar},
  year = {2020},
  url = {https://github.com/woodRock/ionic-scholar}
}
```

## Setup

### Install

To run this application we use the node package manager. Simply clone the repository. Make sure you are in the root of the directory. Then run the following command.

```bash
$npm install
```

### Troubleshooting

Google has not released an official API to access their Scholar. This means that we have to use 3rd party APIs that scrape the web results. This approach introduced multiple potential vulnerabilities. We write the application in such a way that it could be easily refactored to implement a their own API should they release it in the future.

#### CORS

Without CORS the calls to the Google Scholar API will be blocked. This means the application will not work. If you are running this using ionic serve you will need to enable Cross-Origin Requests (CORS). Using Firefox as the browser to test the development build on we can add the CORS Everywhere [extension](https://addons.mozilla.org/en-US/firefox/addon/cors-everywhere/). Similar plugins are available for Chrome.

#### Error 409

```
Error 409 Too Many requests
```

Googles bot detection can foil this application. In fact it can query any libraries that scrape its APIs. After a certain number of attempts the user must complete a captcha. However, an npm package that is a wrapper for a web scraper cannot perform this task. Therefore excessive use of this application can lead to all google scholar API calls failing. This has a 2-3 cool down. For the purposes of this development this is not time permitted. We can use a VPN to trick google and get around this robot detection.
