'use strict';

const { request } = require('graphql-request');

const endpoint = `${process.env.GRAPHQL_API_URL}?api_token=${process.env.GRAPHQL_API_TOKEN}`;

// // Query for a new GraphQL API interface
// const query = `
//   mutation($input: AnnotationTypeCreateInput!) {
//     createAnnotation(input: $input) {
//       resource {
//         slug
//       }
//     }
//   }
// `;

const query = `
  mutation($body: String!, $storySlug: String!) {
    createAnnotation(body: $body, storySlug: $storySlug) {
      slug
    }
  }
`;

exports.http = async (req, response) => {
  // Allow only calls from specific user
  if(req.body.user && process.env.USERNAME && req.body.user.username !== process.env.USERNAME) {
    return response.status(200);
  }

  // Validate presence of content.
  const attributes = req.body.object_attributes;

  if(!attributes) {
    return response.status(422).send('Content is missing.');
  }

  // Guess story slug.
  var storySlug;

  if(attributes.description) {
    [, storySlug] = attributes.description.match(/stories\/([\w-]+)/) || [];
  }

  if(!storySlug && attributes.source_branch) {
    [storySlug] = attributes.source_branch.match(/^[\w-]+/) || [];
  }

  // Validate presence of story slug.
  if(!storySlug) {
    return response.status(404).send('Story identifier was not recognized.');
  }

  // Perform API call.
  const { url, iid, title, action } = attributes;

  const variables = {
    body: `[Merge request !${iid} - "${title}" (${action})](${url})`,
    storySlug: storySlug
  }

  try {
    const result = await request(endpoint, query, variables);
    return response.status(200).send(result);
  } catch(err) {
    return response.status(400).send(err);
  }
};

exports.event = (_event, callback) => {
  callback();
};
