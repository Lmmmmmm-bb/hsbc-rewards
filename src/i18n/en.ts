import type { MessageKey } from './zh'

export const en = {
  'rules.dialogTitle': 'Reward rules & calculation',
  'rules.exampleTitle': 'One purchase, three reward tiers',
  'rules.exampleBody':
    'A qualifying CNY 250 mainland UnionPay QR purchase earns 1 basic RC + 5 Spend Abroad RC + 5 PULSE RC = 11 RC, assuming enrollment, all 5X allocated to Spend Abroad and both caps available. CNY reference value is converted separately.',
  'rules.assumptionsTitle': 'Estimation assumptions',
  'rules.sourcesTitle': 'Official sources · read-only rules',
  'precision.title': 'Decimals and rounding',
  'precision.compute':
    'Calculations use integer units of 0.000001 RC (six decimals). Ordinary rewards are not rounded per purchase. Proportional cap allocations discard only fractions below 0.000001 RC.',
  'precision.display':
    'Overview and card headline amounts round to two decimals; calculations retain full precision. Tier values show up to six decimals. CNY is rounded to cents after aggregation. Rounded period amounts may differ from the overall display by 0.01; totals use unrounded values.',
  'precision.example':
    'HKD 0.01 earns 0.00004 basic RC. One hundred such purchases accrue 0.004 RC rather than being rounded individually to zero.',
  'precision.bank':
    'The general, Your Choice and PULSE terms carry odd spending forward to the next purchase or statement. This tool estimates accrual, with unimported prior residuals unknown; an integer mathematical portion is not treated as an actual bank credit.',
  'precision.exact': 'Including fractions: {amount}',
  'period.rulesTitle': 'Half-year views preserve cap history',
  'period.rulesBody':
    'Purchase dates split each year into January–June and July–December. Spend Abroad continues across the whole year; PULSE resets each half-year. All imported purchases are calculated chronologically before grouping. A statement can belong to multiple periods.',
  'period.h1': '{year} · H1',
  'period.h2': '{year} · H2',
  'period.all': 'All periods',
  'period.results': 'Rewards by half-year',
  'period.range': 'Reporting range',
  'period.capHint':
    'Rewards are grouped per period. Spend Abroad allowances show year-to-date use at the end of each period; PULSE shows that half-year. Do not add shared pools across cards.',
  'card.reward': 'Estimated period reward',
  'card.enrollmentIgnoredShort':
    'Historical estimates ignore personal enrollment dates.',
  'import.anywhere':
    'Drop PDFs anywhere on this page. HSBC PULSE English text statements are supported; encrypted files unlock locally.',
  'drop.title': 'Drop PDFs to calculate rewards',
  'drop.hint': 'Add multiple statements. Files are processed on this device.',
  'drop.busy': 'The current batch is still processing',
  'drop.busyHint':
    'Finish unlocking or cancel this batch before adding more files.',
  'pdf.batchCount': 'Selected files · {count}',
  'pdf.needsAttention': '{count} need attention',
  'pdf.showFiles': 'Show file status',
  'pdf.hideFiles': 'Hide file details',
  'app.title': 'Your rewards companion',
  'cashback.title': 'Your rewards',
  'cashback.subtitle': 'HSBC PULSE UnionPay Dual Currency Diamond Card',
  'cashback.currentRules': 'Current-rule estimate',
  'cashback.total': 'Estimated RewardCash',
  'cashback.knownHeading': 'Known RewardCash',
  'cashback.knownHint':
    'Confirmed portions only; other rewards remain pending. Displayed to two decimals; calculations retain fractional RC.',
  'cashback.pendingRewards': 'Total still pending',
  'cashback.reference': 'Reference value in CNY',
  'cashback.totalHint':
    'All three tiers, displayed to two decimals; calculations retain fractional RC. Actual bank credits follow your statement.',
  'cashback.emptyHint':
    'Choose English PDF statements to see rewards, cards and allowances here.',
  'cashback.statements': 'Statements',
  'cashback.cards': 'Cards',
  'cashback.purchases': 'Purchases',
  'cashback.coverage': 'Statement coverage',
  'cashback.fxReference':
    'Converted using 1 RC ≈ HKD 1 as a reference value; this is not a CNY bank credit.',
  'cashback.known':
    'Known portion: {amount}; other rewards await the missing calculation basis.',
  'card.product': 'PULSE · UnionPay Dual Currency Diamond',
  'card.empty': 'Your card rewards',
  'card.emptyBody':
    'Statements identify card suffixes, roles, spending and eligibility. Each card’s three reward tiers and allowance usage appear here.',
  'card.coverage': '{count} statements · {from} — {to}',
  'card.transactions': '{count} transactions · {purchases} purchases',
  'card.spend': 'Purchase spending',
  'card.eligible': 'Rewarded spending (after caps)',
  'card.caps': 'Extra reward spending allowances',
  'card.capAbroad': 'HKD equivalent',
  'card.capPulse': 'HKD / CNY; MOP in HKD equivalent',
  'card.sharedPool':
    'Confirmed shared allowance. Usage below is for the whole pool; do not add it across cards.',
  'card.enrollmentAssumed':
    'Assumes registered with all 5X assigned to Spend Abroad.',
  'card.fxAssumed':
    'Some Spend Abroad allowance usage requires reference FX for its estimated HKD equivalent.',
  'rules.title': 'How rewards are calculated',
  'rules.subtitle':
    'Three independently assessed tiers can combine. Rates calculate RC; CNY value is converted separately.',
  'rules.basic.body':
    'Each eligible HKD / CNY 250 earns 1 RC, calculated in the posted sub-account currency.',
  'rules.basic.cap': 'No additional spending cap in this tool',
  'rules.abroad.body':
    'A merchant outside Hong Kong and an original currency other than HKD. Assumes registered with all extra 5X assigned to Spend Abroad.',
  'rules.abroad.cap':
    'First HKD 100,000 equivalent of eligible spending each year',
  'rules.pulse.body':
    'CNY / MOP spending in mainland China or Macau using UnionPay QR or Apple / Google / Samsung Pay.',
  'rules.pulse.cap':
    'First HKD / CNY 80,000 eligible spending each half-year; MOP in HKD equivalent',
  'rules.extra': 'Extra {rate}%',
  'rules.base': '{rate}%',
  'rules.formula':
    'Eligible posted amount × tier rate → RC; a cap affects only that extra tier.',
  'rules.exclusions':
    'Payments, fees, cash advances and stored-value reloads are excluded. This tool ignores refunds without clawback or cap release, which may differ from the bank.',
  'rules.details': 'Full assumptions and official terms',
  'rules.source.0': 'RewardCash general terms',
  'rules.source.1': 'Rewards of Your Choice overview',
  'rules.source.2': '2026 Rewards of Your Choice terms',
  'rules.source.3': 'PULSE special promotion terms',
  'cashback.tryExample': 'View example',
  'cashback.example': 'Example · Fictional data',
  'cashback.demoNotice':
    'This is a synthetic example. Selecting your PDF clears it and reads your file locally.',
  'cashback.checkWarning':
    '{count} statements have a balance mismatch and remain included in this estimate.',
  'cashback.checkWarningTitle': 'Balance reconciliation differs',
  'cashback.memory':
    'Results are temporary. The PDF is released after processing; refreshing or closing clears the results too.',
  'cashback.restart': 'Start again',
  'cashback.breakdown': 'Every card, every reward tier',
  'cashback.breakdownHint':
    'Spending is separated by posted currency. Each tier and allowance is calculated independently.',
  'action.cancel': 'Cancel',
  'action.confirmClear': 'Clear session',
  'action.close': 'Close',
  'action.privacy': 'Privacy and independence',
  'action.skip': 'Skip to main content',
  'import.dropTitle': 'Add statements to calculate rewards',
  'import.limit': 'Each ≤ 25 MB / 200 pages · Session ≤ 20 files / 100 MB',
  'pdf.choose': 'Choose PDF files',
  'pdf.dropBody':
    'Drop multiple PDFs here or choose files. Unlock encrypted statements locally.',
  'pdf.stageHint':
    'Supports text-based English HSBC Pulse statements; scans are not supported. Files are recognised locally and successful files are added together when the batch finishes.',
  'pdf.batchTitle': 'Your selected files',
  'pdf.batchHint':
    'Temporary results stay in memory. Cancelling clears this batch.',
  'pdf.cancelBatch': 'Cancel batch',
  'pdf.closeBatch': 'Hide file status',
  'pdf.committed':
    'Added {files} statements and {transactions} new transactions.',
  'pdf.committedHint': 'Hiding file status keeps the rewards already included.',
  'pdf.emptyBatch':
    'No new statements in this batch. Existing results are unchanged.',
  'pdf.failed.session-changed':
    'The session changed during processing. This batch was not added. Existing results are intact; select these files again.',
  'pdf.failed.commit-failed':
    'This batch could not be merged reliably and was not added. Existing results are intact; select files again to check.',
  'pdf.parsedSummary': '{pages} pages · {transactions} transactions recognised',
  'pdf.parsing': 'Identifying cards and transactions…',
  'pdf.batchProgress': 'Processed {completed} of {total} files',
  'pdf.status.queued': 'Queued',
  'pdf.status.reading': 'Reading',
  'pdf.status.locked': 'Password required',
  'pdf.status.extracted': 'Text extracted',
  'pdf.status.parsing': 'Recognising',
  'pdf.status.parsed': 'Recognised, awaiting batch',
  'pdf.status.imported': 'Included in rewards',
  'pdf.status.error': 'Read failed',
  'pdf.status.duplicate': 'Duplicate skipped',
  'pdf.status.removed': 'Removed',
  'pdf.remove': 'Remove {name}',
  'pdf.opening': 'Opening PDF locally…',
  'pdf.pageProgress': 'Extracted {completed} of {total} pages',
  'pdf.passwordLabel': 'PDF password for this statement',
  'pdf.passwordHint':
    'Used only for this local unlock. It is not saved or applied to other files.',
  'pdf.wrongPassword':
    'Incorrect password. Try again; five consecutive failures pause attempts for 60 seconds.',
  'pdf.frozen': 'Too many attempts. Try again in {seconds} seconds.',
  'pdf.unlock': 'Unlock this file',
  'pdf.retry': 'Retry',
  'pdf.extractedSummary':
    '{pages} pages read · Transaction recognition is being connected; rewards not calculated',
  'pdf.error.unsupported-statement':
    'Not a supported English HSBC Pulse statement. It was not included in rewards.',
  'pdf.error.invalid-statement':
    'Statement structure, required fields or amounts are invalid. It could not be calculated reliably and was not included in rewards.',
  'pdf.error.not-pdf': 'Choose a file with a PDF extension and type.',
  'pdf.error.empty-file': 'This file is empty. Choose another file.',
  'pdf.error.file-too-large': 'A file cannot exceed 25 MB.',
  'pdf.error.session-limit':
    'The session limit is 20 files or 100 MB. Process fewer files.',
  'pdf.error.password-required': 'This PDF requires a password.',
  'pdf.error.password-incorrect': 'The PDF password is incorrect.',
  'pdf.error.invalid-pdf': 'This PDF is damaged or has an invalid structure.',
  'pdf.error.too-many-pages': 'A PDF cannot exceed 200 pages.',
  'pdf.error.no-text':
    'No extractable text found. This may be a scan; OCR is not supported at this stage.',
  'pdf.error.aborted': 'Reading was cancelled.',
  'pdf.error.read-failed':
    'Unable to read this file. Check its integrity and retry.',
  'pdf.error.engine-unavailable':
    'The local PDF engine could not start. Refresh and retry, or use a browser that supports Workers.',
  'pdf.error.duplicate':
    'Its fingerprint matches this batch or an imported file. The duplicate was skipped.',
  'pdf.error.batch-busy':
    'Finish or remove locked files, or cancel the current batch, before selecting more files.',
  'card.primary': 'Primary',
  'card.additional': 'Additional',
  'card.unknown': 'Card',
  'rewards.basic': 'Basic',
  'rewards.abroad': 'Spend Abroad',
  'rewards.pulse': 'PULSE exclusive',
  'rewards.remaining': 'Remaining cap',
  'rewards.used': '{used} used / {cap}',
  'rewards.annual': 'Annual · {period}',
  'rewards.half': 'Half-year · {period}',
  'rewards.noPool': 'No imported spend has used this tier’s cap',
  'rewards.poolUnconfirmed':
    'Shared ownership is unconfirmed. Cap pools are calculated separately for now.',
  'rewards.fxDemo': 'Example reference rate: 1 HKD = {rate} CNY',
  'fx.title': 'HKD → CNY reference rate',
  'fx.loading': 'Fetching…',
  'fx.available': 'Reference available',
  'fx.cachedToday': 'Cached today',
  'fx.dailyPolicy':
    'A successful public quote is reused for the Hong Kong calendar day and updates automatically the next day.',
  'fx.stale': 'Older reference',
  'fx.rateDate': 'Rate date {date}',
  'fx.retrievedAt': 'Retrieved {time}',
  'fx.unavailable':
    'No reference rate yet. CNY values and rewards that require it remain pending.',
  'fx.loadingHint':
    'Fetching a public reference rate. Calculations will update automatically.',
  'fx.refreshingHint':
    'Updating automatically. Calculations continue using the labelled older reference until it completes.',
  'fx.failed':
    'A reference rate is not available yet. An automatic retry is scheduled.',
  'fx.timeout': 'The rate request timed out. An automatic retry is scheduled.',
  'fx.invalid':
    'The rate response was incomplete or had an invalid date. It was not used.',
  'fx.calculation':
    'This reference would exceed the safe calculation range. It was not used.',
  'fx.staleHint':
    'An older reference is still used. A successful automatic update recalculates all results.',
  'rewards.fxEffect':
    'The reference rate converts CNY displays and estimates caps when bank HKD equivalents are missing. A daily update may change extra rewards.',
  'rewards.readonly': 'Read-only · {version}',
  'rewards.date': 'Verified {date}',
  'rewards.latest':
    'Apply current rules to each historical year and half-year; label them as current-rule estimates.',
  'rewards.imported':
    'Only imported transactions consume caps; earlier usage starts at zero.',
  'rewards.enrollment':
    'Unknown enrollment assumes registration with all 5X allocated to Spend Abroad.',
  'rewards.enrollmentPeriodIgnored':
    'Historical estimates ignore personal enrollment dates; this does not establish actual bank entitlement.',
  'rewards.periodInferred':
    'The statement does not specify a full cycle. Its coverage start is inferred.',
  'rewards.roleConflict':
    'Card-role evidence conflicts; the card role remains unknown.',
  'rewards.poolConflict':
    'Shared-allowance evidence conflicts; allowances are estimated separately by card.',
  'rewards.knownPortion': 'Known portion: {amount}',
  'quality.title': 'Source balance checks',
  'quality.matched': 'Matched checks: {count}',
  'quality.mismatch': 'Mismatched checks: {count}',
  'quality.unverified': 'Unverified checks: {count}',
  'quality.excluded': 'Excluded transactions: {count}',
  'quality.uncertain': 'Incomplete evidence: {count}',
  'quality.duplicate': 'Possible duplicates: {count}',
  'quality.noAccounts': 'No source sub-account balance checks are available.',
  'quality.duplicateHint':
    '{count} transactions may be duplicates. Without unique bank evidence, they remain included in the estimate.',
  'quality.referenceHint':
    '{count} transactions have conflicting bank references and remain included in the estimate.',
  'quality.unverifiedHint':
    '{count} source checks lack required balances. Read transactions remain included in the estimate.',
  'quality.uncertainHint':
    '{count} transactions lack complete region, original-currency or date evidence. Estimates use the evidence available.',
  'reasons.title': 'Reward eligibility and exclusions',
  'reasons.common': 'These transactions are excluded from all three tiers',
  'reasons.count': '{count} transactions',
  'reasons.empty': 'No spending meets this tier’s conditions.',
  'reason.eligible': 'Eligible and rewarded',
  'reason.cap': 'This tier’s spending cap applies',
  'reason.fx': 'Reference FX is required to calculate the cap and rewards',
  'reason.region': 'Reliable merchant-region evidence is missing',
  'reason.currency':
    'Original currency is unknown; extra eligibility is unconfirmed',
  'reason.originalHkd': 'HKD original currency excludes Spend Abroad',
  'reason.regionExcluded':
    'Merchant region does not meet this tier’s conditions',
  'reason.currencyExcluded': 'Original currency is neither CNY nor MOP',
  'reason.payment': 'No qualifying mobile or QR payment marker was identified',
  'reason.enrollment': 'Not enrolled or no Spend Abroad multiplier assigned',
  'reason.refund': 'Refund ignored under the agreed estimate policy',
  'reason.repayment': 'Repayment excluded',
  'reason.fee': 'Fee excluded',
  'reason.cash': 'Cash advance or cash instalment excluded',
  'reason.credit': 'Credit excluded',
  'reason.nonpositive': 'Zero amount or nonpositive spending',
  'reason.excluded': 'Excluded reload, bill-payment or similar transaction',
  'reason.other': 'This tier’s reward conditions are not met',
  'rewards.pending': 'Pending calculation',
  'rewards.fxMissing': 'Conversion unavailable',
  'rewards.fxUnavailableHint':
    'Reference FX is unavailable. CNY values and some capped rewards are pending.',
  'privacy.title': 'Your files stay in your browser',
  'privacy.localTitle': 'Processing and storage',
  'privacy.localBody':
    'PDFs, passwords and parsed records are handled locally. The current version uses memory and does not persist business data in browser storage.',
  'privacy.networkTitle': 'External requests',
  'privacy.networkBody':
    'After import, only the fixed Frankfurter HKD→CNY endpoint is used for ECB reference rates. Only the public rate and its dates are cached across reloads; statements and results still clear. PDFs, passwords, card numbers, merchants and amounts are never sent. Requests omit cookies and referrers. There is no telemetry. The demo requests no rates.',
  'privacy.independentTitle': 'An independent product',
  'privacy.independentBody':
    'Pulse Rewards is not affiliated with, authorised or endorsed by HSBC. Rewards are estimates; actual bank credits prevail.',
  'clear.title': 'Clear this session?',
  'clear.body':
    'Clear the current files and rewards. You can then choose PDFs again or explore the example.',
  'footer.independent': 'Independent of HSBC · Rewards are estimates',
} satisfies Record<MessageKey, string>
