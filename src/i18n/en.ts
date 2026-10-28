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
  'dialogContent.failed': 'Content could not be loaded',
  'dialogContent.retained': 'Imported statements are kept. Retry or reopen this dialog later.',
  'dialogContent.retry': 'Reload content',
  'rules.tabRewards': 'Reward rules',
  'rules.tabCalculation': 'How estimates work',
  'rules.tabSources': 'Official sources',
  'rules.maxExtra': 'Up to {rate}% extra',
  'rules.eligibilityLabel': 'Eligible purchases',
  'rules.capLabel': 'Spending cap',
  'rules.excludedTitle': 'Exclusions and refunds',
  'rules.scopeTitle': 'Estimate scope',
  'rules.sharingBody':
    'Spending caps are combined only when statements confirm sharing. Otherwise, caps are estimated per card, with a notice.',
  'rules.enrollmentTitle': 'Enrollment and reward multipliers',
  'rules.fxTitle': 'Exchange rates and CNY reference values',
  'rules.sourcesHint':
    'Reward+ independently estimates rewards from HSBC’s official documents. Actual RewardCash follows bank records.',
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
    'The source’s latest rate date may be earlier than the fetch date.',
  'fx.demoHint':
    'Fictional rate for this example; no public rates are requested or cached.',
  'privacy.subtitle':
    'Statements are processed on your device. Public rates and your language preference are saved separately.',
  'privacy.pdfLabel': 'PDFs and passwords',
  'privacy.pdfValue':
    'Used only for this processing on your device, then released. PDF files and passwords are never uploaded or saved.',
  'privacy.resultsLabel': 'Statement data and reward estimates',
  'privacy.resultsValue':
    'Kept only in this page’s memory; cleared on reload, close, or restart.',
  'privacy.cacheLabel': 'Public exchange rates',
  'privacy.cacheValue':
    'Only the public quote, rate date, and fetch time are saved. Reused for 6 hours after fetching, then refreshed automatically. Kept when results are cleared.',
  'privacy.languageLabel': 'Language preference',
  'privacy.languageValue':
    'Your manually selected language is saved on this device and takes priority on reload or future visits. Clearing results keeps it. If storage is blocked, it lasts only on this page.',
  'pdf.dialogTitle': 'File status',
  'pdf.dialogHint':
    'Check progress, unlock files, or review errors.',
  'pdf.inProgressHint':
    'Processing continues after closing. Canceling discards this batch and keeps earlier results.',
  'pdf.failedFilesHint':
    'Failed files were not added. Select them again to retry.',
  'pdf.viewRewards': 'View RewardCash',
  'pdf.backToRewards': 'Back to overview',
  'pdf.summary.imported': 'Added to estimate',
  'pdf.summary.locked': 'Waiting for password',
  'pdf.summary.error': 'Processing failed',
  'pdf.summary.duplicate': 'Identical files skipped',
  'pdf.detailsHint':
    'Successful files are added together when this batch finishes.',
  'rules.dialogTitle': 'RewardCash rules',
  'rules.exampleTitle': 'Combining three reward components',
  'rules.exampleBody':
    'For an eligible UnionPay QR purchase in mainland China posted as CNY 250, the formula adds estimated basic, Outside Hong Kong, and PULSE exclusive rewards, in that order. Assumes enrollment, the full extra 5X allocated to Outside Hong Kong, and enough capacity under both spending caps.',
  'rules.assumptionsTitle': 'Estimation assumptions',
  'rules.sourcesTitle': 'Official rule sources',
  'precision.title': 'Precision and rounding',
  'precision.compute':
    'RC calculations retain six decimal places without rounding each purchase to a whole RC. At spending caps, proportional rewards discard only fractions below 0.000001 RC.',
  'precision.display':
    'Overview and card totals round to two decimal places; reward components show up to six. Total rewards are converted to CNY reference values and rounded to cents. Display rounding does not affect calculations; rounded card or period values may not add up to the overview.',
  'precision.example':
    'HKD 0.01 earns 0.00004 basic RC; 100 purchases total 0.004 RC without rounding each to zero.',
  'precision.bank':
    'The bank carries leftover spending to the next purchase or statement. This tool estimates accrued RewardCash; earlier, unimported remainders are unknown. Actual rewards depend on the bank’s records.',
  'precision.exact': 'Full precision: {amount}',
  'period.rulesTitle': 'Half-year totals and spending caps',
  'period.rulesBody':
    'All imported transactions are calculated in transaction date order, then grouped into January–June and July–December each year. Outside Hong Kong cap usage accumulates all year without resetting in July; PULSE resets each half-year. One statement may span several periods.',
  'period.h1': '{year} · Jan–Jun',
  'period.h2': '{year} · Jul–Dec',
  'period.all': 'All periods',
  'period.results': 'RewardCash by half-year',
  'period.range': 'Date range',
  'period.capHint':
    'Rewards are totaled by half-year. Outside Hong Kong shows cap usage for the year through that period’s end; PULSE shows that half-year’s usage. Do not add shared cap usage across cards.',
  'card.reward': 'Period RewardCash estimate',
  'card.enrollmentIgnoredShort':
    'Historical estimates ignore enrollment effective dates.',
  'import.anywhere':
    'Drop PDFs anywhere on this page. Only English text-based HSBC PULSE statements are supported; unlock protected files on your device.',
  'drop.title': 'Drop PDFs to calculate rewards',
  'drop.hint': 'Add multiple statements at once. Files are processed on your device.',
  'drop.busy': 'The current batch is still processing',
  'drop.busyHint':
    'Unlock or remove files awaiting a password, then wait for this batch to finish. Or cancel it to add more files.',
  'pdf.batchCount': 'Selected files · {count}',
  'pdf.needsAttention': ({ count }) => `{count} ${plural(count, 'file needs', 'files need')} attention`,
  'pdf.showFiles': 'View file status',
  'app.brand': 'Reward+',
  'seo.title': 'HSBC PULSE RewardCash Calculator · Reward+',
  'seo.description':
    'Import English HSBC PULSE UnionPay Dual Currency Diamond Credit Card PDF statements for estimated RewardCash, card details, and remaining spending caps. Independent estimates; PDFs and passwords stay on your device. Results stay only on this page.',
  'seo.imageAlt': 'Reward+ · HSBC PULSE RewardCash calculator with on-device English PDF processing.',
  'seo.noScript': 'Enable JavaScript to import English PDF statements on your device and estimate RewardCash.',
  'cashback.title': 'RewardCash overview',
  'cashback.emptyTitle': 'PULSE RewardCash calculator',
  'cashback.intro':
    'Import English PDFs on your device for estimated RewardCash, card details, and remaining spending caps.',
  'cashback.subtitle': 'HSBC PULSE UnionPay Dual Currency Diamond Credit Card',
  'cashback.total': 'Estimated RewardCash',
  'cashback.knownHeading': 'Estimated RewardCash (partial)',
  'cashback.knownHint':
    'Includes calculated portions only; other rewards are pending.',
  'cashback.pendingRewards': 'Some rewards pending',
  'cashback.reference': 'CNY reference value',
  'cashback.totalHint':
    'Three reward components combined. Shows two decimal places; RC calculations retain six.',
  'cashback.emptyHint':
    'Import statements to see estimated RewardCash.',
  'cashback.statements': 'Statements',
  'cashback.cards': 'Cards',
  'cashback.purchases': 'Purchases',
  'cashback.coverage': 'Statement coverage',
  'cashback.fxReference':
    'CNY reference values use 1 RC ≈ HKD 1, converted at the reference exchange rate.',
  'cashback.known': 'Calculated: {amount}. Other rewards are still pending.',
  'card.product': 'PULSE · UnionPay Dual Currency Diamond',
  'card.empty': 'No card details yet',
  'card.emptyBody':
    'Import statements to see each card’s last four digits, primary/additional role, spending, reward eligibility, three reward components, and spending cap usage.',
  'card.coverage': ({ count }) => `{count} ${plural(count, 'statement', 'statements')} · {from} — {to}`,
  'card.transactions': ({ count, purchases }) =>
    `{count} ${plural(count, 'transaction', 'transactions')} · {purchases} ${plural(purchases, 'purchase', 'purchases')}`,
  'card.spend': 'Purchase spending',
  'card.eligible': 'Eligible spending',
  'card.caps': 'Spending caps for extra rewards',
  'card.capAbroad': 'HKD equivalent',
  'card.capPulse': 'HKD / CNY; MOP in HKD equivalent',
  'card.sharedPool':
    'These cards share a spending cap. Usage below is their combined total; do not add it across cards.',
  'card.enrollmentAssumed':
    'If enrollment or multiplier details are missing, estimates assume enrollment with the full extra 5X allocated to spending outside Hong Kong.',
  'card.fxAssumed':
    'Some Outside Hong Kong cap usage estimates the HKD equivalent at a reference rate.',
  'rules.title': 'How RewardCash is calculated',
  'rules.subtitle':
    'The three reward components can be combined when each qualifies.',
  'rules.basic.body':
    'Eligible spending earns 1 RC per HKD 250 or CNY 250 in the posted currency.',
  'rules.basic.cap': 'No spending cap',
  'rules.abroad.body':
    'Merchants outside Hong Kong; original currency other than HKD. Extra multiplier follows the statement, with 5X assumed if missing.',
  'rules.abroad.cap':
    'HKD 100,000 equivalent per year',
  'rules.pulse.body':
    'CNY or MOP purchases in mainland China or Macau using UnionPay QR, Apple Pay, Google Pay, or Samsung Pay.',
  'rules.pulse.cap':
    'HKD / CNY 80,000 per half-year; MOP at its HKD equivalent',
  'rules.extra': 'Extra {rate}%',
  'rules.base': '{rate}%',
  'rules.formula':
    'Eligible posted amount × reward rate → RC. A spending cap affects only the corresponding extra reward component.',
  'rules.exclusions':
    'Repayments, fees, cash advances, stored-value reloads, and similar transactions earn no rewards. In this tool, refunds earn no rewards, do not reduce prior estimates, and do not restore spending cap capacity. The bank may handle them differently.',
  'rules.details': 'Estimate details and official terms',
  'rules.source.0': 'RewardCash general terms',
  'rules.source.1': 'Red Hot Rewards of Your Choice overview',
  'rules.source.2': '2026 Red Hot Rewards of Your Choice terms',
  'rules.source.3': 'PULSE promotion terms',
  'cashback.tryExample': 'View example',
  'cashback.example': 'Example · Fictional data',
  'cashback.demoNotice':
    'Importing PDFs replaces this example with your statement results.',
  'cashback.checkWarning': ({ count }) =>
    `{count} ${plural(count, 'statement is', 'statements are')} affected. Identified transactions remain in the estimate.`,
  'cashback.checkWarningTitle': 'Statement balance mismatch',
  'cashback.memory':
    'PDFs are processed on your device. Results clear on reload, close, or restart.',
  'cashback.restart': 'Start over',
  'cashback.breakdown': 'Estimated rewards by card',
  'cashback.breakdownHint':
    'Three reward components totaled by card. Spending caps are shared only when confirmed.',
  'action.cancel': 'Cancel',
  'action.confirmClear': 'Clear data',
  'action.close': 'Close',
  'action.privacy': 'Privacy and independence',
  'action.skip': 'Skip to main content',
  'import.dropTitle': 'Import statements',
  'import.limit': 'Per file ≤ 25 MB / 200 pages · Page total ≤ 20 files / 100 MB',
  'pdf.choose': 'Choose PDF files',
  'pdf.addFiles': 'Add more files',
  'pdf.addFilesBusy':
    'Add more files after this batch finishes or is canceled.',
  'pdf.addFilesHint':
    'Add PDFs to build on your results. This list will show the new batch.',
  'pdf.dropBody':
    'Drop multiple PDFs here or select files. Unlock password-protected statements on your device.',
  'pdf.stageHint':
    'English text-based HSBC PULSE PDFs only; scans are unsupported. Successful files are added together when the batch finishes.',
  'pdf.batchTitle': 'Your selected files',
  'pdf.batchHint':
    'Successful files are added together when this batch finishes. Canceling discards this batch and keeps earlier results.',
  'pdf.cancelBatch': 'Cancel this import',
  'pdf.committed': ({ files, transactions }) =>
    `Added {files} ${plural(files, 'statement', 'statements')} and {transactions} new ${plural(transactions, 'transaction', 'transactions')}.`,
  'pdf.emptyBatch':
    'No new statements. Existing results are unchanged.',
  'pdf.failed.session-changed':
    'Results changed during processing. This batch was not added and left current results unchanged. Select these files again.',
  'pdf.failed.commit-failed':
    'This batch could not be combined and was not added. Existing results are unchanged. Select these files again.',
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
  'pdf.passwordLabel': 'PDF password',
  'pdf.passwordHint':
    'Used only to unlock this file on your device; never saved or used for other files.',
  'pdf.wrongPassword':
    'Incorrect password. Try again; five consecutive errors pause unlocking for 60 seconds.',
  'pdf.frozen': ({ seconds }) => `Too many attempts. Try again in {seconds} ${plural(seconds, 'second', 'seconds')}.`,
  'pdf.unlock': 'Unlock this file',
  'pdf.retry': 'Retry',
  'pdf.extractedSummary': ({ pages }) =>
    `{pages} ${plural(pages, 'page', 'pages')} extracted; not yet included in rewards.`,
  'pdf.error.unsupported-statement':
    'Not recognized as a supported English HSBC PULSE statement; excluded from the estimate.',
  'pdf.error.invalid-statement':
    'Invalid statement structure, required fields, or amounts prevent a reliable estimate; this file was not added.',
  'pdf.error.not-pdf': 'Select a valid PDF file (.pdf).',
  'pdf.error.empty-file': 'This file is empty. Choose another file.',
  'pdf.error.file-too-large': 'A file cannot exceed 25 MB.',
  'pdf.error.session-limit':
    'This page allows up to 20 files totaling 100 MB. Select fewer files or start over.',
  'pdf.error.password-required': 'This PDF requires a password.',
  'pdf.error.password-incorrect': 'The PDF password is incorrect.',
  'pdf.error.invalid-pdf': 'This PDF is damaged or has an invalid structure.',
  'pdf.error.too-many-pages': 'A PDF cannot exceed 200 pages.',
  'pdf.error.no-text':
    'No readable text found; this may be a scanned PDF. Only text-based PDFs are supported; scanned text recognition is unavailable.',
  'pdf.error.aborted': 'Reading was canceled.',
  'pdf.error.read-failed':
    'This file could not be read. Check that it is complete and try again.',
  'pdf.error.engine-unavailable':
    'PDF reading is temporarily unavailable. Reload the page and try again; reloading clears the current results.',
  'pdf.error.duplicate':
    'Identical file already in this batch or current results; skipped.',
  'pdf.error.batch-busy':
    'Unlock or remove files awaiting a password, then wait for this batch to finish. Or cancel it to add more files.',
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
  'rewards.noPool': 'No spending cap usage yet',
  'rewards.poolUnconfirmed':
    'Spending cap sharing between primary and additional cards is unconfirmed; caps are estimated separately.',
  'rewards.fxDemo': 'Example reference rate: 1 HKD = {rate} CNY',
  'fx.title': 'HKD → CNY reference exchange rate',
  'fx.loading': 'Fetching rate…',
  'fx.available': 'Reference rate available',
  'fx.cachePolicy':
    'Cached for 6 hours after fetching, then refreshed automatically.',
  'fx.stale': 'Older reference rate',
  'fx.rateDate': 'Rate date {date}',
  'fx.retrievedAt': 'Fetched {time}',
  'fx.unavailable':
    'Reference rate unavailable. CNY reference values and rewards requiring this rate are pending.',
  'fx.loadingHint':
    'Fetching a public reference rate; results update automatically once available.',
  'fx.refreshingHint':
    'Updating automatically; estimates use the rate marked as older until finished.',
  'fx.failed':
    'Rate unavailable. Retrying automatically.',
  'fx.timeout': 'Rate request timed out. Retrying automatically.',
  'fx.invalid':
    'Incomplete rate data or invalid date; rate not used. Retrying automatically.',
  'fx.calculation':
    'This rate puts calculations outside the supported range and was not used. Retrying automatically.',
  'fx.staleHint':
    'Using the older rate; a successful update recalculates all results.',
  'rewards.fxEffect':
    'Outside Hong Kong cap usage uses the bank’s HKD equivalent, or the reference rate if unavailable. Rate updates recalculate CNY reference values and may change extra rewards affected by spending caps.',
  'rewards.readonly': 'Read-only · {version}',
  'rewards.date': 'Verified on {date}',
  'rewards.latest':
    'Imported transactions use currently verified rates, eligibility rules, and annual or half-year spending caps. Historical promotions are not recreated.',
  'rewards.imported':
    'Only eligible purchases imported here use spending caps; prior usage is assumed zero.',
  'rewards.enrollment':
    'If enrollment or multiplier details are missing, estimates assume enrollment with the full extra 5X allocated to spending outside Hong Kong. Explicit details follow the statement.',
  'rewards.enrollmentPeriodIgnored':
    'Historical estimates ignore enrollment effective dates. Actual eligibility follows bank records.',
  'rewards.periodInferred':
    'Incomplete billing period; start date inferred.',
  'rewards.roleConflict':
    'Conflicting primary/additional card details; role shown as unknown.',
  'rewards.poolConflict':
    'Conflicting spending cap sharing details; caps are estimated separately for each card.',
  'rewards.knownPortion': 'Calculated: {amount}',
  'quality.title': 'Statement balance checks',
  'quality.matched': 'Matched checks: {count}',
  'quality.mismatch': 'Mismatched checks: {count}',
  'quality.unverified': 'Unable to check: {count}',
  'quality.excluded': 'Excluded transactions: {count}',
  'quality.uncertain': 'Incomplete eligibility data: {count}',
  'quality.duplicate': 'Possible duplicates: {count}',
  'quality.noAccounts': 'Statement account balances unavailable; unable to check.',
  'quality.duplicateHint': ({ count }) =>
    `{count} ${plural(count, 'transaction may be a duplicate. Without a unique bank reference, it remains', 'transactions may be duplicates. Without unique bank references, they remain')} in the estimate.`,
  'quality.referenceHint': ({ count }) =>
    `{count} ${plural(count, 'transaction has', 'transactions have')} conflicting bank references and ${plural(count, 'remains', 'remain')} in the estimate.`,
  'quality.unverifiedHint': ({ count }) =>
    `{count} balance ${plural(count, 'check lacks', 'checks lack')} required balances. Identified transactions remain in the estimate.`,
  'quality.uncertainHint': ({ count }) =>
    `{count} ${plural(count, 'transaction lacks', 'transactions lack')} full merchant location, original currency, or date details. Estimated conservatively from available data.`,
  'reasons.title': 'Reward eligibility and exclusions',
  'reasons.common': 'Excluded from all three reward components',
  'reasons.count': ({ count }) => `{count} ${plural(count, 'transaction', 'transactions')}`,
  'reasons.empty': 'No spending qualifies for this reward component.',
  'reason.eligible': 'Eligible; included in estimate',
  'reason.cap': 'Spending cap reached',
  'reason.fx': 'Missing reference rate; cap usage and rewards pending',
  'reason.region': 'Reliable merchant location missing',
  'reason.currency':
    'Original currency unknown; extra reward eligibility unconfirmed',
  'reason.originalHkd': 'Original currency is HKD; no Outside Hong Kong rewards',
  'reason.regionExcluded':
    'Merchant location does not qualify',
  'reason.currencyExcluded': 'Original currency is neither CNY nor MOP',
  'reason.payment': 'No qualifying mobile wallet or UnionPay QR payment identified',
  'reason.enrollment': 'Not enrolled or no multiplier allocated to spending outside Hong Kong',
  'reason.refund': 'Refund excluded from this estimate',
  'reason.repayment': 'Repayment excluded',
  'reason.fee': 'Fee excluded',
  'reason.cash': 'Cash advance or cash installment excluded',
  'reason.credit': 'Other credit excluded',
  'reason.nonpositive': 'Zero or negative spending excluded',
  'reason.excluded': 'Stored-value reload, bill payment, or similar exclusion',
  'reason.other': 'Reward conditions not met',
  'rewards.pending': 'Pending calculation',
  'rewards.fxMissing': 'Pending conversion',
  'rewards.fxUnavailableHint':
    'Reference rate missing; CNY reference values and some capped rewards are pending.',
  'privacy.title': 'Privacy and independence',
  'privacy.localTitle': 'How data is stored',
  'privacy.localBody':
    'PDFs, passwords, and statement data are processed on your device. Data and estimates stay in this page’s memory, cleared on reload, close, or restart.',
  'privacy.networkTitle': 'Network requests',
  'privacy.networkBody':
    'Importing statements automatically fetches Frankfurter’s ECB HKD-to-CNY reference rate, with automatic retries on failure. Requests contain no statements, passwords, card numbers, merchants, or amounts. No analytics tracking. The example uses a fictional rate without requesting or caching public rates.',
  'privacy.independentTitle': 'Independence and trademarks',
  'privacy.independentBody':
    'Reward+ is an independent personal RewardCash estimator, not affiliated with, authorized by, or endorsed by HSBC. HSBC names and logos identify supported cards and rule sources; trademarks belong to their owners. Actual RewardCash depends on bank records.',
  'clear.title': 'Clear current data?',
  'clear.body':
    'Clears statements, file statuses, and reward estimates. Keeps public rate cache and language preference. You can then import again or view the example.',
  'footer.independent': 'Independent of HSBC · RewardCash estimates only',
} satisfies MessageCatalog
