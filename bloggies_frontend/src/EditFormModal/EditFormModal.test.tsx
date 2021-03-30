import React, { Component } from 'react';
import Enzyme, { mount, ReactWrapper, shallow } from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import EditModal from './index';
import { MOCK_POST } from '../jest.mock';
import { MOCK_POSTS, MOCK_STORE } from '../jest.mock';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';


Enzyme.configure({ adapter: new Adapter() });

const mockStore = configureStore();

const mEditItem = jest.fn(() => "Editted");

describe('EditModal', () => {
  let wrapper: ReactWrapper;

  beforeEach(() => {
    wrapper = mount(shallow<Component>(
      <Provider store={mockStore(MOCK_STORE)}>
        <EditModal show={true} handleClose={() => "Closed"} item={MOCK_POST} editItem={mEditItem} />
      </Provider>
    ).get(0));
  });

  it('should match snapshot', () => {
    expect(wrapper).toMatchSnapshot();
  });

  it('should display edit modal text', () => {
    const isEditModalText = wrapper.containsMatchingElement(
      <div className="modal-title h4">
        Make an edit
      </div>
    );
    expect(isEditModalText).toBeTruthy();
  });
});