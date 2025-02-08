import praw
import re
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
        print("Fetching top 100 posts from WallStreetBets...")
        subreddit = reddit.subreddit("wallstreetbets")

        today = datetime.utcnow()
        yesterday = today - timedelta(days=1)

        tickers = {}
        for post in subreddit.top(time_filter="day", limit=100):
            # Check if the post was created today
            post_time = datetime.utcfromtimestamp(post.created_utc)
            if post_time < yesterday:
                continue

            # Combine title and body text
            content = post.title
            if post.is_self:
                content += " " + post.selftext

            # Extract tickers and analyze sentiment
            matches = re.findall(TICKER_PATTERN, content)
            for ticker in matches:
                if len(ticker) <= 5:  # Stock tickers are 1–5 characters long
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
                            tickers[ticker] = {"mentions": 0, "total_score": 0.0}
                        tickers[ticker]["mentions"] += 1
                        tickers[ticker]["total_score"] += score

        # Calculate average sentiment score for each ticker
        ticker_results = [
            {
                "ticker": ticker,
                "mentions": data["mentions"],
                "avg_sentiment": data["total_score"] / data["mentions"]
            }
            for ticker, data in tickers.items()
        ]

        # Sort by mentions and sentiment score (highest mentions first, then highest sentiment)
        ticker_results = sorted(
            ticker_results,
            key=lambda x: (x["mentions"], x["avg_sentiment"]),
            reverse=True
        )

        print(f"Found {len(ticker_results)} unique tickers with sentiment analysis.")
        return ticker_results

    except Exception as e:
        print(f"Failed to fetch tickers and sentiment: {e}")
        return []

def send_email_with_sentiment(ticker_data):
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    # Email credentials
    SMTP_SERVER = "smtp.gmail.com"
    SMTP_PORT = 587
    EMAIL = "dandeely12@gmail.com"
    EMAIL_APP_PASSWORD = "jdih evhy onbr wfkd"
    RECIPIENT = "dandeely12@gmail.com"

    try:
        print("Preparing email content...")
        # Create email content
        message = MIMEMultipart("alternative")
        message["Subject"] = "Daily Stock Tickers with Sentiment Analysis"
        message["From"] = EMAIL
        message["To"] = RECIPIENT

        # Format tickers into a readable string
        ticker_list = "\n".join(
            [
                f"{data['ticker']}: {data['mentions']} mentions, Sentiment: {data['avg_sentiment']:.2f}/10"
                for data in ticker_data
            ]
        )
        email_body = f"Top stock tickers discussed on WallStreetBets today:\n\n{ticker_list}"

        # Attach plain text
        message.attach(MIMEText(email_body, "plain"))

        # Send email using Gmail's SMTP server
        print("Sending email...")
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()  # Secure the connection
            server.login(EMAIL, EMAIL_APP_PASSWORD)
            server.sendmail(EMAIL, RECIPIENT, message.as_string())

        print("Email sent successfully!")

    except Exception as e:
        print(f"Failed to send email: {e}")

# Main workflow
if __name__ == "__main__":
    print("Starting script...")
    reddit = authenticate_reddit()
    if reddit:
        ticker_data = fetch_tickers_with_sentiment(reddit)
        print("\nTicker data with sentiment scores:")
        for data in ticker_data:
            print(f"{data['ticker']}: {data['mentions']} mentions, Sentiment: {data['avg_sentiment']:.2f}/10")
        send_email_with_sentiment(ticker_data)
    else:
        print("Reddit authentication failed.")

