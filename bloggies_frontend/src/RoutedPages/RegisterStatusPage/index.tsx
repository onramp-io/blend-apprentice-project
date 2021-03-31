import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { CustomReduxState } from "../../custom";
import styled from "styled-components";
import { useHistory } from "react-router";
import { ACTIVE, BASE_URL } from "../../config";
import { deleteServerErr, gotMembershipStatus, gotServerErr } from "../../redux/actionCreators";

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
`

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
`
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
`

/**
 * RegisterStatusPage renders a successful registration page and shows
 * the membership status of the newly registered user.
 * renders a different message depending on the outcome of the application form
 */

function RegisterStatusPage() {
  const history = useHistory();
  const dispatch = useDispatch();
  // pulls membership status from redux store
  const checkStatus = useSelector(
    (st: CustomReduxState) => st.user.membership_status
  );

  const handleActivateSubClick = async () => {
    try {
      const res = await fetch(`${BASE_URL}/users/activate-subscription`, {
        credentials: "include"
      });
      const resData = await res.json();
      if (res.status === 204) {
        dispatch(deleteServerErr());
        dispatch(gotMembershipStatus(ACTIVE));
        alert(resData.message);
      } else if (res.status === 500) {
        dispatch(gotServerErr("Subscription does not exist, please proceed to payment or contact support@bloggies.com."));
      } else {
        dispatch(gotServerErr(resData.error.message));
      }
    } catch (err) {
      alert(err);
    }
  }

  let text: string | null = null;
  // home buttone redirects user to newfeed page
  let homeButton = (
    <NewsFeedButton onClick={() => history.push("/")}>
      {"Take me back to the newsfeed!"}
    </NewsFeedButton>
  );
  // payment button directs user to stripe success form
  let paymentButton = (
    <PaymentButton
      onClick={() => { 
        dispatch(deleteServerErr());
        history.push("/payment/form")
      }}
    >{`I'm Ready, Sign Me Up!`}</PaymentButton>
  );
  // manual subscription activation button
  let manualSubActivateInfo = (
    <div className="RegisterStatusPage-already-paid-container">
      <SubParagraph>Already paid?</SubParagraph>
      <ActivateSubButton onClick={handleActivateSubClick}>{"Check membership status"}</ActivateSubButton>
    </div>
  )

  // if block below determines what to render as the message as a result of the user status
  if (checkStatus === "none") {
    text = "";
  } else if (checkStatus === "rejected") {
    text =
      "We are sorry, we will not be able to grant you membership at this time. Please apply again at a later date, we would love for you to be a part of the the Learning Circle community!";
  } else if (checkStatus === "pending") {
    text =
      "We would love to have you as a member of the Learning Circle, but we are going to need a bit more information first! You have been sent a follow up email with an additional questionnaire, please fill out at your earliest convenience!";
  } else if (checkStatus === "accepted") {
    text =
      "Congratulations! You have been approved to become a premium member of the Learning Circle! Click below to register for your subscription, we are excited to welcome you into the community!";
  } else if (checkStatus === "inactive") {
    text =
      "We are sorry to see you go! Since you have filled out this application prior, no need to refill it out should you again choose to be a premium user! We would love to have you back as a part of the Learning Circle, click below to re-activate your membership!";
  }

  return (
    <RegisterStatusContainer className="RegisterStatusPage">
      <RegisterStatusItem>
        <Paragraph>{text}</Paragraph>
      </RegisterStatusItem>
      <RegisterStatusItem>
        {/* check to see status of member to see what button to render */}
        {checkStatus === 'rejected' || checkStatus === 'pending' || checkStatus === 'none' ? homeButton : paymentButton}
        {checkStatus === 'accepted' && manualSubActivateInfo}
      </RegisterStatusItem>
    </RegisterStatusContainer>
  );
}

export default RegisterStatusPage;
