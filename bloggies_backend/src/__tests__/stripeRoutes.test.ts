import Stripe from "stripe";
import request from "supertest";
import app from "../app";
import db from "../db";
import { ACCEPTED, ACTIVE } from "../membershipStatuses";
import { stripe } from "../routes/stripe";
import { makeNewAttachedPaymentMethodAndCustomer, makeNewSubscriptionForCustomer, makeNewUser } from "./helpers/makeFunctions";
import * as m from "./helpers/mocks";

let testPaymentMethod: Stripe.PaymentMethod;
let testSecondPaymentMethod: Stripe.PaymentMethod;
let testInvalidCardPaymentMethod: Stripe.PaymentMethod;
let testUserId: number;
let testToken: string;
let testCustomerNoPaymentMethod: Stripe.Customer;
let testCustomerWithSub: Stripe.Customer;
let testSubscription: Stripe.Subscription;

jest.setTimeout(10000);

describe("Test Stripe routes", function () {
  beforeAll(async function () {
    testPaymentMethod = await stripe.paymentMethods.create({ type: "card", card: m.VALID_CARD });
    testSecondPaymentMethod = await stripe.paymentMethods.create({ type: "card", card: m.VALID_CARD });
    testInvalidCardPaymentMethod = await stripe.paymentMethods.create({ type: "card", card: m.INVALID_CARD });

    testCustomerWithSub = await makeNewAttachedPaymentMethodAndCustomer(m.VALID_CARD, m.TEST_EMAIL);
    testSubscription = await makeNewSubscriptionForCustomer(testCustomerWithSub.id);
  });

  beforeEach(async function () {

    await reset();
    
    const userData = await makeNewUser(m.TEST_EMAIL, 'password', 'testStripe');
    testToken = userData.token;
    testUserId = userData.user.id;
    await db.query(`UPDATE users SET membership_status = $1 WHERE user_id = $2`, [ACCEPTED, testUserId]);

    testCustomerNoPaymentMethod = await stripe.customers.create({
      email: m.TEST_EMAIL
    });
  });

  test("POST /checkout/create-customer - Create a Customer for a user, return customer", async function () {
    const resp = await request(app)
      .post("/checkout/create-customer")
      .set("Cookie", [`token=${testToken}`]);

    const userResult = await db.query(`SELECT customer_id FROM users WHERE user_id = $1`, [testUserId]);
    const customerId = userResult.rows[0].customer_id;

    expect(resp.status).toBe(201);
    expect(resp.body.customer.id).toBe(customerId);
  });

  test("Invalid POST /checkout/create-customer - Prevent creating a Customer for a user with a customer_id, return customer", async function () {
    await db.query(`
    UPDATE users 
      SET customer_id = $1
      WHERE user_id = $2`,
      [m.INVALID_CUSTOMER_ID, testUserId]);

    const resp = await request(app)
      .post("/checkout/create-customer")
      .set("Cookie", [`token=${testToken}`]);

    expect(resp.status).toBe(400);
    expect(resp.body.error.message).toBe("Customer id already exists for this user.");
  });

  test("POST /checkout/create-subscription - Create a new subscription for an eligible user, return subscription", async function () {
    const resp = await request(app)
      .post("/checkout/create-subscription")
      .set("Cookie", [`token=${testToken}`])
      .send({
        paymentMethodId: testSecondPaymentMethod.id,
        customerId: testCustomerNoPaymentMethod.id
      });

    const userResult = await db.query(`SELECT subscription_id FROM users WHERE user_id = $1`, [testUserId]);
    const subscriptionId = userResult.rows[0].subscription_id;

    expect(resp.status).toBe(201);
    expect(resp.body.subscription.id).toBe(subscriptionId);
  });

  test("Invalid POST /checkout/create-subscription - Handles improper arguments", async function () {
    const resp = await request(app)
      .post("/checkout/create-subscription")
      .set("Cookie", [`token=${testToken}`])
      .send({
        paymentMethodId: 298943,
        customerId: ["invalid", "arguments"]
      });

    expect(resp.status).toBe(500);
  });

  test("Invalid POST /checkout/create-subscription - Prevents creating multiple subscriptions", async function () {
    await db.query(`UPDATE users SET membership_status = $1 WHERE user_id = $2`, [ACTIVE, testUserId]);

    const resp = await request(app)
      .post("/checkout/create-subscription")
      .set("Cookie", [`token=${testToken}`])
      .send({
        paymentMethodId: testPaymentMethod.id,
        customerId: testCustomerWithSub.id
      });

    expect(resp.status).toBe(400);
    expect(resp.body.error.message).toBe("Cannot have multiple subscriptions active at once.");
  });

  test("DELETE /checkout/cancel-subscription - Cancels an active subscription succesfully, returns deleted subscription", async function () {
    const resp = await request(app)
      .delete("/checkout/cancel-subscription")
      .set("Cookie", [`token=${testToken}`])
      .send({
        subscription_id: testSubscription.id
      });

    expect(resp.status).toBe(200);
    expect(resp.body.cancelled_subscription.id).toBe(testSubscription.id);
  });

  test("Invalid DELETE /checkout/cancel-subscription - handles an invalid subscription id", async function () {
    const resp = await request(app)
      .delete("/checkout/cancel-subscription")
      .set("Cookie", [`token=${testToken}`])
      .send({
        subscription_id: m.INVALID_SUB_ID
      });

    expect(resp.status).toBe(400);
    expect(resp.body.error.message).toBe(`No such subscription: ${m.INVALID_SUB_ID}`)
  });

  test("Invalid POST /checkout/create-subscription - handles declined card payment method", async function () {
    const resp = await request(app)
      .post("/checkout/create-subscription")
      .set("Cookie", [`token=${testToken}`])
      .send({
        paymentMethodId: testInvalidCardPaymentMethod.id,
        customerId: testCustomerNoPaymentMethod.id
      });;

    expect(resp.status).toBe(402);
    expect(resp.body.error.message).toBe("Your card was declined.");
  });

  test("POST /retry-invoice", async function () {
    // creating a failed subscription payment scenerio
    const cus = await makeNewAttachedPaymentMethodAndCustomer(m.VALID_FAIL_CHARGE_CARD, m.TEST_EMAIL);
    const sub = await makeNewSubscriptionForCustomer(cus.id);
  
    expect(sub.status).toBe("incomplete");

    // create a payment method with a valid card and call endpoint
    const newPaymentMet = await stripe.paymentMethods.create({ type: "card", card: m.VALID_CARD });

    const resp = await request(app)
      .post("/checkout/retry-invoice")
      .set("Cookie", [`token=${testToken}`])
      .send({
        customer_id: cus.id,
        paymentMethodId: newPaymentMet.id,
        invoiceId: sub.latest_invoice
      });

    expect(resp.status).toBe(200);
    expect(resp.body.status).toBe("open");
  });

  afterAll(async () => {
    await reset();
    await db.end();
  })
});

async function reset() { 
  await db.query("DELETE FROM user_auth");
  await db.query("DELETE FROM users");
};