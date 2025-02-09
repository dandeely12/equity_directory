#this pulls the top 20 posts from wall street bets over the last 100 days
#scrapes them for mentions of stock tickers, and counts the mentions per ticker
#assigns them a sentiment score based on the language surrounding them
#orders them by most mentions or highest scores
#fires that list to my email

import praw
import re
import csv
import sqlite3
from datetime import datetime, timedelta
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

# Reddit API credentials
CLIENT_ID = "Qe3rtA00P66zqnpt0ZRy8A"
CLIENT_SECRET = "rv543UlnpX_pEGy8YTg8ncTog064lQ"
USER_AGENT = "stock_scraper (by u/greedy_stanley)"

# Regular expression to match stock tickers
TICKER_PATTERN = r'\b[A-Z]{1,5}\b'

# Initialize VADER sentiment analyzer
analyzer = SentimentIntensityAnalyzer()

def authenticate_reddit():
    try:
        print("Authenticating with Reddit...")
        reddit = praw.Reddit(
            client_id=CLIENT_ID,
            client_secret=CLIENT_SECRET,
            user_agent=USER_AGENT
        )
        print(f"Authenticated as: {reddit.user.me()}")
        return reddit
    except Exception as e:
        print(f"Authentication failed: {e}")
        return None

def fetch_tickers_with_sentiment(reddit):
    try:
        print("Fetching top posts from WallStreetBets for the past 30 days...")
        subreddit = reddit.subreddit("wallstreetbets")

        today = datetime.utcnow()
        start_date = today - timedelta(days=30)

        tickers = {}
        for post in subreddit.top(time_filter="month", limit=1000):
            # Check if the post was created within the last 30 days
            post_time = datetime.utcfromtimestamp(post.created_utc)
            if post_time < start_date:
                continue

            # Combine title and body text
            content = post.title
            if post.is_self:
                content += " " + post.selftext

            # Extract tickers and analyze sentiment
            matches = re.findall(TICKER_PATTERN, content)
            for ticker in matches:
                if len(ticker) <= 5:  # Stock tickers are 1–5 characters long
                    print(f"Processing ticker: {ticker}")
                    # Find context around the ticker
                    context_matches = re.finditer(rf"\b{ticker}\b", content)
                    for match in context_matches:
                        # Extract a 10-word window around the ticker
                        start = max(match.start() - 50, 0)
                        end = min(match.end() + 50, len(content))
                        context = content[start:end]

                        # Analyze sentiment for the specific context
                        sentiment = analyzer.polarity_scores(context)["compound"]
                        score = (sentiment + 1) * 5  # Scale sentiment to 0–10

                        if ticker not in tickers:
                            tickers[ticker] = {}
                        if post_time not in tickers[ticker]:
                            tickers[ticker][post_time] = {"mentions": 0, "total_score": 0.0}
                        tickers[ticker][post_time]["mentions"] += 1
                        tickers[ticker][post_time]["total_score"] += score

        # Prepare ticker results with average sentiment per post_date
        ticker_results = []
        for ticker, dates in tickers.items():
            for post_date, data in dates.items():
                avg_sentiment = data["total_score"] / data["mentions"]
                ticker_results.append({
                    "ticker": ticker,
                    "mentions": data["mentions"],
                    "sentiment": avg_sentiment,  # Use 'sentiment' as the column name
                    "post_date": post_date
                })

        # Sort by mentions and sentiment score (highest mentions first, then highest sentiment)
        ticker_results = sorted(
            ticker_results,
            key=lambda x: (x["mentions"], x["sentiment"]),
            reverse=True
        )

        print(f"Found {len(ticker_results)} unique tickers with sentiment analysis.")
        return ticker_results

    except Exception as e:
        print(f"Failed to fetch tickers and sentiment: {e}")
        return []

def save_to_csv(ticker_data):
    try:
        print("Saving data to CSV...")
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        csv_filename = f"/Users/ddeely/data/wsb_stock_csv_data_{timestamp}.csv"
        with open(csv_filename, mode='w', newline='') as file:
            writer = csv.writer(file)
            writer.writerow(["run_date", "ticker", "mention_count", "sentiment", "post_date"])

            run_date = datetime.utcnow().date()
            for data in ticker_data:
                writer.writerow([run_date, data["ticker"], data["mentions"], data["sentiment"], data["post_date"]])

        print(f"Data saved to CSV successfully at {csv_filename}!")

    except Exception as e:
        print(f"Failed to save data to CSV: {e}")

def save_to_db(ticker_data):
    try:
        print("Saving data to SQLite database...")
        conn = sqlite3.connect('/Users/ddeely/Projects/wsb_stock_database/wsb_stock_data.db')
        cursor = conn.cursor()

        run_date = datetime.utcnow()
        for data in ticker_data:
            print(f"Inserting data: {data}")
            cursor.execute('''
                INSERT INTO wsb_ticker_raw (created_on, ticker, mention_count, sentiment, post_date)
                VALUES (?, ?, ?, ?, ?)
            ''', (run_date, data["ticker"], data["mentions"], data["sentiment"], data["post_date"]))

        conn.commit()
        conn.close()
        print("Data saved to SQLite database successfully!")

    except Exception as e:
        print(f"Failed to save data to SQLite database: {e}")

# Main workflow
if __name__ == "__main__":
    print("Starting script...")
    reddit = authenticate_reddit()
    if reddit:
        ticker_data = fetch_tickers_with_sentiment(reddit)
        print("\nTicker data with sentiment scores:")
        for data in ticker_data:
            print(f"{data['ticker']}: {data['mentions']} mentions, Sentiment: {data['sentiment']:.2f}/10, Post Date: {data['post_date']}")
        save_to_csv(ticker_data)
        save_to_db(ticker_data)
    else:
        print("Reddit authentication failed.")

