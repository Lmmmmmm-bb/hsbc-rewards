import type { MessageKey } from './zh'

export const en = {
  'rules.tabRewards': 'Reward rules',
  'rules.tabCalculation': 'Calculation policy',
  'rules.tabSources': 'Official sources',
  'rules.maxExtra': 'Up to {rate}% extra',
  'rules.eligibilityLabel': 'Eligible purchases',
  'rules.capLabel': 'Spending cap',
  'rules.excludedTitle': 'Exclusions and refunds',
  'rules.scopeTitle': 'Rules and imported scope',
  'rules.sharingBody':
    'Caps are shared only with explicit ownership evidence. Unconfirmed sharing is estimated separately by card and labelled.',
  'rules.enrollmentTitle': 'Enrollment and allocation',
  'rules.fxTitle': 'Reference FX and CNY values',
  'rules.sourcesHint':
    'Rule documents come from HSBC’s official website. This is an independent estimator; actual credits follow bank records.',
  'rules.versionLabel': 'Rule version',
  'rules.verifiedLabel': 'Verified date',
  'rules.sourceHint.0': 'Basic RewardCash and carry-forward of odd spending.',
  'rules.sourceHint.1': 'Rewards of Your Choice and Spend Abroad allocation.',
  'rules.sourceHint.2': 'Spend Abroad eligibility, multipliers and annual cap.',
  'rules.sourceHint.3': 'PULSE payment methods and half-year spending cap.',
  'precision.computeLabel': 'Calculation precision',
  'precision.displayLabel': 'Page display',
  'precision.bankLabel': 'Bank credits',
  'fx.publicationHint':
    'The latest published rate date can be earlier than the retrieval date.',
  'fx.demoHint':
    'Example FX is fictional. No public rate is requested or cached.',
  'privacy.subtitle':
    'Statements are processed locally. Public FX is cached separately.',
  'privacy.pdfLabel': 'PDFs and passwords',
  'privacy.pdfValue':
    'Used only for local processing and released afterwards. Originals are not uploaded or saved.',
  'privacy.resultsLabel': 'Statement data and rewards',
  'privacy.resultsValue':
    'Stay on this page and clear on reload, close or starting again.',
  'privacy.cacheLabel': 'Public FX',
  'privacy.cacheValue':
    'The quote, rate date and retrieval time are cached by Hong Kong calendar day. Clearing reward results keeps this cache.',
  'pdf.dialogTitle': 'File status',
  'pdf.dialogHint':
    'Review progress, unlock files and check failures in this batch.',
  'pdf.inProgressHint':
    'Closing this dialog keeps processing. Cancelling discards this batch while keeping earlier results.',
  'pdf.failedFilesHint':
    'Failed files were not included. Choose those files again to retry.',
  'pdf.viewRewards': 'View reward results',
  'pdf.backToRewards': 'Back to reward overview',
  'pdf.summary.imported': 'Included in rewards',
  'pdf.summary.locked': 'Awaiting password',
  'pdf.summary.error': 'Processing failed',
  'pdf.summary.duplicate': 'Duplicates skipped',
  'pdf.detailsHint':
    'Successful files are included together when this batch finishes.',
  'rules.dialogTitle': 'Reward rules & calculation',
  'rules.exampleTitle': 'One purchase, three reward tiers',
  'rules.exampleBody':
    'A qualifying CNY 250 mainland UnionPay QR purchase earns 1 basic RC + 5 Spend Abroad RC + 5 PULSE RC = 11 RC, assuming enrollment, all 5X allocated to Spend Abroad and both caps available. CNY reference value is converted separately.',
  'rules.assumptionsTitle': 'Estimation policy',
  'rules.sourcesTitle': 'Official rule sources',
  'precision.title': 'Decimals and rounding',
  'precision.compute':
    'Calculations retain six RC decimals without per-purchase integer rounding. Proportional allocations across spending caps discard only fractions below 0.000001 RC.',
  'precision.display':
    'Overview and card headline amounts round to two decimals; tiers show up to six. CNY is converted to cents after aggregation. Display rounding never feeds back into calculations; rounded period values can differ from the overview by 0.01.',
  'precision.example':
    'HKD 0.01 earns 0.00004 basic RC. One hundred such purchases accrue 0.004 RC rather than being rounded individually to zero.',
  'precision.bank':
    'Official terms carry odd spending to the next purchase or statement. This tool estimates accrued rewards; unimported prior residuals are unknown. Actual credits follow bank records.',
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
  'pdf.showFiles': 'View file status',
  'app.title': 'Your rewards companion',
  'cashback.title': 'Your rewards',
  'cashback.subtitle': 'HSBC PULSE UnionPay Dual Currency Diamond Card',
  'cashback.total': 'Estimated rewards (RewardCash)',
  'cashback.knownHeading': 'Calculated reward estimate',
  'cashback.knownHint':
    'Some tiers remain pending. This amount includes only calculated portions.',
  'cashback.pendingRewards': 'Total still pending',
  'cashback.reference': 'Reference value in CNY',
  'cashback.totalHint':
    'Three tiers combined. Two decimals displayed; calculations retain fractions.',
  'cashback.emptyHint':
    'Choose English PDF statements to see rewards, cards and allowances here.',
  'cashback.statements': 'Source statements',
  'cashback.cards': 'Cards',
  'cashback.purchases': 'Purchases',
  'cashback.coverage': 'Statement coverage',
  'cashback.fxReference':
    'Converted using 1 RC ≈ HKD 1 and reference FX. CNY values are for reference only.',
  'cashback.known': 'Calculated: {amount}; other rewards remain pending.',
  'card.product': 'PULSE · UnionPay Dual Currency Diamond',
  'card.empty': 'Your card rewards',
  'card.emptyBody':
    'Statements identify card suffixes, roles, spending and eligibility. Each card’s three reward tiers and allowance usage appear here.',
  'card.coverage': '{count} statements · {from} — {to}',
  'card.transactions': '{count} transactions · {purchases} purchases',
  'card.spend': 'Purchase spending',
  'card.eligible': 'Rewarded spending',
  'card.caps': 'Extra reward spending allowances',
  'card.capAbroad': 'HKD equivalent',
  'card.capPulse': 'HKD / CNY; MOP in HKD equivalent',
  'card.sharedPool':
    'Confirmed shared allowance. Usage below is for the whole pool; do not add it across cards.',
  'card.enrollmentAssumed':
    'Missing enrollment or multiplier assumes registration with all 5X assigned to Spend Abroad.',
  'card.fxAssumed':
    'Some Spend Abroad allowance usage requires reference FX for its estimated HKD equivalent.',
  'rules.title': 'How rewards are calculated',
  'rules.subtitle':
    'Each tier is assessed separately. Eligible rewards can combine.',
  'rules.basic.body':
    'Eligible spending earns 1 RC per HKD / CNY 250 in the posted account currency.',
  'rules.basic.cap': 'No spending cap for this tier',
  'rules.abroad.body':
    'The merchant is outside Hong Kong and the original currency is not HKD. Extra multipliers follow statement evidence, defaulting to 5X when unknown.',
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
    'Repayments, fees, cash advances and stored-value reloads are excluded. Refunds neither earn rewards, reverse this estimate nor restore cap capacity. The bank may handle them differently.',
  'rules.details': 'Full assumptions and official terms',
  'rules.source.0': 'RewardCash general terms',
  'rules.source.1': 'Rewards of Your Choice overview',
  'rules.source.2': '2026 Rewards of Your Choice terms',
  'rules.source.3': 'PULSE special promotion terms',
  'cashback.tryExample': 'View example',
  'cashback.example': 'Example · Fictional data',
  'cashback.demoNotice':
    'This is a fictional example. Choosing PDFs replaces it with your statement estimates.',
  'cashback.checkWarning':
    '{count} statements have mismatched balance checks. Read transactions remain included in the estimate.',
  'cashback.checkWarningTitle': 'Balance reconciliation differs',
  'cashback.memory':
    'PDFs are processed locally. Results stay on this page and clear when you reload or close it.',
  'cashback.restart': 'Start again',
  'cashback.breakdown': 'Estimated rewards by card',
  'cashback.breakdownHint':
    'Rewards are grouped by card; spending caps follow confirmed sharing relationships.',
  'action.cancel': 'Cancel',
  'action.confirmClear': 'Clear session',
  'action.close': 'Close',
  'action.privacy': 'Privacy and independence',
  'action.skip': 'Skip to main content',
  'import.dropTitle': 'Add statements to calculate rewards',
  'import.limit': 'Each ≤ 25 MB / 200 pages · Page total ≤ 20 files / 100 MB',
  'pdf.choose': 'Choose PDF files',
  'pdf.dropBody':
    'Drop multiple PDFs here or choose files. Unlock encrypted statements locally.',
  'pdf.stageHint':
    'Supports English text-based HSBC PULSE statements, not scans. Successful files are included together when the batch finishes.',
  'pdf.batchTitle': 'Your selected files',
  'pdf.batchHint':
    'Successful files are included together when this batch finishes. Cancelling discards this batch and keeps earlier results.',
  'pdf.cancelBatch': 'Cancel this import',
  'pdf.committed':
    'Added {files} statements and {transactions} new transactions.',
  'pdf.emptyBatch':
    'No new statements in this batch. Existing results are unchanged.',
  'pdf.failed.session-changed':
    'The current results changed during processing. This batch was not added. Earlier results remain; select these files again.',
  'pdf.failed.commit-failed':
    'This batch could not be merged reliably and was not added. Earlier results remain; select the files again to check.',
  'pdf.parsedSummary': '{pages} pages · {transactions} transactions recognised',
  'pdf.parsing': 'Identifying cards and transactions…',
  'pdf.batchProgress': 'Processed {completed} of {total} files',
  'pdf.status.queued': 'Queued',
  'pdf.status.reading': 'Reading',
  'pdf.status.locked': 'Password required',
  'pdf.status.extracted': 'Text extracted',
  'pdf.status.parsing': 'Recognising',
  'pdf.status.parsed': 'Recognised, waiting for batch',
  'pdf.status.imported': 'Included in rewards',
  'pdf.status.error': 'Processing failed',
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
    'Text extracted from {pages} pages; not yet included in rewards.',
  'pdf.error.unsupported-statement':
    'Not a supported English HSBC PULSE statement. It was not included in rewards.',
  'pdf.error.invalid-statement':
    'Statement structure, required fields or amounts are invalid. It could not be calculated reliably and was not included in rewards.',
  'pdf.error.not-pdf': 'Choose a file with a PDF extension and type.',
  'pdf.error.empty-file': 'This file is empty. Choose another file.',
  'pdf.error.file-too-large': 'A file cannot exceed 25 MB.',
  'pdf.error.session-limit':
    'This page allows up to 20 files or 100 MB in total. Choose fewer files, or start again before importing more.',
  'pdf.error.password-required': 'This PDF requires a password.',
  'pdf.error.password-incorrect': 'The PDF password is incorrect.',
  'pdf.error.invalid-pdf': 'This PDF is damaged or has an invalid structure.',
  'pdf.error.too-many-pages': 'A PDF cannot exceed 200 pages.',
  'pdf.error.no-text':
    'No readable text found. This may be a scan. Only text PDFs are currently supported.',
  'pdf.error.aborted': 'Reading was cancelled.',
  'pdf.error.read-failed':
    'Unable to read this file. Check its integrity and retry.',
  'pdf.error.engine-unavailable':
    'PDF reading is temporarily unavailable. Reload and try again; reloading clears current results.',
  'pdf.error.duplicate':
    'This file is already in the batch or current results. It was skipped.',
  'pdf.error.batch-busy':
    'Unlock or remove locked files, or cancel this import, before choosing more files.',
  'card.primary': 'Primary',
  'card.additional': 'Additional',
  'card.unknown': 'Card',
  'rewards.basic': 'Basic',
  'rewards.abroad': 'Spend Abroad',
  'rewards.pulse': 'PULSE exclusive',
  'rewards.remaining': 'Remaining spending cap',
  'rewards.used': '{used} used / {cap}',
  'rewards.annual': 'Annual · {period}',
  'rewards.half': 'Half-year · {period}',
  'rewards.noPool': 'No imported spend has used this tier’s cap',
  'rewards.poolUnconfirmed':
    'Shared ownership is unconfirmed. Cap pools are calculated separately for now.',
  'rewards.fxDemo': 'Example reference rate: 1 HKD = {rate} CNY',
  'fx.title': 'HKD → CNY reference rate',
  'fx.loading': 'Fetching…',
  'fx.available': 'Reference rate available',
  'fx.cachedToday': 'Cached today',
  'fx.dailyPolicy':
    'Reference FX is cached by Hong Kong calendar day and updates automatically the next day.',
  'fx.stale': 'Older reference rate',
  'fx.rateDate': 'Rate date {date}',
  'fx.retrievedAt': 'Retrieved {time}',
  'fx.unavailable':
    'Reference FX is unavailable. CNY conversion and rewards that need FX remain pending.',
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
    'Spend Abroad uses bank HKD equivalents first, otherwise reference FX. Rate updates recalculate CNY values and may change capped extra rewards.',
  'rewards.readonly': 'Read-only · {version}',
  'rewards.date': 'Verified {date}',
  'rewards.latest':
    'All purchases use the currently verified rates, eligibility and annual/half-year caps. Historical promotion rules are not reconstructed.',
  'rewards.imported':
    'Only eligible purchases imported on this page consume caps; earlier usage starts at zero.',
  'rewards.enrollment':
    'Unknown enrollment or extra multipliers assume registration with all 5X allocated to Spend Abroad. Explicit allocations follow the statement.',
  'rewards.enrollmentPeriodIgnored':
    'Historical estimates ignore personal enrollment dates. Actual entitlement follows bank records.',
  'rewards.periodInferred':
    'The statement does not specify a full cycle. Its coverage start is inferred.',
  'rewards.roleConflict':
    'Card-role evidence conflicts; the card role remains unknown.',
  'rewards.poolConflict':
    'Shared-allowance evidence conflicts; allowances are estimated separately by card.',
  'rewards.knownPortion': 'Calculated: {amount}',
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
  'reason.refund': 'Refund excluded from this estimate',
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
  'privacy.title': 'Privacy and independence',
  'privacy.localTitle': 'Local processing and temporary results',
  'privacy.localBody':
    'PDFs, passwords and statement data are processed locally. Parsed records and rewards stay on this page and clear on reload, close or starting again.',
  'privacy.networkTitle': 'Network access and public FX cache',
  'privacy.networkBody':
    'Real imports automatically request Frankfurter’s ECB HKD→CNY reference. Only the public quote, rate date and retrieval time are cached. Statements, passwords, card numbers, merchants and amounts are not sent. There is no telemetry. The example requests no public FX.',
  'privacy.independentTitle': 'Independence and brand identification',
  'privacy.independentBody':
    'Pulse Rewards is an independent personal reward estimator, with no HSBC affiliation, authorisation or endorsement. HSBC names and logos identify supported cards and rule sources; trademarks belong to their owners. Actual rewards follow bank records.',
  'clear.title': 'Clear this session?',
  'clear.body':
    'Clear current file status and rewards. The public FX cache remains. You can then choose PDFs again or view the example.',
  'footer.independent': 'Independent of HSBC · Rewards are estimates',
} satisfies Record<MessageKey, string>
