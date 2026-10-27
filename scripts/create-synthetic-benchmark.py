"""Generate only fake, bank-shaped input for local performance QA. Requires reportlab."""
import sys
from pathlib import Path
from reportlab.pdfgen.canvas import Canvas
from reportlab.lib.pagesizes import A4

directory = Path(sys.argv[1])
directory.mkdir(parents=True, exist_ok=True)
target = directory / 'SYNTHETIC-benchmark-100.pdf'
canvas = Canvas(str(target), pagesize=A4)
canvas.setTitle('SYNTHETIC benchmark — 100 pages, 2000 transactions')
card = '1111 2222 3333 4444'
cny = '5555 6666 7777 8888'
for page in range(100):
    canvas.setFont('Helvetica', 8)
    currency = 'HKD' if page < 50 else 'CNY'
    account = card if currency == 'HKD' else cny
    lines = [
        [(64, 'Statement of HSBC Pulse UnionPay Dual Currency Diamond Card')],
        [(411, 'Statement Date')], [(420, '20OCT'), (454, '2026')],
        [(344, 'Account Number'), (475, 'Credit Limit')],
        [(340, card), (481, 'HKD100,000.00')],
        [(340, cny), (481, 'CNY100,000.00')],
        [(66, f'Account number {account} {"HKD" if currency == "HKD" else "RMB"} Sub-account Statement balance {currency}10,000.00')],
        [(66, 'Post date Trans date'), (267, 'Description of transaction'), (495, 'Amount'), (528, f'({currency})')],
        *([[(137, 'PREVIOUS BALANCE 0.00')]] if page in [0, 50] else []),
        [(137, f'{account} SYNTHETIC HOLDER')],
    ]
    for row in range(20):
        number = page * 20 + row + 1
        description = f'SYNTHETIC {"LOCAL" if currency == "HKD" else "QR"} STORE {number:05d} {"HKG" if currency == "HKD" else "CN"}'
        lines.append([(71, '20OCT'), (103, '19OCT'), (137, description), (510, '10.00')])
    if page in [49, 99]:
        lines.append([(137, 'STATEMENT BALANCE 10,000.00')])
    for row, parts in enumerate(lines):
        for x, text in parts:
            canvas.drawString(x, A4[1] - 30 - row * 12, text)
    canvas.showPage()
canvas.save()
print(target)
