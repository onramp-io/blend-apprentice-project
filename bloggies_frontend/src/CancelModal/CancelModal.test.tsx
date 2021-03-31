import React, { Component } from "react";
import Enzyme, { mount, ReactWrapper, shallow, ShallowWrapper } from "enzyme";
import Adapter from "@wojtekmaj/enzyme-adapter-react-17";
import CancelModal from "./index";
import { Provider } from "react-redux";
import configureStore from 'redux-mock-store';
import { MOCK_STORE } from "../jest.mock";

Enzyme.configure({ adapter: new Adapter() });

describe("Cancel Modal", () => {
  let wrapper: ReactWrapper;

  const mockStore = configureStore();

  beforeEach(() => {
    wrapper = mount(shallow<Component>(
      <Provider store={mockStore(MOCK_STORE)}>
        <CancelModal/>
      </Provider>
    ).get(0));
  });

  it("should display button which allows for cancellation", () => {
    const node = wrapper.find('Button');
    expect(node.text()).toBe('Yes, I want to Cancel!');
  });

  it("should display modal when 'Yes, I want to cancel button' clicked", () => {
    const button = wrapper.find('button');
    button.simulate('click');
    const modal = wrapper.find('Modal').first().props();
    expect(modal.show).toBe(true);
  })

  it("should close modal when 'No' button clicked on popup modal", () => {
    const button = wrapper.find('button');
    button.simulate('click');
    const noButton = wrapper.find('.btn-primary');
    noButton.simulate('click');
    const modal = wrapper.find('Modal').first().props();
    expect(modal.show).toBe(false);
  })
});
