---
layout: post
title: "S3: Secure Serverless Shortlinks On AWS"
date: 2025-07-10 05:54:18 +0200
math: false
code: false
mermaid: false
category: musings
---
Inspiration is hard to come by in many fields -- but not so in software engineering. When I attended a course on AWS offerings last year, I decided to try it out myself. With a little bit of hard work, the result was a serverless URL shortener built on AWS called shortener called [Liliput](https://liliput.mourjo.me).

A URL shortener is not an uncommon project but I wanted to focus specifically on:
- **Security**: All operations in Liliput put security as a primary concern.
- **Atomicity** with DyanamoDB for unique short links: DynamoDB supports [atomic counters](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/WorkingWithItems.html#WorkingWithItems.AtomicCounters), that is used in the link generation logic

The source code is on [Github](https://github.com/mourjo/liliput). The home screen looks like this:

![Image Description](/blog/images/2025-07-10-secure-serverless-shortlinks-on-aws-1.webp)

## What Liliput does
Liliput is a secure, serverless shortener of URLs with the following features:
- Logged-in users can create short links (like [liliput.mourjo.me/l/G4LZ1a](https://liliput.mourjo.me/l/G4LZ1a)) 
- Logged-in users can also view their previously created links
- Anonymous users can visit shortlinks
- All short links are unique to a user - if the same long link is shorted multiple times, the same short URL is returned
- Usage counts (expansion count) are tracked and displayed on the UI
- Links can be expanded at most 25 times to prevent illegitimate usage (spam and phishing)
- Verified users can create links that can be expanded unlimited times (verification process is through the source code)

Here is [a video](https://www.youtube.com/watch?v=EzdWG2OjYpE) that demoes the application.

## Focus on Security
This application is secure because of the following features:
- To create short links, you need a valid Google account
- Signing into Google uses the OAuth 2.0 with [PKCE](https://www.perplexity.ai/search/what-is-pkce-authentication-iipO5PXWQ.KvOOZvx_CQ7A)
- All cookies are[ HTTP-only](https://raw.githubusercontent.com/mourjo/liliput/refs/heads/master/images/cookies.png) (Javascript cannot access it)
- Links can only be expanded 25 times to prevent misuse, unless the user is verified
- All APIs are rate limited and alerts for when rate limit is breached

## System Design
The system is built using the following:
- DynamoDB for storage
- Amazon Cognito and Google Oauth for login flows
- Lambda functions for logic implementation (shown below)
- API gateway for mapping lambda functions to routes
- Authorizer in API gateway with another Lambda function
- Public DNS ([liliput.mourjo.me](https://liliput.mourjo.me)) for APIs


#### Logged In Flows
<img src="https://raw.githubusercontent.com/mourjo/liliput/refs/heads/master/images/flowchart_01_homepage.svg">

<img src="https://raw.githubusercontent.com/mourjo/liliput/refs/heads/master/images/flowchart_02_create_link.svg">

#### Anonymous Flows
<img src="https://raw.githubusercontent.com/mourjo/liliput/refs/heads/master/images/flowchart_03_expand_link.svg">

## Learnings
- Amazon Cognito integration with Google OAuth and managing login state in [a single-page Javascript](https://github.com/mourjo/liliput/blob/master/src/main/resources/index.html) between the OAuth dance
- The authorizer middleware in API gateway with Lambda function
- Generating IAM policy document for giving access to only verified users
- Startup with Java based Lambda functions was quite slow

## What's next for Liliput
- Verification without source code change
- Disable link expansions explicitly
- Switching between multiple Google accounts
- Searching for links shortened