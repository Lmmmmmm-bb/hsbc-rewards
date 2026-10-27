import type { MessageKey } from './zh'

export const en = {
  'app.title': 'Your rewards companion',
  'cashback.title': 'Your rewards',
  'cashback.subtitle': 'HSBC PULSE UnionPay Dual Currency Diamond Card',
  'cashback.currentRules': 'Current-rule estimate',
  'cashback.total': 'Estimated RewardCash',
  'cashback.reference': 'Reference value in CNY',
  'cashback.totalHint':
    'All three tiers, retaining fractional RC. Actual bank credits and carried remainders follow your statement.',
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
    'Some Spend Abroad allowance usage uses reference FX for its HKD equivalent.',
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
    'Local reading and unlocking are available. Reward recognition for real statements is still being connected; these files do not yet enter rewards estimates.',
  'pdf.batchTitle': 'Your selected files',
  'pdf.batchHint':
    'Temporary results stay in memory. Cancelling clears this batch.',
  'pdf.cancelBatch': 'Cancel batch',
  'pdf.batchProgress': 'Processed {completed} of {total} files',
  'pdf.status.queued': 'Queued',
  'pdf.status.reading': 'Reading',
  'pdf.status.locked': 'Password required',
  'pdf.status.extracted': 'Text extracted',
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
  'rewards.fxEffect':
    'The reference rate converts CNY displays and estimates Spend Abroad caps when bank HKD equivalents are missing. Refreshing may change extra rewards.',
  'rewards.readonly': 'Read-only · {version}',
  'rewards.date': 'Verified {date}',
  'rewards.latest':
    'Apply current rules to each historical year and half-year; label them as current-rule estimates.',
  'rewards.imported':
    'Only imported transactions consume caps; earlier usage starts at zero.',
  'rewards.enrollment':
    'Unknown enrollment assumes registration with all 5X allocated to Spend Abroad.',
  'rewards.pending': 'Pending calculation',
  'rewards.fxMissing': 'Conversion unavailable',
  'privacy.title': 'Your files stay in your browser',
  'privacy.localTitle': 'Processing and storage',
  'privacy.localBody':
    'PDFs, passwords and parsed records are handled locally. The current version uses memory and does not persist business data in browser storage.',
  'privacy.networkTitle': 'External requests',
  'privacy.networkBody':
    'The demo requests no external business services. Live exchange rates will use a public allowlist without card numbers, merchants or amounts.',
  'privacy.independentTitle': 'An independent product',
  'privacy.independentBody':
    'Pulse Rewards is not affiliated with, authorised or endorsed by HSBC. Rewards are estimates; actual bank credits prevail.',
  'clear.title': 'Clear this session?',
  'clear.body':
    'Clear the current files and rewards. You can then choose PDFs again or explore the example.',
  'footer.independent': 'Independent of HSBC · Rewards are estimates',
} satisfies Record<MessageKey, string>
