import { render } from '@testing-library/react';
import React, { Component } from "react";
import Enzyme, { mount, ReactWrapper, shallow, ShallowWrapper } from "enzyme";
import Adapter from "@wojtekmaj/enzyme-adapter-react-17";
import { Provider } from "react-redux";
import configureStore from 'redux-mock-store';
import { MOCK_STORE } from "../jest.mock";
import NavBar from '.';
import { BrowserRouter } from 'react-router-dom';
import ReactRouter from 'react-router';

Enzyme.configure({adapter: new Adapter()});

describe('Nav Bar', () => {
  let wrapper: ReactWrapper;

  const mockStore = configureStore();

  beforeEach(() => {
    wrapper = mount(shallow<Component>(
      <Provider store={mockStore(MOCK_STORE)}>
        <BrowserRouter>
          <NavBar/>
        </BrowserRouter>
      </Provider>
    ).get(0));
  })
  it("should have a log in button when there's no user id", () => {
    const links = wrapper.findWhere(node =>
      node.text() === 'login'
    )
    expect(links.first()).toHaveLength(1)
  })
  // it ("should have a logout button if there is a user id", () => {
  //   jest.spyOn(ReactRouter, 'useParams').mockReturnValue({ userId: '1', displayName: 'test-user' });
  //   wrapper = mount(shallow<Component>(
  //     <Provider store={mockStore(MOCK_STORE)}>
  //       <BrowserRouter>
  //         <NavBar/>
  //       </BrowserRouter>
  //     </Provider>
  //   ).get(0));
  //   console.log(wrapper.debug())
  // })
})