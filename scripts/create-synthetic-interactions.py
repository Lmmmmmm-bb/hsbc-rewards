"""Fake bank-shaped PDFs for opt-in local interaction QA; never reads real files."""
import sys
from pathlib import Path
from reportlab.pdfgen.canvas import Canvas
from reportlab.lib.pagesizes import A4

directory = Path(sys.argv[1])
directory.mkdir(parents=True, exist_ok=True)
card, cny = '1111 2222 3333 4444', '5555 6666 7777 8888'


def statement(name, date, year, transactions, closing):
    canvas = Canvas(str(directory / name), pagesize=A4)
    canvas.setTitle('SYNTHETIC interaction fixture')
    canvas.setFont('Helvetica', 8)
    lines = [
        [(64, 'Statement of HSBC Pulse UnionPay Dual Currency Diamond Card')],
        [(411, 'Statement Date')], [(420, date), (454, str(year))],
        [(344, 'Account Number'), (475, 'Credit Limit')],
        [(340, card), (481, 'HKD200,000.00')],
        [(340, cny), (481, 'CNY200,000.00')],
        [(66, f'Account number {card} HKD Sub-account Statement balance HKD{closing}')],
        [(66, 'Post date Trans date'), (267, 'Description of transaction'), (495, 'Amount'), (528, '(HKD)')],
        [(137, 'PREVIOUS BALANCE 0.00')], [(137, f'{card} SYNTHETIC HOLDER')],
        *transactions, [(137, f'STATEMENT BALANCE {closing}')],
    ]
    for row, parts in enumerate(lines):
        for x, text in parts:
            canvas.drawString(x, A4[1] - 30 - row * 12, text)
    canvas.save()


def purchase(date, name, amount):
    return [(71, date), (103, date), (137, name), (510, amount)]


statement('SYNTHETIC-half-year.pdf', '20JUL', 2026, [
    purchase('30JUN', 'SYNTHETIC SHOP MO', '90,000.00'),
    [(137, 'APPLE PAY-MOBILE:0000')], [(137, 'MOP90,000.00')],
    purchase('01JUL', 'SYNTHETIC SHOP MO', '30,000.00'),
    [(137, 'APPLE PAY-MOBILE:0000')], [(137, 'MOP30,000.00')],
], '120,000.00')
statement('SYNTHETIC-cross-year.pdf', '20JAN', 2026, [
    purchase('31DEC', 'SYNTHETIC LOCAL HKG', '30.00'),
    purchase('01JAN', 'SYNTHETIC LOCAL HKG', '30.00'),
], '60.00')
for index in range(20):
    statement(f'SYNTHETIC-batch-{index+1:02}.pdf', '20OCT', 2026, [
        purchase('19OCT', f'SYNTHETIC LOCAL {index+1:02} HKG', '1.00'),
    ], '1.00')
print('Created 22 synthetic interaction fixtures.')
