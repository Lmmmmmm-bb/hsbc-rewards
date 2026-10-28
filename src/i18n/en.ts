import type { MessageCatalog } from './message-types.ts'

// English cardinal agreement stays in the English catalog, not in components.
const plural = (count: string | number, one: string, other: string) =>
  Number(count) === 1 ? one : other

export const en = {
  'language.chinese': '简体中文',
  'language.english': 'English',
  'language.switchToChinese': 'Switch to simplified Chinese',
  'language.switchToEnglish': 'Switch to English',
  'dialogContent.loading': 'Loading content…',
  'dialogContent.failed': 'Dialog content could not be loaded',
  'dialogContent.retained': 'Your imported statements are still available. Try again, or close this dialog and reopen it later.',
  'dialogContent.retry': 'Reload content',
  'rules.tabRewards': 'Reward rules',
  'rules.tabCalculation': 'How estimates work',
  'rules.tabSources': 'Official sources',
  'rules.maxExtra': 'Up to {rate}% extra',
  'rules.eligibilityLabel': 'Eligible purchases',
  'rules.capLabel': 'Spending cap',
  'rules.excludedTitle': 'Exclusions and refunds',
  'rules.scopeTitle': 'Estimation rules and included spending',
  'rules.sharingBody':
    'Spending caps are shared only when the statements clearly confirm that the cards share them. Otherwise, caps are estimated separately for each card, with a notice.',
  'rules.enrollmentTitle': 'Enrollment and reward multipliers',
  'rules.fxTitle': 'Reference exchange rates and CNY values',
  'rules.sourcesHint':
    'These rules are based on HSBC’s official documents. Reward+ is an independent estimator; actual RewardCash is determined by the bank’s records.',
  'rules.versionLabel': 'Rule version',
  'rules.verifiedLabel': 'Verified on',
  'rules.sourceHint.0': 'Basic RewardCash and rules for carrying over leftover spending.',
  'rules.sourceHint.1': 'Red Hot Rewards of Your Choice and allocation to Overseas and Mainland China Spending.',
  'rules.sourceHint.2': 'Eligibility, multipliers, and the annual spending cap for spending outside Hong Kong.',
  'rules.sourceHint.3': 'Qualifying payment methods and the half-year spending cap for PULSE.',
  'precision.computeLabel': 'Calculation precision',
  'precision.displayLabel': 'Displayed amounts',
  'precision.bankLabel': 'Actual bank rewards',
  'fx.publicationHint':
    'The reference date is the latest date published by the source and may be earlier than the date the rate was fetched.',
  'fx.demoHint':
    'The example uses a fictional exchange rate. It does not request or cache public exchange rates.',
  'privacy.subtitle':
    'Statements are processed on your device. Public exchange rates and your language preference are stored separately.',
  'privacy.pdfLabel': 'PDFs and passwords',
  'privacy.pdfValue':
    'Used only for this local processing and released when it finishes. PDF files and passwords are not uploaded or saved.',
  'privacy.resultsLabel': 'Statement data and reward estimates',
  'privacy.resultsValue':
    'Kept only in this page’s memory. Reloading, closing the page, or starting over clears them.',
  'privacy.cacheLabel': 'Public exchange rates',
  'privacy.cacheValue':
    'Only the public quote, reference date, and fetch time are cached. The quote is reused for 6 hours after it is fetched. Clearing results keeps this cache.',
  'privacy.languageLabel': 'Language preference',
  'privacy.languageValue':
    'Your manually selected interface language is saved on this device and takes priority on reload or future visits. Clearing results keeps it. If browser storage is blocked, the selection lasts only on this page.',
  'pdf.dialogTitle': 'File status',
  'pdf.dialogHint':
    'Check this batch’s progress, unlock files, and review any errors.',
  'pdf.inProgressHint':
    'Processing continues when you close this dialog. Canceling discards this batch and keeps earlier results.',
  'pdf.failedFilesHint':
    'Failed files were not included in the estimate. Select those files again to retry.',
  'pdf.viewRewards': 'View RewardCash',
  'pdf.backToRewards': 'Back to overview',
  'pdf.summary.imported': 'Added to estimate',
  'pdf.summary.locked': 'Waiting for password',
  'pdf.summary.error': 'Processing failed',
  'pdf.summary.duplicate': 'Identical files skipped',
  'pdf.detailsHint':
    'Successful files are added to the estimate together when this batch finishes.',
  'rules.dialogTitle': 'RewardCash rules',
  'rules.exampleTitle': 'One purchase, three reward components',
  'rules.exampleBody':
    'An eligible UnionPay QR purchase in mainland China with a posted amount of CNY 250 has estimated rewards of 1 basic RC + 5 RC for spending outside Hong Kong + 5 PULSE RC = 11 RC. This assumes enrollment with the full extra 5X allocated to spending outside Hong Kong and both spending caps available. The CNY reference value is converted separately.',
  'rules.assumptionsTitle': 'Estimation assumptions',
  'rules.sourcesTitle': 'Official rule sources',
  'precision.title': 'Precision and rounding',
  'precision.compute':
    'Calculations retain six decimal places in RC without rounding each purchase to a whole RC. When a purchase crosses a spending cap, proportional rewards discard only fractions below 0.000001 RC.',
  'precision.display':
    'Overview and card totals are rounded to two decimal places; each reward component shows up to six. CNY reference values are converted from total rewards and rounded to the nearest cent. Display rounding never affects calculations. Adding rounded card or period values may differ from the overview due to rounding.',
  'precision.example':
    'HKD 0.01 earns 0.00004 basic RC. One hundred such purchases total 0.004 RC; they are not individually rounded down to zero.',
  'precision.bank':
    'Under the bank’s terms, leftover spending amounts carry over to the next purchase or statement. This tool estimates accrued RewardCash. Any remainder from earlier, unimported statements is unknown; actual RewardCash is determined by the bank’s records.',
  'precision.exact': 'Full precision: {amount}',
  'period.rulesTitle': 'Half-year totals and spending caps',
  'period.rulesBody':
    'Purchases are grouped by transaction date into January–June and July–December of each year. The spending cap for purchases outside Hong Kong is cumulative for the calendar year and does not reset in July. The PULSE spending cap resets each half-year. All imported transactions are calculated in date order before grouping; one statement may cover multiple periods.',
  'period.h1': '{year} · Jan–Jun',
  'period.h2': '{year} · Jul–Dec',
  'period.all': 'All periods',
  'period.results': 'RewardCash by half-year',
  'period.range': 'Date range',
  'period.capHint':
    'RewardCash is totaled separately for each period. Cap usage for spending outside Hong Kong is cumulative through the end of that period in the same year; PULSE shows usage for that half-year. Do not add shared cap usage across cards.',
  'card.reward': 'Period RewardCash estimate',
  'card.enrollmentIgnoredShort':
    'Historical estimates ignore enrollment effective dates.',
  'import.anywhere':
    'Drop PDFs anywhere on this page. Supports English text-based HSBC PULSE statements. Password-protected files can be unlocked on your device.',
  'drop.title': 'Drop PDFs to calculate rewards',
  'drop.hint': 'Add multiple statements at once. Files are processed on your device.',
  'drop.busy': 'The current batch is still processing',
  'drop.busyHint':
    'Unlock any password-protected files and wait for this batch to finish, or cancel it before adding more files.',
  'pdf.batchCount': 'Selected files · {count}',
  'pdf.needsAttention': ({ count }) => `{count} ${plural(count, 'file needs', 'files need')} attention`,
  'pdf.showFiles': 'View file status',
  'app.brand': 'Reward+',
  'seo.title': 'HSBC PULSE RewardCash Calculator · Reward+',
  'seo.description':
    'Reward+ is an independent HSBC PULSE UnionPay Dual Currency Diamond Credit Card estimator. Import English PDF statements to view estimated RewardCash, card breakdowns, and remaining spending caps. PDFs and passwords stay on your device. Results stay only on this page.',
  'seo.imageAlt': 'Reward+: HSBC PULSE RewardCash calculator. English PDF statements are processed on your device.',
  'seo.noScript': 'Enable JavaScript to import English PDF statements on your device and estimate RewardCash.',
  'cashback.title': 'RewardCash overview',
  'cashback.emptyTitle': 'PULSE RewardCash calculator',
  'cashback.intro':
    'Import English PDF statements on your device to estimate RewardCash, view rewards by card, and check remaining spending caps.',
  'cashback.subtitle': 'HSBC PULSE UnionPay Dual Currency Diamond Credit Card',
  'cashback.total': 'Estimated RewardCash',
  'cashback.knownHeading': 'Estimated RewardCash (partial)',
  'cashback.knownHint':
    'Some rewards are still pending. This amount includes only the portions already calculated.',
  'cashback.pendingRewards': 'Some rewards are still pending',
  'cashback.reference': 'CNY reference value',
  'cashback.totalHint':
    'Total of the three reward components. Displays two decimal places; calculations retain six decimal places in RC.',
  'cashback.emptyHint':
    'Select English PDF statements to see RewardCash, card details, and spending caps here.',
  'cashback.statements': 'Statements',
  'cashback.cards': 'Cards',
  'cashback.purchases': 'Purchases',
  'cashback.coverage': 'Statement coverage',
  'cashback.fxReference':
    'CNY reference values use 1 RC ≈ HKD 1 and the reference exchange rate. They are for reference only.',
  'cashback.known': 'Calculated: {amount}. Other rewards are still pending.',
  'card.product': 'PULSE · UnionPay Dual Currency Diamond',
  'card.empty': 'No card details yet',
  'card.emptyBody':
    'Statements identify each card’s last four digits, primary or additional card status, spending, and reward eligibility. Each card’s three reward components and spending cap usage appear here.',
  'card.coverage': ({ count }) => `{count} ${plural(count, 'statement', 'statements')} · {from} — {to}`,
  'card.transactions': ({ count, purchases }) =>
    `{count} ${plural(count, 'transaction', 'transactions')} · {purchases} ${plural(purchases, 'purchase', 'purchases')}`,
  'card.spend': 'Purchase spending',
  'card.eligible': 'Eligible spending',
  'card.caps': 'Spending caps for extra rewards',
  'card.capAbroad': 'HKD equivalent',
  'card.capPulse': 'HKD / CNY; MOP in HKD equivalent',
  'card.sharedPool':
    'These cards share a spending cap. The usage below is the total for all cards sharing it; do not add it across cards.',
  'card.enrollmentAssumed':
    'When enrollment or multiplier details are missing, this estimate assumes enrollment with the full extra 5X allocated to spending outside Hong Kong.',
  'card.fxAssumed':
    'Some cap usage for spending outside Hong Kong uses a reference exchange rate to estimate the HKD equivalent.',
  'rules.title': 'How RewardCash is calculated',
  'rules.subtitle':
    'Each reward component has its own eligibility rules. Eligible components can be combined.',
  'rules.basic.body':
    'Eligible spending earns RewardCash at a rate of 1 RC per HKD 250 or CNY 250 in the posted currency.',
  'rules.basic.cap': 'No spending cap for this reward component',
  'rules.abroad.body':
    'Purchases from merchants outside Hong Kong, with an original currency other than HKD. The extra multiplier follows the statement; if missing, this estimate assumes 5X.',
  'rules.abroad.cap':
    'Up to HKD 100,000 equivalent of eligible spending each year',
  'rules.pulse.body':
    'CNY or MOP purchases in mainland China or Macau using UnionPay QR, Apple Pay, Google Pay, or Samsung Pay.',
  'rules.pulse.cap':
    'Up to HKD / CNY 80,000 of eligible spending each half-year; MOP is counted at its HKD equivalent',
  'rules.extra': 'Extra {rate}%',
  'rules.base': '{rate}%',
  'rules.formula':
    'Eligible posted amount × reward rate → RC. A spending cap affects only the corresponding extra reward component.',
  'rules.exclusions':
    'Repayments, fees, cash advances, stored-value reloads, and similar transactions do not earn rewards. In this estimate, refunds do not earn rewards, reduce rewards already estimated, or restore spending cap capacity. The bank may handle refunds differently.',
  'rules.details': 'Full assumptions and official terms',
  'rules.source.0': 'RewardCash general terms',
  'rules.source.1': 'Red Hot Rewards of Your Choice overview',
  'rules.source.2': '2026 Red Hot Rewards of Your Choice terms',
  'rules.source.3': 'PULSE promotion terms',
  'cashback.tryExample': 'View example',
  'cashback.example': 'Example · Fictional data',
  'cashback.demoNotice':
    'This example uses fictional data. Selecting PDFs clears the example and estimates rewards from your statements.',
  'cashback.checkWarning': ({ count }) =>
    `{count} ${plural(count, 'statement has', 'statements have')} a balance mismatch. Transactions already identified remain included in the estimate.`,
  'cashback.checkWarningTitle': 'Statement balance mismatch',
  'cashback.memory':
    'PDFs are processed on your device. Results are cleared when you reload, close this page, or start over.',
  'cashback.restart': 'Start again',
  'cashback.breakdown': 'Estimated rewards by card',
  'cashback.breakdownHint':
    'The three reward components are totaled by card. Spending caps are shared only when that relationship is confirmed.',
  'action.cancel': 'Cancel',
  'action.confirmClear': 'Clear data',
  'action.close': 'Close',
  'action.privacy': 'Privacy and independence',
  'action.skip': 'Skip to main content',
  'import.dropTitle': 'Add statements to calculate rewards',
  'import.limit': 'Per file ≤ 25 MB / 200 pages · Total ≤ 20 files / 100 MB',
  'pdf.choose': 'Choose PDF files',
  'pdf.addFiles': 'Add more files',
  'pdf.addFilesBusy':
    'Add more files after this batch finishes or is canceled.',
  'pdf.addFilesHint':
    'Select more PDFs to add to your current results. This list will show the new batch’s file status.',
  'pdf.dropBody':
    'Drop multiple PDFs here or select files. Unlock password-protected statements on your device.',
  'pdf.stageHint':
    'Supports English text-based HSBC PULSE statements, not scanned PDFs. Successful files are added to the estimate together when the batch finishes.',
  'pdf.batchTitle': 'Your selected files',
  'pdf.batchHint':
    'Successful files are added to the estimate together when this batch finishes. Canceling discards this batch and keeps earlier results.',
  'pdf.cancelBatch': 'Cancel this import',
  'pdf.committed': ({ files, transactions }) =>
    `Added {files} ${plural(files, 'statement', 'statements')} and {transactions} new ${plural(transactions, 'transaction', 'transactions')}.`,
  'pdf.emptyBatch':
    'No new statements were added in this batch. Existing results are unchanged.',
  'pdf.failed.session-changed':
    'Your results changed while this batch was processing, so it was not added. This batch did not change the current results. Select these files again.',
  'pdf.failed.commit-failed':
    'This batch could not be reliably combined with the current results, so it was not added. Existing results are unchanged. Select these files again to retry.',
  'pdf.parsedSummary': ({ pages, transactions }) =>
    `{pages} ${plural(pages, 'page', 'pages')} · {transactions} ${plural(transactions, 'transaction', 'transactions')} recognized`,
  'pdf.parsing': 'Identifying cards and transactions…',
  'pdf.batchProgress': ({ total }) => `Processed {completed} of {total} ${plural(total, 'file', 'files')}`,
  'pdf.status.queued': 'Queued',
  'pdf.status.reading': 'Reading',
  'pdf.status.locked': 'Password required',
  'pdf.status.extracted': 'Text extracted',
  'pdf.status.parsing': 'Identifying',
  'pdf.status.parsed': 'Waiting for batch',
  'pdf.status.imported': 'Added to estimate',
  'pdf.status.error': 'Processing failed',
  'pdf.status.duplicate': 'Duplicate skipped',
  'pdf.status.removed': 'Removed',
  'pdf.remove': 'Remove {name}',
  'pdf.opening': 'Opening PDF locally…',
  'pdf.pageProgress': ({ total }) => `Extracted {completed} of {total} ${plural(total, 'page', 'pages')}`,
  'pdf.passwordLabel': 'PDF password for this statement',
  'pdf.passwordHint':
    'Your password is used only to unlock this file on your device. It is not saved or used for other files.',
  'pdf.wrongPassword':
    'Incorrect password. Try again. After five consecutive incorrect attempts, unlocking pauses for 60 seconds.',
  'pdf.frozen': ({ seconds }) => `Too many attempts. Try again in {seconds} ${plural(seconds, 'second', 'seconds')}.`,
  'pdf.unlock': 'Unlock this file',
  'pdf.retry': 'Retry',
  'pdf.extractedSummary': ({ pages }) =>
    `Text extracted from {pages} ${plural(pages, 'page', 'pages')}; not yet included in rewards.`,
  'pdf.error.unsupported-statement':
    'This file was not identified as a supported English HSBC PULSE statement and was not included in the estimate.',
  'pdf.error.invalid-statement':
    'The statement’s structure, required fields, or amounts are invalid. It could not be calculated reliably and was not included in the estimate.',
  'pdf.error.not-pdf': 'Select a valid PDF file (.pdf).',
  'pdf.error.empty-file': 'This file is empty. Choose another file.',
  'pdf.error.file-too-large': 'A file cannot exceed 25 MB.',
  'pdf.error.session-limit':
    'This page supports up to 20 files totaling no more than 100 MB. Select fewer files, or start over before importing more.',
  'pdf.error.password-required': 'This PDF requires a password.',
  'pdf.error.password-incorrect': 'The PDF password is incorrect.',
  'pdf.error.invalid-pdf': 'This PDF is damaged or has an invalid structure.',
  'pdf.error.too-many-pages': 'A PDF cannot exceed 200 pages.',
  'pdf.error.no-text':
    'No readable text was found. This may be a scanned PDF. Only text-based PDFs are supported; scanned text recognition is not available.',
  'pdf.error.aborted': 'Reading was canceled.',
  'pdf.error.read-failed':
    'This file could not be read. Check that it is complete and try again.',
  'pdf.error.engine-unavailable':
    'PDF reading is temporarily unavailable. Reload the page and try again; reloading clears the current results.',
  'pdf.error.duplicate':
    'An identical file is already in this batch or the current results. It was skipped.',
  'pdf.error.batch-busy':
    'Finish this batch by unlocking or removing files that need a password, or cancel it before selecting more files.',
  'card.primary': 'Primary card',
  'card.additional': 'Additional card',
  'card.unknown': 'Card',
  'rewards.basic': 'Basic rewards',
  'rewards.abroad': 'Outside Hong Kong',
  'rewards.pulse': 'PULSE exclusive',
  'rewards.remaining': 'Remaining spending cap',
  'rewards.used': 'Used {used} / {cap}',
  'rewards.annual': 'Annual · {period}',
  'rewards.half': 'Half-year · {period}',
  'rewards.noPool': 'No spending cap usage to show for this reward component',
  'rewards.poolUnconfirmed':
    'It is unclear whether the primary and additional cards share spending caps. Caps are estimated separately for each card.',
  'rewards.fxDemo': 'Example reference rate: 1 HKD = {rate} CNY',
  'fx.title': 'HKD → CNY reference exchange rate',
  'fx.loading': 'Fetching rate…',
  'fx.available': 'Reference rate available',
  'fx.cachePolicy':
    'The reference exchange rate is cached for 6 hours after it is fetched, then refreshed automatically.',
  'fx.stale': 'Older reference rate',
  'fx.rateDate': 'Rate date {date}',
  'fx.retrievedAt': 'Fetched {time}',
  'fx.unavailable':
    'The reference exchange rate is unavailable. CNY reference values and rewards that depend on this rate are pending.',
  'fx.loadingHint':
    'Fetching a public reference exchange rate. Results will update automatically when it is available.',
  'fx.refreshingHint':
    'Updating automatically. Estimates continue to use the rate marked as older until the update finishes.',
  'fx.failed':
    'The reference exchange rate is unavailable. We’ll try again automatically.',
  'fx.timeout': 'The exchange rate request timed out. We’ll retry automatically.',
  'fx.invalid':
    'The exchange rate response was incomplete or had an invalid date, so it was not used.',
  'fx.calculation':
    'This rate would put calculations outside the supported range, so it was not used.',
  'fx.staleHint':
    'Estimates still use the older reference rate. A successful update recalculates all results.',
  'rewards.fxEffect':
    'Spending caps for purchases outside Hong Kong use the bank’s HKD equivalent when available; otherwise, they use the reference exchange rate. Rate updates recalculate CNY reference values and may change extra rewards affected by spending caps.',
  'rewards.readonly': 'Read-only · {version}',
  'rewards.date': 'Verified on {date}',
  'rewards.latest':
    'All imported transactions are estimated using the currently verified rates, eligibility rules, and annual or half-year spending caps. Historical promotion rules are not recreated.',
  'rewards.imported':
    'Only eligible purchases imported on this page count toward spending caps. Prior usage is assumed to be zero.',
  'rewards.enrollment':
    'When enrollment or multiplier details are missing, this estimate assumes enrollment with the full extra 5X allocated to spending outside Hong Kong. Explicit enrollment status and multipliers follow the statement.',
  'rewards.enrollmentPeriodIgnored':
    'Historical estimates ignore your enrollment effective dates. Actual eligibility is determined by the bank’s records.',
  'rewards.periodInferred':
    'The statement does not specify a full billing period. Its start date is inferred.',
  'rewards.roleConflict':
    'The statements disagree on whether this is a primary or additional card. Its role is shown as unknown.',
  'rewards.poolConflict':
    'The statements contain conflicting information about shared spending caps. Caps are estimated separately for each card.',
  'rewards.knownPortion': 'Calculated: {amount}',
  'quality.title': 'Statement balance checks',
  'quality.matched': 'Matched checks: {count}',
  'quality.mismatch': 'Mismatched checks: {count}',
  'quality.unverified': 'Unable to check: {count}',
  'quality.excluded': 'Excluded transactions: {count}',
  'quality.uncertain': 'Incomplete eligibility data: {count}',
  'quality.duplicate': 'Possible duplicates: {count}',
  'quality.noAccounts': 'No statement account balances are available for checking.',
  'quality.duplicateHint': ({ count }) =>
    `{count} ${plural(count, 'transaction may be a duplicate. Without a unique bank reference, it remains', 'transactions may be duplicates. Without unique bank references, they remain')} included in the estimate.`,
  'quality.referenceHint': ({ count }) =>
    `{count} ${plural(count, 'transaction has', 'transactions have')} conflicting bank references and ${plural(count, 'remains', 'remain')} included in the estimate.`,
  'quality.unverifiedHint': ({ count }) =>
    `{count} balance ${plural(count, 'check lacks', 'checks lack')} the balances needed for verification. Transactions already identified remain included in the estimate.`,
  'quality.uncertainHint': ({ count }) =>
    `{count} ${plural(count, 'transaction lacks', 'transactions lack')} complete merchant location, original currency, or date information. Estimates use the available information conservatively.`,
  'reasons.title': 'Reward eligibility and exclusions',
  'reasons.common': 'These transactions are excluded from all three reward components',
  'reasons.count': ({ count }) => `{count} ${plural(count, 'transaction', 'transactions')}`,
  'reasons.empty': 'No spending qualifies for this reward component.',
  'reason.eligible': 'Eligible and included in the estimate',
  'reason.cap': 'Spending cap reached for this reward component',
  'reason.fx': 'A reference exchange rate is needed to calculate cap usage and rewards',
  'reason.region': 'Reliable merchant location information is missing',
  'reason.currency':
    'Original currency is unknown; eligibility for extra rewards is unconfirmed',
  'reason.originalHkd': 'Original currency is HKD; excluded from this extra reward',
  'reason.regionExcluded':
    'Merchant location does not qualify for this reward component',
  'reason.currencyExcluded': 'Original currency is neither CNY nor MOP',
  'reason.payment': 'No qualifying mobile wallet or UnionPay QR payment was identified',
  'reason.enrollment': 'Not enrolled or no multiplier allocated to spending outside Hong Kong',
  'reason.refund': 'Refunds do not earn rewards in this estimate',
  'reason.repayment': 'Repayment excluded',
  'reason.fee': 'Fee excluded',
  'reason.cash': 'Cash advances or cash installments are excluded',
  'reason.credit': 'Other credits are excluded',
  'reason.nonpositive': 'Zero or negative spending amounts are excluded',
  'reason.excluded': 'Stored-value reloads, bill payments, and similar transactions are excluded',
  'reason.other': 'The conditions for this reward component are not met',
  'rewards.pending': 'Pending calculation',
  'rewards.fxMissing': 'Pending conversion',
  'rewards.fxUnavailableHint':
    'The reference exchange rate is unavailable. CNY reference values and some capped rewards are pending.',
  'privacy.title': 'Privacy and independence',
  'privacy.localTitle': 'Local processing and temporary results',
  'privacy.localBody':
    'PDFs, passwords, and statement data are processed on your device. Parsed data and reward estimates stay only in this page’s memory and are cleared when you reload, close the page, or start over.',
  'privacy.networkTitle': 'Network access and public exchange rates',
  'privacy.networkBody':
    'Importing your statements automatically requests Frankfurter’s ECB reference exchange rate from HKD to CNY. Only the public quote, reference date, and fetch time are cached. Your selected interface language is saved separately on this device. Statements, passwords, card numbers, merchants, and amounts are not sent. There is no analytics tracking. The example does not request public exchange rates.',
  'privacy.independentTitle': 'Independence and trademarks',
  'privacy.independentBody':
    'Reward+ is an independent personal RewardCash estimator. It is not affiliated with, authorized by, or endorsed by HSBC. HSBC names and logos identify supported cards and rule sources; trademarks belong to their owners. Actual RewardCash is determined by the bank’s records.',
  'clear.title': 'Clear current data?',
  'clear.body':
    'Clear the current file statuses and reward estimates. The public exchange rate cache and language preference are kept. You can then select PDFs again or view the example.',
  'footer.independent': 'Independent of HSBC · RewardCash estimates only',
} satisfies MessageCatalog
