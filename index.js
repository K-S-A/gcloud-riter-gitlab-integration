'use strict';

const { request } = require('graphql-request');

const users = process.env.USERS.split(' ');

// Query for a new GraphQL API interface
const newQuery = `
  mutation($input: AnnotationTypeCreateInput!) {
    createAnnotation(input: $input) {
      resource {
        slug
      }
    }
  }
`;

const oldQuery = `
  mutation($body: String!, $storySlug: String!) {
    createAnnotation(body: $body, storySlug: $storySlug) {
      slug
    }
  }
`;

const projects = {
  'tracker': {
    endpoint: process.env.TRACKER_GRAPHQL_API_URL,
    query: oldQuery,
    queryType: 'old'
  },
  'client': {
    endpoint: process.env.CLIENT_GRAPHQL_API_URL,
    query: oldQuery,
    queryType: 'old'
  },
  'webhook-test': {
    endpoint: process.env.WEBHOOK_TEST_GRAPHQL_API_URL,
    query: newQuery,
    queryType: 'new'
  }
};

exports.http = (req, response) => {
  // respond immediately to the webhook
  response.status(200).send();

  let project;

  if(req.body.project) {
    project = projects[req.body.project.name];
  }

  // Allow only calls from specific user
  if(!project || !req.body.user || req.body.user && !users.includes(req.body.user.username)) {
    return 1;
  }

  // Validate presence of content.
  const attributes = req.body.object_attributes;

  if(!attributes) {
    return 2;
  }

  // Guess story slug.
  let storySlug;

  if(attributes.description) {
    [, storySlug] = attributes.description.match(/stories\/([\w-]+)/) || [];
  }

  if(!storySlug && attributes.source_branch) {
    [storySlug] = attributes.source_branch.match(/^[\w-]+/) || [];
  }

  // Validate presence of story slug.
  if(!storySlug) {
    return 3;
  }

  // Perform API call.
  const { url, iid, title, action } = attributes;
  const { endpoint, query, queryType } = project;

  let variables = {
    body: `[Merge request !${iid} - "${title}" (${action})](${url})`,
    storySlug: storySlug
  };

  if(queryType === 'new') {
    variables = { input: variables };
  }

  request(endpoint, query, variables).catch(() => {});
  return 0;
};

exports.event = (_event, callback) => {
  callback();
};
