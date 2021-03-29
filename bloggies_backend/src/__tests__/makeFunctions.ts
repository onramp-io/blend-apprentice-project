/** make functions */

import Stripe from "stripe";
import { PRICE_ID } from "../config";
import User from "../models/user";
import UserAuth from "../models/userAuth";
import { stripe } from "../routes/stripe";

export async function makeNewAttachedPaymentMethodAndCustomer(card: any, email: string): Promise<Stripe.Customer> {
  const failedPaymentMet = await stripe.paymentMethods.create({ type: "card", card: card });
  const cus = await stripe.customers.create({
    email: email
  });
  await stripe.paymentMethods.attach(failedPaymentMet.id, {
    customer: cus.id
  });
  await stripe.customers.update(cus.id, {
    invoice_settings: {
      default_payment_method: failedPaymentMet.id
    }
  });

  return cus;
}

export async function makeNewSubscriptionForCustomer(customerId: string): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{
      plan: PRICE_ID
    }]
  });
}

export async function makeNewUser(email: string, password: string, displayName: string) {
  const userData = await UserAuth.register(email, password);
  await User.createUser(userData.user.id, displayName);
  return userData;
}