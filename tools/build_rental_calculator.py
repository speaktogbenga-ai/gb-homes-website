"""Builds assets/downloads/GB-Homes-Rental-Calculator.xlsx

A branded Excel version of the rental property (cash-flow) calculator on the
Investors page, with live formulas that follow the same rules as
js/investor.js and js/finance.js (Canadian semi-annual compounding, CMHC
premiums for owner-occupied purchases, Ontario land transfer tax).

Run from the repository root:  python3 tools/build_rental_calculator.py
Needs: pip install openpyxl pillow
"""
from openpyxl import Workbook
from openpyxl.drawing.image import Image as XLImage
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side, Protection
from openpyxl.worksheet.datavalidation import DataValidation

OUT = "assets/downloads/GB-Homes-Rental-Calculator.xlsx"
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
thin = Side(style="thin", color=LINE)
BOX = Border(left=thin, right=thin, top=thin, bottom=thin)

MONEY = '"$"#,##0'
MONEY_SIGNED = '"$"#,##0;[Red]-"$"#,##0'
PCT2 = "0.00%"
PCT1 = "0.0%"

wb = Workbook()


def header_band(ws, row, text):
    ws.merge_cells(f"B{row}:D{row}")
    c = ws[f"B{row}"]
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
        r = ref[1:]
        ws[f"D{r}"] = note
        ws[f"D{r}"].font = F_NOTE
        ws[f"D{r}"].alignment = Alignment(vertical="center", wrap_text=True)


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


def note(ws, ref, formula, color=None, bold=False):
    ws[ref] = formula
    ws[ref].font = Font(name="Arial", size=9, italic=not bold, bold=bold, color=color or "5F6368")
    ws[ref].alignment = Alignment(vertical="center", wrap_text=True)


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


def contact_footer(ws, row):
    ws.merge_cells(f"B{row}:D{row}")
    ws[f"B{row}"] = f"Questions? {AGENT}  |  {BROKERAGE}  |  {PHONE}  |  {EMAIL}  |  {SITE}"
    ws[f"B{row}"].font = Font(name="Arial", size=10, bold=True, color=RED)
    ws.merge_cells(f"B{row + 1}:D{row + 1}")
    ws[f"B{row + 1}"] = ("Estimates for planning only, not financial, tax or mortgage advice. Rules as of November 2026. "
                         "Confirm with your lender, lawyer and accountant.")
    ws[f"B{row + 1}"].font = F_NOTE
    ws[f"B{row + 1}"].alignment = Alignment(wrap_text=True)
    ws.row_dimensions[row + 1].height = 26


def protect(ws):
    ws.protection.sheet = True
    ws.protection.formatCells = False
    ws.protection.formatColumns = False
    ws.protection.formatRows = False


# --------------------------------------------------------------------------
# Lists (hidden): Ontario land transfer tax brackets and dropdown values
# --------------------------------------------------------------------------
L = wb.active
L.title = "Lists"
L["A1"], L["B1"], L["C1"], L["D1"] = "Ontario LTT from", "to", "rate", "tax in bracket"
on = [(0, 55000, .005), (55000, 250000, .01), (250000, 400000, .015), (400000, 2000000, .02), (2000000, 1e12, .025)]
for i, (lo, hi, r) in enumerate(on, start=2):
    L[f"A{i}"], L[f"B{i}"], L[f"C{i}"] = lo, hi, r
    L[f"D{i}"] = f"=MAX(0,MIN(Rental!$C$7,B{i})-A{i})*C{i}"
L["F1"], L["F2"], L["F3"] = "Plan", "Rent it all out", "Live in part of it"
L["G1"], L["G2"], L["G3"] = "Amortization", 25, 30

# --------------------------------------------------------------------------
# Start here
# --------------------------------------------------------------------------
S = wb.create_sheet("Start here", 0)
brand_top(S, "Rental Property Calculator (Ontario)", "From GB Homes Real Estate  |  " + SITE)
S.column_dimensions["B"].width = 100
lines = [
    ("How to use it", True),
    ("1.  Open the Rental tab and type your numbers in the yellow boxes. Everything else updates on its own.", False),
    ("2.  You'll see the monthly cash flow, cap rate, cash-on-cash return, DSCR, equity built and the cash you need to buy.", False),
    ("3.  Comparing properties? Right-click the Rental tab, choose Move or Copy, tick Create a copy, and use one tab per property.", False),
    ("", False),
    ("Good to know", True),
    ("Rentals you won't live in need at least 20% down. If you live in part of the home (a house hack), the normal minimums and CMHC insurance apply.", False),
    ("Payments assume a fixed rate compounded semi-annually, as Canadian law requires for fixed-rate mortgages.", False),
    ("Cash needed includes the down payment, Ontario land transfer tax (no first-time refund) and about $3,500 in legal and other closing costs.", False),
    ("Cash flow is before income tax. Rent, vacancy and expenses are your own assumptions, so be conservative.", False),
    ("These are estimates for planning only, not financial, tax or mortgage advice. Rules as of November 2026.", False),
    ("", False),
    ("Want a second set of eyes on a property?", True),
    (f"{AGENT}  |  {BROKERAGE}", False),
    (f"Phone: {PHONE}     Email: {EMAIL}     Web: {SITE}", False),
    ("I run the cash flow, cap rate and financing with investors before they make an offer, so they buy on numbers, not hope. A free call, no pressure.", False),
]
r = 6
for text, bold in lines:
    S[f"B{r}"] = text
    S[f"B{r}"].font = Font(name="Arial", size=12 if bold else 10, bold=bold, color=RED if bold else INK)
    S[f"B{r}"].alignment = Alignment(wrap_text=True, vertical="center")
    r += 1
S[f"B{r - 2}"].font = Font(name="Arial", size=10, bold=True, color=INK)
S[f"B{r - 2}"].hyperlink = f"https://{SITE}/contact.html"
protect(S)

# --------------------------------------------------------------------------
# Rental calculator
# --------------------------------------------------------------------------
R = wb.create_sheet("Rental", 1)
brand_top(R, "Rental property cash flow", "Type in the yellow boxes. Results update automatically.")
R.column_dimensions["B"].width = 40
R.column_dimensions["C"].width = 18
R.column_dimensions["D"].width = 60

header_band(R, 6, "The property")
label(R, "B7", "Purchase price");                 inp(R, "C7", 850000, MONEY)
label(R, "B8", "Down payment (% of price)", "At least 20% if you won't live there.");  inp(R, "C8", 0.20, PCT1)
label(R, "B9", "Interest rate");                  inp(R, "C9", 0.0449, PCT2)
label(R, "B10", "Amortization (years)", "25 or 30.");  inp(R, "C10", 30)
label(R, "B11", "I will", "Pick from the list.");   inp(R, "C11", "Rent it all out")
label(R, "B12", "Total monthly rent", "All units you'll rent."); inp(R, "C12", 4300, MONEY)
label(R, "B13", "Vacancy (% of rent)");          inp(R, "C13", 0.03, PCT1)
label(R, "B14", "Property management (% of collected rent)", "0% if you manage it yourself."); inp(R, "C14", 0, PCT1)
label(R, "B15", "Property tax per year");        inp(R, "C15", 7000, MONEY)
label(R, "B16", "Insurance per year");           inp(R, "C16", 2100, MONEY)
label(R, "B17", "Maintenance & repairs (% of rent)"); inp(R, "C17", 0.05, PCT1)
label(R, "B18", "Other per month", "Utilities you pay, condo fees."); inp(R, "C18", 0, MONEY)
for formula, ref in [("=Lists!$F$2:$F$3", "C11"), ("=Lists!$G$2:$G$3", "C10")]:
    dv = DataValidation(type="list", formula1=formula, allow_blank=False)
    R.add_data_validation(dv)
    dv.add(ref)

header_band(R, 20, "Your results")
label(R, "B21", "Monthly cash flow");            out(R, "C21", "=C42-C33", MONEY_SIGNED, big=True)
R.row_dimensions[21].height = 26
note(R, "D21", '=TEXT(C21*12,"$#,##0;-$#,##0")&" a year  |  mortgage "&TEXT(C33,"$#,##0")&"/mo on "&TEXT(C32,"$#,##0")')
label(R, "B22", "Cap rate");                      out(R, "C22", "=IFERROR(C42*12/C7,0)", PCT2)
note(R, "D22", '=IF(C22>=0.04,"Good: 4% or more is a common GTA benchmark.","Below 4%: the price is high for the rent.")')
label(R, "B23", "Cash-on-cash return");          out(R, "C23", "=IFERROR(C21*12/C27,0)", PCT1)
note(R, "D23", "Yearly cash flow divided by the cash you put in.")
label(R, "B24", "DSCR (debt service coverage)"); out(R, "C24", "=IFERROR(C42/C33,0)", "0.00")
note(R, "D24", '=IF(C24>=1,"Rent covers the mortgage. Many lenders look for 1.2 or more.","Below 1.0: rent does not cover the mortgage.")')
label(R, "B25", "Equity built, year 1");         out(R, "C25", "=C32-FV(C31,12,C33,-C32)", MONEY)
note(R, "D25", "The part of your payments that pays down the mortgage in the first year.")
label(R, "B26", "Total return, year 1");         out(R, "C26", "=IFERROR((C21*12+C25)/C27,0)", PCT1)
note(R, "D26", "Cash flow plus equity built, divided by the cash you put in.")
label(R, "B27", "Cash needed to buy");           out(R, "C27", "=C29+C35+3500+IF(C30>0,(C7-C29)*C30*0.08,0)", MONEY)
note(R, "D27", "Down payment + Ontario land transfer tax + about $3,500 legal and other costs.")
note(R, "B28", ('=IF(C29<C34-0.5,IF(C11="Rent it all out","Rentals you won\'t live in need at least 20% down.",'
                '"Minimum down payment at this price is "&TEXT(C34,"$#,##0")&"."),'
                'IF(AND(C21<0,C12>0),"This property loses money each month at these numbers. You\'d need about "&'
                'TEXT(C43,"$#,##0")&" in monthly rent to break even.",""))'), color="B81414", bold=True)
R.merge_cells("B28:D28")
R.row_dimensions[28].height = 28

label(R, "B29", "Down payment ($)");             out(R, "C29", "=C7*C8", MONEY)
label(R, "B30", "CMHC insurance rate")
out(R, "C30", ('=IF(AND(C11="Live in part of it",C7<1500000,(C7-C29)/C7>0.8),'
               'IF((C7-C29)/C7<=0.85,0.028,IF((C7-C29)/C7<=0.9,0.031,0.04))+IF(C10>25,0.002,0),0)'), PCT2)
note(R, "D30", '=IF(C30>0,"House hack with under 20% down: insurance is added to the mortgage.","Not needed.")')
label(R, "B31", "Rate per month (semi-annual compounding)"); out(R, "C31", "=(1+C9/2)^(1/6)-1", "0.000000%")
label(R, "B32", "Mortgage amount");              out(R, "C32", "=(C7-C29)*(1+C30)", MONEY)
label(R, "B33", "Mortgage payment per month");   out(R, "C33", "=IF(C32<=0,0,PMT(C31,C10*12,-C32))", MONEY)
label(R, "B34", "Minimum down payment")
out(R, "C34", '=IF(C11="Rent it all out",C7*0.2,IF(C7>=1500000,C7*0.2,IF(C7<=500000,C7*0.05,25000+(C7-500000)*0.1)))', MONEY)
label(R, "B35", "Ontario land transfer tax");    out(R, "C35", "=SUM(Lists!$D$2:$D$6)", MONEY)

header_band(R, 36, "Monthly breakdown")
label(R, "B37", "Vacancy");                       out(R, "C37", "=C12*C13", MONEY)
label(R, "B38", "Management");                    out(R, "C38", "=(C12-C37)*C14", MONEY)
label(R, "B39", "Maintenance & repairs");         out(R, "C39", "=C12*C17", MONEY)
label(R, "B40", "Property tax + insurance per month"); out(R, "C40", "=(C15+C16)/12", MONEY)
label(R, "B41", "Operating costs per month");     out(R, "C41", "=C38+C39+C40+C18", MONEY)
label(R, "B42", "Net operating income per month"); out(R, "C42", "=C12-C37-C41", MONEY_SIGNED)
label(R, "B43", "Rent needed to break even")
out(R, "C43", "=IFERROR((C40+C18+C33)/(1-C13-(1-C13)*C14-C17),0)", MONEY)
contact_footer(R, 46)
protect(R)

L.sheet_state = "hidden"
protect(L)
for ws in (S, R):
    ws.page_setup.orientation = "portrait"
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.sheet_properties.tabColor = RED if ws is S else INK

wb.active = 0
wb.calculation.fullCalcOnLoad = True
wb.properties.title = "GB Homes Rental Property Calculator"
wb.properties.creator = "GB Homes Real Estate"
wb.save(OUT)
print("saved", OUT)
