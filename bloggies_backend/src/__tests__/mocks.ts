export const TEST_EMAIL = "test@test.com";
export const MOCK_USER_ID = 1;
export const VALID_CARD = {
  number: '4242424242424242',
  exp_month: 3,
  exp_year: 2022,
  cvc: '314',
}
export const INVALID_CARD = {
  number: '4000000000000002',
  exp_month: 3,
  exp_year: 2025,
  cvc: '314'
}
export const VALID_FAIL_CHARGE_CARD = {
  number: '4000000000000341',
  exp_month: 3,
  exp_year: 2025,
  cvc: '314'
}
export const INVALID_CUSTOMER_ID = "cus_notarealcustomerid";
export const INVALID_SUB_ID = "sub_notarealsubid";