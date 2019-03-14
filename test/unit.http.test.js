'use strict';

const test = require('ava');
const sinon = require('sinon');
const graphqlService = require('graphql-request');

const { http } = require('..');

test.beforeEach((t) => {
  t.context.res = { status: () => { return { send: () => {} } } };
});

test('http: responds with 200 status and returns 1 when body is empty', t => {
  const req = { body: {} };
  const statusStub = sinon.stub();
  const sendStub = sinon.stub();
  const res = {status: statusStub};

  statusStub.onCall(0).returns({send: sendStub});

  t.is(http(req, res), 1);
  t.true(statusStub.calledOnce);
  t.deepEqual(statusStub.firstCall.args, [200]);
  t.true(sendStub.calledOnce);
});

test('http: returns 1 when project is missing', t => {
  const req = { body: { user: { username: 'foo' } } };

  t.is(http(req, t.context.res), 1);
});

test('http: returns 1 when user is missing', t => {
  const req = { body: { project: { name: 'tracker' } } };

  t.is(http(req, t.context.res), 1);
});

test('http: returns 1 when user is not allowed', t => {
  const req = { body: { project: { name: 'tracker' }, user: { username: 'baz' } } };

  t.is(http(req, t.context.res), 1);
});

test('http: returns 2 when project and user are present and object_attributes field is missing', t => {
  const req = { body: { project: { name: 'tracker' }, user: { username: 'bar' } } };

  t.is(http(req, t.context.res), 2);
});

test('http: returns 3 with project, user, and blank object_attributes', t => {
  const req = { body: { project: { name: 'tracker' }, user: { username: 'bar' }, object_attributes: {} } };

  t.is(http(req, t.context.res), 3);
});

test('http: returns 3 with project, user, and object_attributes without story slug data in description', t => {
  const nullDescription = { body: { project: { name: 'tracker' }, user: { username: 'bar' }, object_attributes: { description: null } } };
  const blankDescription = { body: { project: { name: 'tracker' }, user: { username: 'bar' }, object_attributes: { description: '' } } };
  const wordsDescription = { body: { project: { name: 'tracker' }, user: { username: 'bar' }, object_attributes: { description: 'some random words' } } };
  const slugDescription = { body: { project: { name: 'tracker' }, user: { username: 'bar' }, object_attributes: { description: 'some-story-slug' } } };

  t.is(http(nullDescription, t.context.res), 3);
  t.is(http(blankDescription, t.context.res), 3);
  t.is(http(wordsDescription, t.context.res), 3);
  t.is(http(slugDescription, t.context.res), 3);
});

test('http: returns 3 with project, user, and object_attributes without story slug data in source branch', t => {
  const nullBranch = { body: { project: { name: 'tracker' }, user: { username: 'bar' }, object_attributes: { source_branch: null } } };
  const blankBranch = { body: { project: { name: 'tracker' }, user: { username: 'bar' }, object_attributes: { source_branch: '' } } };
  const wordsBranch = { body: { project: { name: 'tracker' }, user: { username: 'bar' }, object_attributes: { source_branch: ' ' } } };

  t.is(http(nullBranch, t.context.res), 3);
  t.is(http(blankBranch, t.context.res), 3);
  t.is(http(wordsBranch, t.context.res), 3);
});

test('http: returns 0 with project, user, and object_attributes are present', t => {
  const storySlugFromBranch = { body: { project: { name: 'tracker' }, user: { username: 'bar' }, object_attributes: { source_branch: 'resource-slug' } } };
  const storySlugFromDescription = { body: { project: { name: 'tracker' }, user: { username: 'bar' }, object_attributes: { description: 'stories/resource-slug' } } };

  t.is(http(storySlugFromBranch, t.context.res), 0);
  t.is(http(storySlugFromDescription, t.context.res), 0);
});

test('http: calls external graphql API endpoint', t => {
  let request = sinon.stub(graphqlService, 'request').returns({ catch: () => {} });

  const body = {
    body: {
      project: { name: 'tracker' },
      user: { username: 'bar' },
      object_attributes: {
        source_branch: 'resource-slug',
        url: 'https://repo.url',
        iid: '123',
        title: 'Lorem ipsum',
        action: 'created'
      }
    }
  };

  t.is(http(body, t.context.res), 0);
  t.true(request.calledOnce);
  t.deepEqual(request.getCall(0).args, [
    'https://example.com/tracker/graphql?api_token=secret_token',
    '\n  mutation($input: AnnotationTypeCreateInput!) {\n    createAnnotation(input: $input) {\n      resource {\n        slug\n      }\n    }\n  }\n',
    {
     input: {
         body: '[Merge request !123 - "Lorem ipsum" (created)](https://repo.url)',
         storySlug: 'resource-slug'
       }
    }
  ]);

  graphqlService.request.restore();
});
