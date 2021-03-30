import Stripe from "stripe";
import Checkout from "../models/stripe";
import { stripe } from "../routes/stripe";
import { makeNewAttachedPaymentMethodAndCustomer, makeNewSubscriptionForCustomer } from "./helpers/makeFunctions";
import * as m from "./helpers/mocks";

let testCustomer: Stripe.Customer;
let testSubscription: Stripe.Subscription;

describe("Test Stripe class methods", function () {
  beforeAll(async function () {
    testCustomer = await makeNewAttachedPaymentMethodAndCustomer(m.VALID_CARD, m.TEST_EMAIL);
    testSubscription = await makeNewSubscriptionForCustomer(testCustomer.id);
  });

  test("Create a Stripe customer successfully", async function () {
    const newCustomer = await Checkout.stripeCreateCustomer(m.MOCK_USER_ID, m.TEST_EMAIL);
    
    expect(newCustomer.email).toBe(m.TEST_EMAIL);
    expect(newCustomer.description).toBe(m.MOCK_USER_ID.toString());

    await stripe.customers.del(newCustomer.id);
  });

  test("Create a Stripe subscription successfully for a customer, returns subscription", async function () {
    const subscription = await Checkout.stripeCreateSubscription(testCustomer.id);

    expect(subscription.customer).toBe(testCustomer.id);
  });

  test("Cancel a Stripe subscription successfully for a user, returns subscription", async function () {
    expect(testSubscription.cancel_at).toBeFalsy();

    const cancelledSub = await Checkout.stripeSubscriptionCancel(testSubscription.id);

    expect(cancelledSub.id).toBe(testSubscription.id);
    expect(cancelledSub.canceled_at).toBeTruthy();
  });

  test("Handles invalid subscription id to cancel a subscription", async function () {
    try { 
     await Checkout.stripeSubscriptionCancel(m.INVALID_SUB_ID);
    } catch (err) {
     expect(err.message).toBe(`No such subscription: ${m.INVALID_SUB_ID}`);
     expect(err.status).toBe(400);
    }
  });

  test("Handles invalid customer id to cancel a customer", async function () {
    try { 
     await Checkout.stripeCreateSubscription(m.INVALID_CUSTOMER_ID);
    } catch (err) {
     expect(err.message).toBe(`Customer ${m.INVALID_CUSTOMER_ID} does not exist`);
     expect(err.status).toBe(400);
    }
  });

  test("Handles invalid customer id when creating a subscription", async function () {
    try { 
     await Checkout.stripeCreateSubscription(m.INVALID_CUSTOMER_ID);
    } catch (err) {
     expect(err.message).toBe(`Customer ${m.INVALID_CUSTOMER_ID} does not exist`);
     expect(err.status).toBe(400);
    }
  });

  afterAll(async function () {
    await stripe.customers.del(testCustomer.id);
  })
});