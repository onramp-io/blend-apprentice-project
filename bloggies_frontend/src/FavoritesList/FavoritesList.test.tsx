import React, { Component } from "react";
import Enzyme, { mount, ReactWrapper, shallow } from "enzyme";
import Adapter from "@wojtekmaj/enzyme-adapter-react-17";
import BlogCard from "./index";
import ReactRouter from "react-router";
import { MOCK_POST, MOCK_POSTS, MOCK_STORE } from "../jest.mock";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import FavoritesList from "./index";

Enzyme.configure({ adapter: new Adapter() });

const mockStore = configureStore();

describe("Favorites List", () => {
  let wrapper: ReactWrapper;

  beforeEach(() => {
    jest
      .spyOn(ReactRouter, "useParams")
      .mockReturnValue({ userId: "1", displayName: "test-user" });
    wrapper = mount(
      shallow<Component>(
        <Provider store={mockStore(MOCK_STORE)}>
          <BrowserRouter>
            <FavoritesList favorites={MOCK_POSTS} />
          </BrowserRouter>
        </Provider>
      ).get(0)
    );
  });

  it("should match snapshot", () => {
    expect(wrapper).toMatchSnapshot();
  });

  it("should render the message 'Empty... for now!' if favorites is empty" , () => {
    wrapper = mount(
      shallow<Component>(
        <Provider store={mockStore(MOCK_STORE)}>
          <BrowserRouter>
            <FavoritesList favorites={[]} />
          </BrowserRouter>
        </Provider>
      ).get(0)
    )
    const nodesFound = wrapper.findWhere(node => {
      return node.text() === 'Empty... for now!';
    });

    expect(nodesFound).toHaveLength(4);
  })
});
