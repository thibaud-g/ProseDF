import React from "react";
import { getUserSubscriptionPlan } from "@/lib/stripe";
import BillingForm from "@/components/billing-form";
const page = async () => {
  const subscriptionPlan = await getUserSubscriptionPlan();

  return <BillingForm subscriptionPlan={subscriptionPlan} />;
};

export default page;
