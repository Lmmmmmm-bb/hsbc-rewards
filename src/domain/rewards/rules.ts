export const LATEST_RULES = Object.freeze({
  id: 'hsbc-pulse-2026-10-27',
  verifiedAt: '2026-10-27',
  basicRateBasisPoints: 40,
  maximumAbroadMultiplier: 5,
  abroad: Object.freeze({ capMinor: 10_000_000, period: 'year' as const }),
  pulse: Object.freeze({ rateBasisPoints: 200, capMinor: 8_000_000, period: 'half-year' as const }),
  sources: Object.freeze([
    'https://www.hsbc.com.hk/credit-cards/rewards/terms/',
    'https://www.hsbc.com.hk/credit-cards/rewards/your-choice/',
    'https://www.hsbc.com.hk/content/dam/hsbc/hk/docs/credit-cards/rewards/2026-red-hot-rewards-of-your-choice-terms-and-conditions.pdf',
    'https://www.hsbc.com.hk/content/dam/hsbc/hk/docs/credit-cards/unionpay-dual-currency/diamond-card-terms-and-conditions.pdf',
  ]),
})

export type RewardRules = typeof LATEST_RULES
