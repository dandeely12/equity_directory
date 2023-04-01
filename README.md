# equity_directory
Stocks ideas using fundamental and technical analysis

this directory is for a report which will run stocks through a series of filters to produce a daily report.
the flow will be as follows:

1. Pull fundamental analysis data on all the stocks in the S&P 500

2. Filter these stocks for "good companies" based on criteria within fundamental analhysis data. 

Produces CSV of "good fundamental companies" (called gfc.csv)

3. Take gfc.csv, and run through filter using technical anlayis data pulled on the stocks

Prodces CSV of "good fundamental companies, that are ALSO 'buy' candidates based on technical analysis"

produces csv goodft.csv
