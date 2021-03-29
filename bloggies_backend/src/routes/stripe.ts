import Checkout from '../models/stripe';
import express, { Request, Response, NextFunction } from "express";
import Stripe from 'stripe';
import User from '../models/user';
import { ensureLoggedIn } from "../middleware/auth";
import { STRIPE_API_KEY } from '../config';
import ExpressError from '../expressError';
import Email from '../models/email';
import { ableToStartSub, lastSubmissionCheck } from '../utils';
import { ACTIVE } from '../membershipStatuses';
export const stripeRouter = express.Router();

/* create new Stripe instance to facilitate interactions with Stripe API*/
export const stripe = new Stripe(STRIPE_API_KEY as string, {
  apiVersion: "2020-08-27",
});

/** GET handles events that occur over a stripe session via webhook */
stripeRouter.post("/webhook", async function (req: Request, res: Response, next: NextFunction) {
  let event = req.body;
  let data: any;

  switch (event.type) {
    case 'invoice.upcoming':
      data = event.data.object;
      const user = await User.getUserBySubscriptionId(data.id);

      const isOverdue = lastSubmissionCheck(user);

      if(isOverdue) {
        try{
          await Checkout.stripeSubscriptionCancel(user.user_id);
          await User.cancelSubscription(user.user_id, new Date());
        } catch(err) {
          return next(err);
        }
      } else {
        const userWarningInfo = {email: user.email, membership_end_date: user.membership_end_date}
        await Email.sendEndDateWarning(userWarningInfo);
        console.log(`invoice upcoming, subscription almost ending for cust ${data.customer}`);
      }
    case 'invoice.paid':
      data = event.data.object;
      console.log(`invoice PAID for: ${data.customer}`);
      let formattedStartDate = new Date(data.period_start *1000);
      let formattedEndDate = new Date(data.period_end*1000);
      try{
        await User.startSubscription(data.id, formattedStartDate, formattedEndDate);
        const userInfo = await User.getUserBySubscriptionId(data.id);
        await Email.sendConfirmation(userInfo.email, ACTIVE);
        console.log('done with user update')
      } catch(err) {
        return next(err)
      }
      break;
    case 'invoice.payment_failed':
      data = event.data.object;
      console.log(`invoice failed for: ${data.customer}`);
      let formattedDate = new Date(data.current_period_end*1000);
      await User.cancelSubscription(data.subscription, formattedDate);
      break;
    case 'customer.subscription.deleted':
      console.log("subscription deleted");
      data = event.data.object;
      let formattedDate2 = new Date(data.ended_at);
      await User.cancelSubscription(data.id, formattedDate2);
      const userInfo = await User.getUserBySubscriptionId(data.id);
      await Email.sendExpiredNotification(userInfo.email);
      break;
    case 'payment_intent.succeeded':
      console.log(`PaymentIntent success for ${event.data.object.amount}`);
      break;
    default:
      console.log("web hook default, unhandled event", event.type);
      break;
  }
});

/** POST /create-checkout-session - creates a new checkout session.
 * Returns session id, currently not checking if user logged in */
stripeRouter.post("/create-checkout-session", async function (req: Request, res: Response, next: NextFunction) {
  try {
    const { priceId } = req.body;
    const session = await Checkout.stripeCheckout(priceId);
    res.status(201).send({ sessionId: session.id })
  } catch (err) {
    return next(err);
  }
});


/** POST create a customer for a user */
stripeRouter.post("/create-customer", ensureLoggedIn, async function (req: Request, res: Response, next: NextFunction) {
  const { user_id, email } = req.user;
  const user = await User.getUser(user_id);

  if (!user.customer_id) {
    const customer = await Checkout.stripeCreateCustomer(user_id, email);

    await User.updateUser(user_id, { customer_id: customer.id });
    return res.status(201).json({ customer });
  }

  return next(new ExpressError("Customer id already exists for this user.", 400));
});

/** POST create a subscription for a customer and save payment method  */
stripeRouter.post("/create-subscription", ensureLoggedIn, async function (req: Request, res: Response, next: NextFunction) {
  const { paymentMethodId, customerId } = req.body;
  const { user_id } = req.user;

  const userStatusRes = await User.checkMembershipStatus(user_id);
  if (ableToStartSub(userStatusRes.membership_status)) {
    if(paymentMethodId){
    try {
      // save payment method info for a customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId
      });
    } catch (err) {
      return next(new ExpressError(err.message, err.statusCode));
    }

    try {
      // update the customer with the payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });
    } catch (err) {
      return next(new ExpressError(err.message, err.statusCode));
    }
  }

    try {
      const subscription = await Checkout.stripeCreateSubscription(customerId);
      await User.updateUser(user_id, { subscription_id: subscription.id });
      return res.status(201).json({ subscription });
    } catch (err) {
      return next(err);
    }
  }
  if (userStatusRes.membership_status === ACTIVE) {
    return next(new ExpressError("Cannot have multiple subscriptions active at once.", 400));
  } else {
    return next(new ExpressError("Not eligible for premium subscription.", 400));
  }
});

/** DELETE cancels user's Stripe subscription */
stripeRouter.delete("/cancel-subscription", async function (req: Request, res: Response, next: NextFunction) {
  try {
    const cancelledSubscription = await Checkout.stripeSubscriptionCancel(req.body.subscription_id);
    res.send({ cancelled_subscription: cancelledSubscription });
  } catch (err) {
    return next(err);
  }
});

/** POST update the customer with new payment method and assign it as the new default payment for subscription invoices */
stripeRouter.post("/retry-invoice", async function (req: Request, res: Response, next: NextFunction) {
  try {
    const { customer_id, paymentMethodId, invoiceId } = req.body;

    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer_id
    });
    // update the customer with the payment method
    await stripe.customers.update(customer_id, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    });

    const invoice = await stripe.invoices.retrieve(invoiceId, {
      expand: ['payment_intent']
    });

    res.json(invoice);
  } catch (err) {
    // card_decline error
    return next(new ExpressError(err, 402));
  }
});