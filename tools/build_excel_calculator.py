"""Builds assets/downloads/GB-Homes-Mortgage-Calculator.xlsx

A branded Excel version of the website's mortgage calculator, with live
formulas that follow the same rules as js/finance.js (Canadian semi-annual
compounding, CMHC premiums, stress test, Ontario / Toronto land transfer tax).

Run from the repository root:  python3 tools/build_excel_calculator.py
Needs: pip install openpyxl pillow
"""
from openpyxl import Workbook
from openpyxl.drawing.image import Image as XLImage
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side, Protection
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.workbook.defined_name import DefinedName

OUT = "assets/downloads/GB-Homes-Mortgage-Calculator.xlsx"
LOGO = "assets/brand/logo-horizontal.png"

AGENT = "Gbenga, REALTOR®"
BROKERAGE = "Real City Realty"
PHONE = "(437) 235-2788"
EMAIL = "realtorgbh@gmail.com"
SITE = "gbluxuryhomes.ca"

RED = "E52020"
INK = "111111"
CREAM = "F7F5F2"
LINE = "E6E3DF"
INPUT_FILL = "FFF6D6"

F_TITLE = Font(name="Arial", size=18, bold=True, color=INK)
F_H = Font(name="Arial", size=12, bold=True, color="FFFFFF")
F_LABEL = Font(name="Arial", size=10, color=INK)
F_INPUT = Font(name="Arial", size=10, bold=True, color="0B57D0")
F_OUT = Font(name="Arial", size=10, bold=True, color=INK)
F_BIG = Font(name="Arial", size=16, bold=True, color=RED)
F_NOTE = Font(name="Arial", size=9, italic=True, color="5F6368")
F_BODY = Font(name="Arial", size=10, color=INK)
thin = Side(style="thin", color=LINE)
BOX = Border(left=thin, right=thin, top=thin, bottom=thin)

MONEY = '"$"#,##0'
MONEY2 = '"$"#,##0.00'
PCT2 = "0.00%"
PCT1 = "0.0%"

wb = Workbook()


def header_band(ws, row, text, span="B:D"):
    a, b = span.split(":")
    ws.merge_cells(f"{a}{row}:{b}{row}")
    c = ws[f"{a}{row}"]
    c.value = text
    c.font = F_H
    c.fill = PatternFill("solid", fgColor=INK)
    c.alignment = Alignment(vertical="center", indent=1)
    ws.row_dimensions[row].height = 22


def label(ws, ref, text, note=None):
    ws[ref] = text
    ws[ref].font = F_LABEL
    ws[ref].alignment = Alignment(vertical="center", wrap_text=True)
    if note:
        col = chr(ord(ref[0]) + 2)
        r = ref[1:]
        ws[f"{col}{r}"] = note
        ws[f"{col}{r}"].font = F_NOTE
        ws[f"{col}{r}"].alignment = Alignment(vertical="center", wrap_text=True)


def inp(ws, ref, value, fmt=None):
    c = ws[ref]
    c.value = value
    c.font = F_INPUT
    c.fill = PatternFill("solid", fgColor=INPUT_FILL)
    c.border = BOX
    c.alignment = Alignment(horizontal="right")
    c.protection = Protection(locked=False)
    if fmt:
        c.number_format = fmt


def out(ws, ref, formula, fmt=None, big=False):
    c = ws[ref]
    c.value = formula
    c.font = F_BIG if big else F_OUT
    c.border = BOX
    c.fill = PatternFill("solid", fgColor=CREAM)
    c.alignment = Alignment(horizontal="right")
    if fmt:
        c.number_format = fmt


def brand_top(ws, title, subtitle):
    ws.sheet_view.showGridLines = False
    ws.column_dimensions["A"].width = 3
    img = XLImage(LOGO)
    img.width, img.height = 260, 44
    ws.add_image(img, "B1")
    ws.row_dimensions[1].height = 36
    ws.row_dimensions[2].height = 8
    ws["B3"] = title
    ws["B3"].font = F_TITLE
    ws["B4"] = subtitle
    ws["B4"].font = F_NOTE


def contact_footer(ws, row, span="B:D"):
    a, b = span.split(":")
    ws.merge_cells(f"{a}{row}:{b}{row}")
    ws[f"{a}{row}"] = f"Questions? {AGENT}  |  {BROKERAGE}  |  {PHONE}  |  {EMAIL}  |  {SITE}"
    ws[f"{a}{row}"].font = Font(name="Arial", size=10, bold=True, color=RED)
    ws.merge_cells(f"{a}{row + 1}:{b}{row + 1}")
    ws[f"{a}{row + 1}"] = ("Estimates for planning only, not a mortgage approval or financial advice. "
                           "Rules as of November 2026. Confirm with your lender and lawyer.")
    ws[f"{a}{row + 1}"].font = F_NOTE
    ws[f"{a}{row + 1}"].alignment = Alignment(wrap_text=True)
    ws.row_dimensions[row + 1].height = 26


def protect(ws):
    ws.protection.sheet = True
    ws.protection.formatCells = False
    ws.protection.formatColumns = False
    ws.protection.formatRows = False


# --------------------------------------------------------------------------
# Lists (hidden): payment frequencies and land transfer tax brackets
# --------------------------------------------------------------------------
L = wb.active
L.title = "Lists"
freqs = [("Monthly", 12, 0), ("Semi-monthly", 24, 0), ("Bi-weekly", 26, 0),
         ("Accelerated bi-weekly", 26, 2), ("Weekly", 52, 0), ("Accelerated weekly", 52, 4)]
L["A1"], L["B1"], L["C1"] = "Frequency", "Payments per year", "Accelerated (monthly / x)"
for i, (n, p, a) in enumerate(freqs, start=2):
    L[f"A{i}"], L[f"B{i}"], L[f"C{i}"] = n, p, a
L["E1"], L["F1"], L["G1"] = "Ontario LTT from", "to", "rate"
on = [(0, 55000, .005), (55000, 250000, .01), (250000, 400000, .015), (400000, 2000000, .02), (2000000, 1e12, .025)]
for i, (lo, hi, r) in enumerate(on, start=2):
    L[f"E{i}"], L[f"F{i}"], L[f"G{i}"] = lo, hi, r
L["I1"], L["J1"], L["K1"] = "Toronto MLTT from", "to", "rate"
to = [(0, 55000, .005), (55000, 250000, .01), (250000, 400000, .015), (400000, 2000000, .02),
      (2000000, 3000000, .025), (3000000, 4000000, .035), (4000000, 5000000, .045),
      (5000000, 10000000, .055), (10000000, 20000000, .065), (20000000, 1e12, .075)]
for i, (lo, hi, r) in enumerate(to, start=2):
    L[f"I{i}"], L[f"J{i}"], L[f"K{i}"] = lo, hi, r
L["M1"] = "Yes/No"
L["M2"], L["M3"] = "Yes", "No"
for i, v in enumerate([1, 2, 3, 4, 5, 7, 10], start=2):
    L[f"O{i}"] = v
L["O1"] = "Terms"
for i, v in enumerate([15, 20, 25, 30], start=2):
    L[f"P{i}"] = v
L["P1"] = "Amortizations"

# --------------------------------------------------------------------------
# Start here
# --------------------------------------------------------------------------
S = wb.create_sheet("Start here", 0)
brand_top(S, "Mortgage Calculator (Ontario)", "From GB Homes Real Estate  |  " + SITE)
S.column_dimensions["B"].width = 100
lines = [
    ("How to use it", True),
    ("1.  Type your numbers in the yellow boxes. Everything else updates on its own.", False),
    ("2.  Payment tab: your mortgage payment, CMHC insurance, balance at renewal and total interest.", False),
    ("3.  Schedule tab: what you pay each year and what you still owe.", False),
    ("4.  Closing costs tab: land transfer tax (Ontario and Toronto) with first-time buyer refunds, plus other costs.", False),
    ("5.  Affordability tab: roughly how much home your income can support under the federal stress test.", False),
    ("", False),
    ("Good to know", True),
    ("Payments assume a fixed rate compounded semi-annually, as Canadian law requires for fixed-rate mortgages.", False),
    ("CMHC premiums are 2.80% to 4.00% of the mortgage depending on your down payment, plus 0.20% for a 30-year insured amortization.", False),
    ("Ontario charges 8% PST on the CMHC premium, paid in cash at closing.", False),
    ("These are estimates for planning only, not a mortgage approval or financial advice. Rules as of November 2026.", False),
    ("", False),
    ("Want me to run the numbers with you?", True),
    (f"{AGENT}  |  {BROKERAGE}", False),
    (f"Phone: {PHONE}     Email: {EMAIL}     Web: {SITE}", False),
    ("I help first-time buyers and investors across Toronto, the GTA and Durham Region buy with confidence. A free call, no pressure.", False),
]
r = 6
for text, bold in lines:
    S[f"B{r}"] = text
    S[f"B{r}"].font = Font(name="Arial", size=12 if bold else 10, bold=bold, color=RED if bold else INK)
    S[f"B{r}"].alignment = Alignment(wrap_text=True, vertical="center")
    r += 1
S[f"B{r - 3}"].font = Font(name="Arial", size=10, bold=True, color=INK)
S[f"B{r - 3}"].hyperlink = f"https://{SITE}/contact.html"
protect(S)

# --------------------------------------------------------------------------
# Payment
# --------------------------------------------------------------------------
P = wb.create_sheet("Payment", 1)
brand_top(P, "Your mortgage payment", "Type in the yellow boxes. Results update automatically.")
P.column_dimensions["B"].width = 38
P.column_dimensions["C"].width = 18
P.column_dimensions["D"].width = 58

header_band(P, 6, "Your details")
label(P, "B7", "Purchase price");               inp(P, "C7", 750000, MONEY)
label(P, "B8", "Down payment");                 inp(P, "C8", 75000, MONEY)
label(P, "B9", "Interest rate");                inp(P, "C9", 0.0429, PCT2)
label(P, "B10", "Term (years)", "When you renew. Choose 1, 2, 3, 4, 5, 7 or 10.");  inp(P, "C10", 5)
label(P, "B11", "Amortization (years)", "Choose 15, 20, 25 or 30.");              inp(P, "C11", 25)
label(P, "B12", "Payment frequency", "Pick from the list.");                     inp(P, "C12", "Monthly")
label(P, "B13", "First-time buyer or new build?", "Yes allows a 30-year insured mortgage."); inp(P, "C13", "Yes")

dv_freq = DataValidation(type="list", formula1="=Lists!$A$2:$A$7", allow_blank=False)
dv_yes = DataValidation(type="list", formula1="=Lists!$M$2:$M$3", allow_blank=False)
dv_term = DataValidation(type="list", formula1="=Lists!$O$2:$O$8", allow_blank=False)
dv_am = DataValidation(type="list", formula1="=Lists!$P$2:$P$5", allow_blank=False)
for dv, ref in [(dv_freq, "C12"), (dv_yes, "C13"), (dv_term, "C10"), (dv_am, "C11")]:
    P.add_data_validation(dv)
    dv.add(ref)

header_band(P, 15, "Your results")
label(P, "B16", "Payment");                   out(P, "C16", "=PayAmt", MONEY2, big=True)
P["D16"] = '=C12&" payment  |  "&TEXT(C22,"$#,##0")&" mortgage over "&C19&" years"'
P["D16"].font = F_NOTE
P.row_dimensions[16].height = 26
label(P, "B17", "Down payment (% of price)");  out(P, "C17", "=IFERROR(C8/C7,0)", PCT1)
label(P, "B18", "Minimum down payment for this price")
out(P, "C18", "=IF(C7>=1500000,C7*0.2,IF(C7<=500000,C7*0.05,25000+(C7-500000)*0.1))", MONEY)
P["D18"] = '=IF(C8<C18-0.5,"Too low: raise your down payment to at least "&TEXT(C18,"$#,##0"),"OK")'
P["D18"].font = Font(name="Arial", size=9, bold=True, color=RED)
label(P, "B19", "Amortization used (years)")
out(P, "C19", '=IF(AND(Insured,C11>25,C13="No"),25,C11)')
P["D19"] = '=IF(C19<>C11,"Insured mortgages are capped at 25 years unless you are a first-time buyer or buying a new build.","")'
P["D19"].font = F_NOTE
label(P, "B20", "CMHC insurance rate")
out(P, "C20", "=IF(Insured,IF((C7-C8)/C7<=0.85,0.028,IF((C7-C8)/C7<=0.9,0.031,0.04))+IF(C19>25,0.002,0),0)", PCT2)
P["D20"] = '=IF(Insured,"Under 20% down: insurance is added to your mortgage.","Not needed with 20% or more down.")'
P["D20"].font = F_NOTE
label(P, "B21", "CMHC insurance premium");     out(P, "C21", "=(C7-C8)*C20", MONEY)
P["D21"] = '=IF(C21>0,"Plus 8% Ontario PST ("&TEXT(C21*0.08,"$#,##0")&") paid in cash at closing.","")'
P["D21"].font = F_NOTE
label(P, "B22", "Mortgage amount");            out(P, "C22", "=C7-C8+C21", MONEY)
label(P, "B23", "Interest over the term")
out(P, "C23", '=SUMIFS(Schedule!$D$7:$D$46,Schedule!$B$7:$B$46,"<="&C10)', MONEY)
label(P, "B24", "Balance at renewal")
out(P, "C24", "=IFERROR(INDEX(Schedule!$E$7:$E$46,C10),0)", MONEY)
label(P, "B25", "Total interest (full amortization)"); out(P, "C25", "=SUM(Schedule!$D$7:$D$46)", MONEY)
label(P, "B26", "Mortgage-free in (years)")
out(P, "C26", "=IFERROR(NPER(PerRate,-PayAmt,C22)/PerYear,C19)", "0.0")
P["D26"] = '=IF(Accel>0,"Accelerated payments pay off your mortgage sooner than monthly.","")'
P["D26"].font = F_NOTE

header_band(P, 28, "Behind the scenes (no need to change)")
label(P, "B29", "Payments per year");         out(P, "C29", "=VLOOKUP(C12,Lists!$A$2:$C$7,2,FALSE)")
label(P, "B30", "Accelerated (monthly payment divided by)"); out(P, "C30", "=VLOOKUP(C12,Lists!$A$2:$C$7,3,FALSE)")
label(P, "B31", "Rate per payment (semi-annual compounding)"); out(P, "C31", "=(1+C9/2)^(2/C29)-1", "0.000000%")
label(P, "B32", "Rate per month");             out(P, "C32", "=(1+C9/2)^(1/6)-1", "0.000000%")
label(P, "B33", "Needs CMHC insurance?");      out(P, "C33", '=AND(C7<1500000,(C7-C8)/C7>0.8)')
label(P, "B34", "Payment")
out(P, "C34", "=IF(C30>0,PMT(C32,C19*12,-C22)/C30,PMT(C31,C19*C29,-C22))", MONEY2)
contact_footer(P, 37)

for nm, ref in [("PayAmt", "$C$34"), ("PerRate", "$C$31"), ("PerYear", "$C$29"), ("Accel", "$C$30"), ("Insured", "$C$33")]:
    wb.defined_names[nm] = DefinedName(nm, attr_text=f"Payment!{ref}")
protect(P)

# --------------------------------------------------------------------------
# Schedule
# --------------------------------------------------------------------------
Y = wb.create_sheet("Schedule", 2)
brand_top(Y, "Year-by-year schedule", "Follows the Payment tab. The shaded row is the end of your term (renewal).")
for col, w in zip("BCDE", (10, 20, 20, 20)):
    Y.column_dimensions[col].width = w
for col, t in zip("BCDE", ("Year", "Principal paid", "Interest paid", "Balance")):
    c = Y[f"{col}6"]
    c.value = t
    c.font = F_H
    c.fill = PatternFill("solid", fgColor=INK)
    c.alignment = Alignment(horizontal="center")
for k in range(1, 41):
    r = 6 + k
    prev = "Payment!$C$22" if k == 1 else f"E{r - 1}_num"
    prev_bal = "Payment!$C$22" if k == 1 else f"N(E{r - 1})"
    Y[f"B{r}"] = f'=IF({prev_bal}>0.005,{k},"")'
    bal = f"MAX(0,-FV(PerRate,{k}*PerYear,-PayAmt,Payment!$C$22))"
    Y[f"E{r}"] = f'=IF(B{r}="","",{bal})'
    Y[f"C{r}"] = f'=IF(B{r}="","",{prev_bal}-E{r})'
    Y[f"D{r}"] = (f'=IF(B{r}="","",IF(E{r}>0.005,PerYear*PayAmt-C{r},'
                  f'NPER(PerRate,-PayAmt,{prev_bal})*PayAmt-{prev_bal}))')
    for col in "BCDE":
        c = Y[f"{col}{r}"]
        c.font = F_BODY
        c.border = BOX
        c.number_format = MONEY if col != "B" else "0"
        c.alignment = Alignment(horizontal="center" if col == "B" else "right")
from openpyxl.formatting.rule import FormulaRule  # noqa: E402
Y.conditional_formatting.add("B7:E46", FormulaRule(formula=["$B7=Payment!$C$10"],
                             fill=PatternFill("solid", fgColor="FDE8E8"), font=Font(bold=True)))
contact_footer(Y, 48, "B:E")
protect(Y)

# --------------------------------------------------------------------------
# Closing costs
# --------------------------------------------------------------------------
Cc = wb.create_sheet("Closing costs", 3)
brand_top(Cc, "Cash you'll need on closing day", "Price, down payment and first-time buyer start from the Payment tab. Type over them to change.")
Cc.column_dimensions["B"].width = 40
Cc.column_dimensions["C"].width = 18
Cc.column_dimensions["D"].width = 50
header_band(Cc, 6, "Your details")
label(Cc, "B7", "Purchase price");             inp(Cc, "C7", "=Payment!C7", MONEY)
label(Cc, "B8", "Down payment");               inp(Cc, "C8", "=Payment!C8", MONEY)
label(Cc, "B9", "First-time buyer?", "Ontario refund up to $4,000; Toronto up to $4,475."); inp(Cc, "C9", "=Payment!C13")
label(Cc, "B10", "Home is in the City of Toronto?", "Adds the Toronto municipal land transfer tax."); inp(Cc, "C10", "No")
label(Cc, "B11", "Lawyer & disbursements");    inp(Cc, "C11", 2000, MONEY)
label(Cc, "B12", "Title insurance");           inp(Cc, "C12", 350, MONEY)
label(Cc, "B13", "Home inspection");           inp(Cc, "C13", 550, MONEY)
label(Cc, "B14", "Adjustments & misc.");       inp(Cc, "C14", 750, MONEY)
for ref in ("C9", "C10"):
    dv = DataValidation(type="list", formula1="=Lists!$M$2:$M$3", allow_blank=False)
    Cc.add_data_validation(dv)
    dv.add(ref)

# helper columns on Lists for bracket tax
for i in range(2, 7):
    L[f"H{i}"] = f"=MAX(0,MIN('Closing costs'!$C$7,F{i})-E{i})*G{i}"
for i in range(2, 12):
    L[f"L{i}"] = f"=MAX(0,MIN('Closing costs'!$C$7,J{i})-I{i})*K{i}"

header_band(Cc, 16, "Breakdown")
rows = [
    ("Ontario land transfer tax", "=SUM(Lists!$H$2:$H$6)"),
    ("Ontario first-time buyer refund", '=IF(C9="Yes",-MIN(C17,4000),0)'),
    ("Toronto municipal land transfer tax", '=IF(C10="Yes",SUM(Lists!$L$2:$L$11),0)'),
    ("Toronto first-time buyer rebate", '=IF(AND(C9="Yes",C10="Yes"),-MIN(C19,4475),0)'),
    ("PST on CMHC insurance (8%)",
     "=IF(AND(C7<1500000,(C7-C8)/C7>0.8),(C7-C8)*IF((C7-C8)/C7<=0.85,0.028,IF((C7-C8)/C7<=0.9,0.031,0.04))*0.08,0)"),
    ("Lawyer & disbursements", "=C11"),
    ("Title insurance", "=C12"),
    ("Home inspection", "=C13"),
    ("Adjustments & misc.", "=C14"),
]
r = 17
for name, f in rows:
    label(Cc, f"B{r}", name)
    out(Cc, f"C{r}", f, MONEY)
    r += 1
label(Cc, "B26", "Closing costs");  out(Cc, "C26", "=SUM(C17:C25)", MONEY)
Cc["D26"] = '=TEXT(IFERROR(C26/C7,0),"0.0%")&" of the price"'
Cc["D26"].font = F_NOTE
label(Cc, "B27", "Down payment");   out(Cc, "C27", "=C8", MONEY)
label(Cc, "B28", "Total cash needed on closing day"); out(Cc, "C28", "=C26+C27", MONEY, big=True)
Cc.row_dimensions[28].height = 26
for rr in (26, 28):
    Cc[f"B{rr}"].font = Font(name="Arial", size=10, bold=True, color=INK)
Cc["B30"] = "Tip: plan for closing costs of about 1.5% to 4% of the price on top of your down payment."
Cc["B30"].font = F_NOTE
contact_footer(Cc, 32)
protect(Cc)

# --------------------------------------------------------------------------
# Affordability (+ hidden price grid)
# --------------------------------------------------------------------------
A = wb.create_sheet("Affordability", 4)
brand_top(A, "How much home could you afford?", "Uses the federal stress test and lender limits (GDS 39%, TDS 44%).")
A.column_dimensions["B"].width = 40
A.column_dimensions["C"].width = 18
A.column_dimensions["D"].width = 55
header_band(A, 6, "Your finances")
label(A, "B7", "Household income (before tax, yearly)"); inp(A, "C7", 130000, MONEY)
label(A, "B8", "Down payment saved");          inp(A, "C8", 60000, MONEY)
label(A, "B9", "Monthly debt payments", "Car, student loan, credit cards."); inp(A, "C9", 400, MONEY)
label(A, "B10", "Interest rate");              inp(A, "C10", 0.0429, PCT2)
label(A, "B11", "Amortization (years)", "25 or 30.");  inp(A, "C11", 30)
label(A, "B12", "Property tax (% of price per year)"); inp(A, "C12", 0.0095, PCT2)
label(A, "B13", "Heating per month");          inp(A, "C13", 120, MONEY)
label(A, "B14", "Condo fees per month", "0 if not a condo."); inp(A, "C14", 0, MONEY)
label(A, "B15", "First-time buyer?");          inp(A, "C15", "Yes")
dv = DataValidation(type="list", formula1="=Lists!$M$2:$M$3", allow_blank=False)
A.add_data_validation(dv); dv.add("C15")
dv = DataValidation(type="list", formula1='"25,30"', allow_blank=False)
A.add_data_validation(dv); dv.add("C11")

G = wb.create_sheet("AffordGrid")
heads = ["Price", "Down used", "Min down", "Down OK", "Insured", "Amort", "Ins rate", "Loan",
         "Stress payment", "Housing", "GDS", "TDS", "Passes", "OK price"]
for i, h in enumerate(heads):
    G.cell(row=1, column=i + 1, value=h)
N = 581  # $100,000 to $3,000,000 in $5,000 steps
for k in range(N):
    r = k + 2
    G[f"A{r}"] = 100000 + 5000 * k
    G[f"B{r}"] = f"=MIN(Affordability!$C$8,A{r})"
    G[f"C{r}"] = f"=IF(A{r}>=1500000,A{r}*0.2,IF(A{r}<=500000,A{r}*0.05,25000+(A{r}-500000)*0.1))"
    G[f"D{r}"] = f"=B{r}>=C{r}-0.5"
    G[f"E{r}"] = f"=AND(A{r}<1500000,(A{r}-B{r})/A{r}>0.8)"
    G[f"F{r}"] = f'=IF(AND(E{r},Affordability!$C$11>25,Affordability!$C$15="No"),25,Affordability!$C$11)'
    G[f"G{r}"] = (f"=IF(E{r},IF((A{r}-B{r})/A{r}<=0.85,0.028,IF((A{r}-B{r})/A{r}<=0.9,0.031,0.04))"
                  f"+IF(F{r}>25,0.002,0),0)")
    G[f"H{r}"] = f"=(A{r}-B{r})*(1+G{r})"
    G[f"I{r}"] = f"=IF(H{r}<=0,0,PMT(Affordability!$C$31,F{r}*12,-H{r}))"
    G[f"J{r}"] = f"=I{r}+A{r}*Affordability!$C$12/12+Affordability!$C$13+Affordability!$C$14*0.5"
    G[f"K{r}"] = f"=J{r}/(Affordability!$C$7/12)"
    G[f"L{r}"] = f"=(J{r}+Affordability!$C$9)/(Affordability!$C$7/12)"
    G[f"M{r}"] = f"=AND(D{r},K{r}<=0.39,L{r}<=0.44)"
    G[f"N{r}"] = f"=IF(M{r},A{r},0)"
last = N + 1
rng = lambda c: f"AffordGrid!${c}$2:${c}${last}"  # noqa: E731

header_band(A, 17, "Your results")
label(A, "B18", "You could afford a home up to about")
out(A, "C18", f"=IF(Affordability!$C$7<=0,0,MAX({rng('N')}))", MONEY, big=True)
A.row_dimensions[18].height = 26
A["D18"] = '=IF(C18=0,"Enter your income and down payment to see an estimate.","With "&TEXT(C19,"$#,##0")&" down ("&TEXT(C19/C18,"0.0%")&")")'
A["D18"].font = F_NOTE
lk = lambda c: f"=IFERROR(INDEX({rng(c)},MATCH($C$18,{rng('A')},0)),0)"  # noqa: E731
label(A, "B19", "Down payment used");   out(A, "C19", lk("B"), MONEY)
label(A, "B20", "Mortgage amount");     out(A, "C20", lk("H"), MONEY)
label(A, "B21", "Monthly payment at your rate")
out(A, "C21", f"=IF(C20<=0,0,PMT((1+C10/2)^(1/6)-1,IFERROR(INDEX({rng('F')},MATCH($C$18,{rng('A')},0)),C11)*12,-C20))", MONEY)
label(A, "B22", "Stress-test rate", "The higher of your rate + 2% or 5.25%."); out(A, "C22", "=MAX(C10+0.02,0.0525)", PCT2)
label(A, "B23", "GDS ratio (max 39%)"); out(A, "C23", lk("K"), PCT1)
label(A, "B24", "TDS ratio (max 44%)"); out(A, "C24", lk("L"), PCT1)
A["B26"] = (f'=IF(AND(C18>0,IFERROR(NOT(INDEX({rng("D")},MATCH(C18,{rng("A")},0)+1)),FALSE)),'
            '"Your down payment is what limits you here, not your income. Saving more, or using an FHSA or the RRSP Home Buyers\' Plan, would raise your maximum.","")')
A["B26"].font = Font(name="Arial", size=9, bold=True, color="8A5300")
A.merge_cells("B26:D26")
A["B26"].alignment = Alignment(wrap_text=True)
A.row_dimensions[26].height = 28
A["B27"] = ("This is an estimate. Your actual approval depends on your credit, employment and the lender. "
            "A pre-approval gives you the real number, and I can connect you with a mortgage professional.")
A["B27"].font = F_NOTE
A.merge_cells("B27:D27")
A["B27"].alignment = Alignment(wrap_text=True)
A.row_dimensions[27].height = 28
label(A, "B30", "Stress-test rate per month (behind the scenes)")
out(A, "C31", "=(1+C22/2)^(1/6)-1", "0.000000%")
A["B30"].value = None
A["B31"] = "Stress-test rate per month (behind the scenes)"
A["B31"].font = F_NOTE
contact_footer(A, 33)
protect(A)

for ws in (L, G):
    ws.sheet_state = "hidden"
    protect(ws)

for ws in (S, P, Y, Cc, A):
    ws.page_setup.orientation = "portrait"
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.sheet_properties.tabColor = RED if ws is S else INK

wb.active = 0
wb.calculation.fullCalcOnLoad = True
wb.properties.title = "GB Homes Mortgage Calculator"
wb.properties.creator = "GB Homes Real Estate"
wb.save(OUT)
print("saved", OUT)
