import type { MessageCatalog } from './message-types.ts'

// English cardinal agreement stays in the English catalog, not in components.
const plural = (count: string | number, one: string, other: string) =>
  Number(count) === 1 ? one : other

export const en = {
  "details.statementDate": "Statement date",
  "details.statementPeriod": "Statement period",
  "details.filter.mismatch": "Transactions from mismatched statement accounts",
  "details.filter.unverified": "Transactions from unverified statement accounts",
  "details.filters": "Filter transactions",
  "details.transactionRecords": "Transaction records",
  "details.transactionInfo": "Transaction information",
  "details.componentRewards": "Reward components",
  "details.transactionReward": "Estimated RewardCash",
  "details.note.transactions": "Filters do not reallocate spending caps. Refunds do not reduce estimates or restore caps.",

  "import.additionalHint": "Add English PDFs. Successful files are included together when this batch finishes.",
  "fx.details": "Exchange rate basis and updates",
  "caps.pending": "Pending",
  "caps.exhausted": "Cap exhausted",
  "caps.remaining": "Spending cap remaining",
  "caps.shared": "Confirmed shared cap",
  "caps.independent": "Estimated separately by card",
  "caps.asOf": "Cumulative through {date}",
  "caps.used": "Used / spending cap",
  "caps.bankBasis": "Based on posted amounts or the bank’s HKD equivalent.",
  "caps.sources": ({ count }) => `{count} related source ${plural(count, 'statement', 'statements')} imported`,
  "caps.observed": "Observed transactions {from} — {to}",
  "caps.noTransactions": "No transactions are observed in this range. Earlier spending may still exist.",

  "details.title": "Reward details",
  "details.scope": "Scope",
  "details.updated": "Results have changed. Pagination has restarted from the first page.",
  "details.allCards": "All cards",
  "details.component": "Reward component",
  "details.allComponents": "All components",
  "details.status": "Calculation status",
  "details.allStatuses": "All statuses",
  "details.flag.pending": "Pending",
  "details.flag.uncertain": "Insufficient evidence",
  "details.flag.excluded": "Excluded",
  "details.flag.capped": "Capped",
  "details.issueFilter": "Filtered to the selected quality issue",
  "details.clearReason": "Clear this condition",
  "details.recordCount": ({ count }) => `{count} ${plural(count, 'transaction', 'transactions')}`,
  "details.pageNumber": "Page {page} of {pages}",
  "details.empty": "No records match the current filters.",
  "details.previous": "Previous",
  "details.next": "Next",
  "details.back": "Back",
  "details.inspect": "Inspect related records",
  "details.card": "View details",
  "details.transactionDate": "Transaction date",
  "details.postingDate": "Posting date",
  "details.kind": "Transaction type",
  "details.original": "Original amount",
  "details.account": "Posted amount",
  "details.region": "Merchant region",
  "details.payment": "Payment method",
  "details.unknown": "Unknown",
  "details.cappedAmount": "Posted amount limited by the cap",
  "details.cap.full": "The spending cap is exhausted; this transaction earns no rewards for this component.",
  "details.cap.partial": "Part of this transaction is limited by the spending cap. Rewards use the engine’s precise proportion.",
  "details.sources": "Source statements",
  "details.sourceUnavailable": "Source-statement details are no longer available",
  "details.sourcePage": "Page {page}",
  "details.sourceText": "Extracted source text",
  "details.objectMissing": "The original item is no longer in these results. Close this dialog and open the current results again.",
  "details.kind.purchase": "Purchase",
  "details.kind.refund": "Refund",
  "details.kind.repayment": "Repayment",
  "details.kind.fee": "Fee",
  "details.kind.cash-advance": "Cash advance",
  "details.kind.credit": "Other credit",
  "details.payment.standard": "Standard payment",
  "details.payment.apple-pay": "Apple Pay",
  "details.payment.google-pay": "Google Pay",
  "details.payment.samsung-pay": "Samsung Pay",
  "details.payment.unionpay-qr": "UnionPay QR",
  "details.payment.unknown": "Unknown",

  "basis.title": "Estimate basis",
  "basis.baseline": "Estimated from imported statements using current rules. Only imported spending uses the caps; opening usage is assumed to be zero.",
  "basis.registration": "Registration is not stated; the estimate assumes registration.",
  "basis.multiplier": "The allocation multiplier is not stated; the estimate assumes the full extra 5X is allocated to Outside Hong Kong.",
  "basis.details": "View transaction details",
  "basis.pendingImport": "This batch is still processing and is not included in the current amounts. Open file status to check progress or unlock files.",

  'agent.dialogTitle': 'AI access',
  'agent.dialogHint': 'Allow AI tools in your browser to read analysis results on this page.',
  'agent.allow': 'Allow result access',
  'agent.revoke': 'Stop sharing',
  'agent.shared': 'Sharing is enabled for real results in this page',
  'agent.notShared': 'Real results are not shared',
  'agent.connecting': 'Preparing AI tools for this page…',
  'agent.retry': 'Retry AI access',
  'agent.connectionFailed': 'AI access could not be prepared. Your statements and import progress are kept. Please retry.',
  'agent.unsupported': 'WebMCP is disabled or unsupported in this browser. Try searching for WebMCP at chrome://flags in Chrome, enabling it, and restarting the browser.',
  'agent.allowPreparing': 'Preparing AI tools. Please wait.',
  'agent.allowFailed': 'AI access failed. Click “Retry AI access.”',
  'agent.scope': 'Sharing includes import status, estimated rewards, spending caps, transaction amounts, and reasons. Transaction descriptions are read only on request. PDFs and passwords still use local processing.',
  'agent.modelPrivacy': 'AI tools may send the results they read to their model providers. Enable sharing only for AI tools you trust.',
  'agent.lifetime': 'Sharing lasts for this page, including later imports, and ends on refresh, close, or restart. The example can be read directly; real statements require sharing to be enabled.',
  'agent.boundary': 'This controls this site’s tool output. It does not authenticate AI tools or block extensions that already have page access. Stopping sharing cannot recall previously read data.',
  'agent.tool.context': 'Inspect supported statements, limits, result-sharing status, and browser file input instructions for Reward+.',
  'agent.tool.rules': 'Read the rules actually used by this application, their verification date, estimate assumptions, and official sources.',
  'agent.tool.access': 'Open the page-local result-sharing dialog. A page action enables sharing; calling this tool does not grant access.',
  'agent.tool.openImport': 'Open file status to select PDFs or handle a referenced file. Provide files through browser upload controls and enter passwords in the page.',
  'agent.tool.importStatus': 'Read batch-wide outcomes and paginated anonymous file progress, problem codes, and next actions. Keep batchRef when paging. Real results require page-local sharing.',
  'agent.tool.cancelImport': 'Cancel the current uncommitted batch identified by batchRef, discarding its work while retaining earlier results. Stale references cannot cancel a newer batch.',
  'agent.tool.summary': 'Read committed reward totals, key limitations, periods, and a paginated card index. Returns resultToken for consistent follow-up queries.',
  'agent.tool.card': 'Read one card’s estimated rewards and spending caps using cardRef, period, and resultToken. Each cap includes its basis and cumulative cutoff.',
  'agent.tool.transactions': 'Page through transactions and reward components at a specific resultToken. Flags match any selected flag within the selected component and report matchedComponents. Descriptions are omitted by default.',
  'agent.tool.quality': 'Inspect eligibility evidence, assumptions, and quality issues at a resultToken. Transaction issues follow the query scope; balance checks always cover complete source statements.',
  'agent.error.invalid_arguments': 'Invalid arguments. Check field types, ranges, and required fields in the tool definition.',
  'agent.error.access_required': 'Enable result sharing in this page’s AI access dialog first.',
  'agent.error.no_results': 'There are no committed results. Import statements or open the example first.',
  'agent.error.period_not_found': 'This period is unavailable. Select a period from the current summary.',
  'agent.error.card_not_found': 'This card is unavailable in the query scope. Read a current card reference from the summary.',
  'agent.error.file_not_found': 'This file reference is no longer valid. Read the current import status.',
  'agent.error.batch_changed': 'The import batch changed. Read the current batch before acting.',
  'agent.error.batch_not_active': 'This batch has no uncommitted work to cancel.',
  'agent.error.result_changed': 'Results or their supporting inputs changed. Read a new summary and resultToken.',
  'agent.error.cursor_invalid': 'The cursor is invalid or the filters changed. Start pagination again.',
  'agent.error.ui_busy': 'Finish or close the current dialog before opening another action.',
  'agent.error.cancelled': 'This tool call was canceled. The page’s import continues independently.',
  'agent.error.unavailable': 'The tool call could not be completed. Check the page state and retry.',
  'agent.error.query_too_broad': 'The result is too large. Narrow the scope or reduce the page size.',
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
  'privacy.agentLabel': 'AI access',
  'privacy.agentValue': 'When you allow result access, AI tools in your browser can read analysis results and may send them to their model providers. Sharing lasts for this page and can be stopped at any time.',
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
    'Page amounts round to two decimal places; nonzero amounts that round to zero show <0.01 RC. Calculation details show up to six decimal places. Total rewards are converted to CNY reference values and rounded to cents. Display rounding does not affect calculations; rounded card or period values may not add up to the overview.',
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
    'Some spending cap usage estimates the HKD equivalent at a reference rate.',
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
  'footer.github': 'GitHub',
} satisfies MessageCatalog
