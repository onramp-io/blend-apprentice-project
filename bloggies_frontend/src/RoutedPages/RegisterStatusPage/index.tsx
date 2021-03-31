import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CustomReduxState } from "../../custom";
import styled from "styled-components";
import { useHistory } from "react-router";
import { ACTIVE, BASE_URL } from "../../config";
import { deleteServerErr, gotMembershipStatus, gotServerErr } from "../../redux/actionCreators";
import { createCustomer } from "../../redux/stripeAction";


// styled components, later could possibly extact to once cetralized style sheet
const RegisterStatusContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
`;
const RegisterStatusItem = styled.div`
  text-align: center;
  margin: 0 auto;
  width: 60%;
  min-height: 300px;
`;
const Paragraph = styled.p`
  font-size: 30px;
  margin-top: 50px;
`;
const SubParagraph = styled.p`
  font-size: 18px;
  margin-top: 50px;
  color: gray;
`;
const Button = styled.button`
  color: white;
  border: none;
  padding: 10px;
  border-radius: 5px;
`;
const ActivateSubButton = styled(Button)`
  background-color: #73B5FF;
  &:hover{
    background-color: #3F7CC3;
    border-color: #3F7CC3;
  }
  &:active {
      background-color: #3F7CC3;
      border-color: #3F7CC3;
  }
  &:focus {
    box-shadow: 0 0 0 0.2rem #73B5FF;
    outline: none;
  }
`;
const NewsFeedButton = styled(Button)`
  background-color: #ffc107;
  &:hover{
      background-color: #e0a800;
      border-color: #d39e00;
  }
  &:active {
      background-color: #d39e00;
      border-color: #c69500;
  }
  &:focus {
    box-shadow: 0 0 0 0.2rem rgb(255 193 7 / 50%);
    outline: none;
  }
`;
const PaymentButton = styled(Button)`
  background-color: #28a745;
  border-color: #28a745;
  &:hover{
      background-color: #218838;
      border-color: #1e7e34;
  }
  &:active {
      background-color: #1e7e34;
      border-color: #1c7430;
  }
  &:focus {
    box-shadow: 0 0 0 0.2rem rgb(40 167 69 / 50%);
    outline: none;
  }
`;

/**
 * RegisterStatusPage renders a successful registration page and shows
 * the membership status of the newly registered user.
 * renders a different message depending on the outcome of the application form
 */

function RegisterStatusPage() {
  const history = useHistory();
  const dispatch = useDispatch()
  const [text, setText] = useState('')

  // pulls membership status from redux store
  const checkStatus = useSelector(
    (st: CustomReduxState) => st.user.membership_status
  );
  const userCustomerId = useSelector(
    (st: CustomReduxState) => st.user.customer_id
  );

  const handleActivateSubClick = async () => {
    try {
      dispatch(deleteServerErr());
      const res = await fetch(`${BASE_URL}/users/activate-subscription`, {
        credentials: "include"
      });
      const resData = await res.json();
      console.log("before res.status", res.status);

      if (res.status === 200) {
        console.log("res.status", res.status);
        dispatch(gotMembershipStatus(ACTIVE));
      } else if (res.status === 500) {
        dispatch(gotServerErr("Subscription does not exist, please proceed to payment or contact support@bloggies.com."));
      } else {
        dispatch(gotServerErr(resData.message));
      }
    } catch (err) {
      console.log(`An error occurred when manually activating subscription: ${err}`);
    }
  }

  const handlePaymentButtonClick = () => {
    dispatch(deleteServerErr());
    if (!userCustomerId) {
      dispatch(createCustomer());
    };
    history.push("/payment/form");
  }

  // home buttone redirects user to newfeed page
  let homeButton = (
    <NewsFeedButton onClick={() => history.push("/")}>
      {"Take me back to the newsfeed!"}
    </NewsFeedButton>
  );
  // payment button directs user to stripe success form
  let paymentButton = (
    <PaymentButton
      onClick={handlePaymentButtonClick}
    >{`I'm Ready, Sign Me Up!`}</PaymentButton>
  );
  // manual subscription activation button
  let manualSubActivateInfo = (
    <div className="RegisterStatusPage-already-paid-container">
      <SubParagraph>Already paid?</SubParagraph>
      <ActivateSubButton onClick={handleActivateSubClick}>{"Check membership status"}</ActivateSubButton>
    </div>
  );

  useEffect(() => {
    switch (checkStatus) {
      case 'rejected':
        setText("We are sorry, we will not be able to grant you membership at this time. Please apply again at a later date, we would love for you to be a part of the the Learning Circle community!");
        break;
      case 'pending':
        setText("We would love to have you as a member of the Learning Circle, but we are going to need a bit more information first! You have been sent a follow up email with an additional questionnaire, please fill out at your earliest convenience!");
        break;
      case 'accepted':
        setText("Congratulations! You have been approved to become a premium member of the Learning Circle! Click below to register for your subscription, we are excited to welcome you into the community!");
        break;
      case 'inactive':
        setText("We are sorry to see you go! Since you have filled out this application prior, no need to refill it out should you again choose to be a premium user! We would love to have you back as a part of the Learning Circle, click below to re-activate your membership!");
        break;
      case 'active':
        setText("Welcome to the Learning Circle! Your membership is now active. 🎉");
        break;
      default:
        break;
    }
  }, [checkStatus]);

  return (
    <RegisterStatusContainer className="RegisterStatusPage">
      <RegisterStatusItem>
        <Paragraph>{text}</Paragraph>
      </RegisterStatusItem>
      <RegisterStatusItem>
        {/* check to see status of member to see what button to render */}
        {checkStatus === 'rejected' || checkStatus === 'pending' || checkStatus === 'none' || checkStatus === 'active' ? homeButton : paymentButton}
        {(checkStatus === 'accepted' || checkStatus === 'inactive') && manualSubActivateInfo}
      </RegisterStatusItem>
    </RegisterStatusContainer>
  );
}

export default RegisterStatusPage;