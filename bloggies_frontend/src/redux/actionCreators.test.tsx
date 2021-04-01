import configureStore from "redux-mock-store";
import thunk from "redux-thunk";
import * as actions from "./actionCreators";
import * as t from "./actionTypes";
import fetchMock from "fetch-mock-jest";
import { BASE_URL } from "../config";
import { MOCK_POST, MOCK_POSTS, MOCK_USER } from "../jest.mock";

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

describe("async actions", () => {
  afterEach(() => {
    fetchMock.restore();
  });

  it("creates LOAD_USER when fetching user information has been done", async () => {
    fetchMock.get(`${BASE_URL}/users`, {
      body: { user: [MOCK_USER] },
      headers: { "Content-type": "application/json" },
    });

    const expectedActions = [
      { type: t.LOAD_USER, payload: { user: [MOCK_USER] } },
    ];
    const store = mockStore({ user: [] });

    await store.dispatch(actions.getUserInfoFromAPI());
    // return of async actions
    expect(store.getActions()).toEqual(expectedActions);
  });

  it("creates REMOVE_SERVER_ERR when post has been successfully created", async () => {
    fetchMock.post(`${BASE_URL}/posts`, {
      body: { post: [MOCK_POST] },
      headers: { "Content-type": "application/json" },
      status: 201,
    });
    const expectedActions = [{ type: t.REMOVE_SERVER_ERR }];
    const store = mockStore({ posts: [] });
    await store.dispatch(actions.addPostToAPI(MOCK_POST));
    expect(store.getActions()).toEqual(expectedActions);
  });

  it("creates REMOVE_SERVER_ERR and DELETE_POST when post has been successfully deleted", async () => {
    const postId = 1;
    fetchMock.delete(`${BASE_URL}/posts/${postId}`, {
      body: { post: [MOCK_POST] },
      headers: { "Content-type": "application/json" },
    });
    const expectedActions = [
      { type: t.REMOVE_SERVER_ERR },
      { type: t.DELETE_POST, payload: { postId } },
    ];
    const store = mockStore({ posts: [] });
    await store.dispatch(actions.deletePostFromAPI(postId));
    expect(store.getActions()).toEqual(expectedActions);
  });

  it("creates REMOVE_SERVER_ERR and GOT_POSTS when posts have been successfully retrieved", async () => {
    fetchMock.get(`${BASE_URL}/posts`, {
      body: { posts: [MOCK_POSTS] },
      headers: { "Content-type": "application/json" },
    });
    const expectedActions = [
      { type: t.REMOVE_SERVER_ERR },
      { type: t.LOAD_POSTS, payload: { posts: [MOCK_POSTS] } },
    ];
    const store = mockStore({ posts: [] });
    await store.dispatch(actions.getPostsFromAPI());
    expect(store.getActions()).toEqual(expectedActions);
  });

  it("creates REMOVE_SERVER_ERR and LOAD_SEARCH_RESULTS when search has been successfuly executed", async () => {
    const term = 'test';
    fetchMock.get(`${BASE_URL}/posts/search?term=${term}`, {
      body: { posts: [MOCK_POSTS] },
      headers: { "Content-type": "application/json" },
    });
    fetchMock.get(`${BASE_URL}/users/search?term=${term}`, {
      body: {users:[MOCK_USER]},
      headers: {"Content-type": "application/json"}
    })
    const expectedActions = [
      { type: t.REMOVE_SERVER_ERR },
      { type: t.LOAD_SEARCH_RESULTS, payload: { posts: [MOCK_POSTS], users:[MOCK_USER] } },
    ];
    const store = mockStore({ posts: [] });
    await store.dispatch(actions.getSearchResultsFromAPI(term));
    expect(store.getActions()).toEqual(expectedActions);
  });

  it("creates REMOVE_SERVER_ERR and ADD_FAVORITES when a users favorites have been retrieved", async () => {
    fetchMock.post(`${BASE_URL}/bookmarks`, {
      body: { postId: [MOCK_POST.id] },
      headers: { "Content-type": "application/json" },
      status: 201
    });
    const expectedActions = [
      { type: t.REMOVE_SERVER_ERR },
      { type: t.ADD_FAVORITE, payload: { post: MOCK_POST } },
    ];
    const store = mockStore({ posts: [] });
    await store.dispatch(actions.addFavoriteToAPI(MOCK_POST));
    expect(store.getActions()).toEqual(expectedActions);
  });

  it("creates REMOVE_SERVER_ERR and DELETE_FAVORITE when a users has deleted a post from their favorites", async () => {
    const postId = MOCK_POST.id;
    fetchMock.delete(`${BASE_URL}/bookmarks`, {
      body: { postId: MOCK_POST.id },
      headers: { "Content-type": "application/json" }
    });
    const expectedActions = [
      { type: t.REMOVE_SERVER_ERR },
      { type: t.DELETE_FAVORITE, payload: { postId: MOCK_POST.id } }
    ];
    const store = mockStore({ posts: [] });
    await store.dispatch(actions.deleteFavoriteFromAPI(postId));
    expect(store.getActions()).toEqual(expectedActions);
  });

  it("creates LOAD_FAVORITES when a users requests to see their favorites", async () => {
    const userId = MOCK_USER.id;
    fetchMock.get(`${BASE_URL}/bookmarks/${userId}`, {
      body: { favorites: [] },
      headers: { "Content-type": "application/json" }
    });
    const expectedActions = [
      { type: t.LOAD_FAVORITES, payload: { favorites: undefined } }
    ];
    const store = mockStore({ posts: [] });
    await store.dispatch(actions.getUserFavoritesFromAPI(userId));
    console.log(store.getActions());
    expect(store.getActions()).toEqual(expectedActions);
  });

});
