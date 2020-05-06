import { Chart } from './genChart.js';

Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

var param = {
    MAX_INTERVAL_TIME: 170,
    MIN_INTERVAL_TIME: 1,
    LOW_FREQ: 100,
    HIGH_FREQ: 1000,
}

var chart = new Chart(param);
var init = false;

function begin() {
    var request_params = {
        "function": "TIME_SERIES_DAILY",
        "symbol": chart.ticker,
        "outputsize": "full",
        "datatype": "json",
        "apikey": "I7JY3EYLKK5LRI8L"
    };
    var base_url = "https://www.alphavantage.co/query";
    var params = Object.keys(request_params)
        .map(key => key + '=' + request_params[key])
        .join('&');
    var queryUrl = base_url + '?' + params;

    fetch(queryUrl)
        .then(resp => resp.json())
        .then(rawData => {
            chart.feed = Object.entries(rawData["Time Series (Daily)"])
                .map(([date, obj]) => ({
                    date: chart.parseDate(date),
                    open: +obj["1. open"],
                    high: +obj["2. high"],
                    low: +obj["3. low"],
                    close: +obj["4. close"],
                    volume: +obj["5. volume"]
                }))
                .reverse();
            chart.data = chart.feed.slice(0, 150);
            console.log("test", chart.data);
            chart.isPlaying = false;
            chart.setScale(chart.feed);
            chart.redraw();
            if (!init) {
                let button = document.getElementById('togglePlay');
                button.addEventListener('click', () => chart.playPause());
                button.hidden = false;
                document.getElementById('chart').hidden = false;
                document.getElementById('proceduralCanvas').hidden = false;
                init = true;
            }
        })
        .catch(error => { document.getElementById('chart').innerHTML = error; });
}

(function main(){
    var ticker = document.getElementById('ticker-input');
    var comboplete_ticker = new Awesomplete(ticker, {
        minChars: 0,
    });
    ticker.addEventListener("awesomplete-select", function(e) {
        if (chart.isPlaying) {
            chart.playPause();
        }
        chart.feed = [];
        chart.data = [];
        chart.ticker = e.text.value;
        begin();
    }, false);    
    document.getElementById("ticker-btn")
            .addEventListener("click", function() {
        if (comboplete_ticker.ul.childNodes.length === 0) {
            comboplete_ticker.minChars = 0;
            comboplete_ticker.evaluate();
        }
        else if (comboplete_ticker.ul.hasAttribute('hidden')) {
            comboplete_ticker.open();
        }
        else {
            comboplete_ticker.close();
        }
    });

    var exchange = document.getElementById('exchange-input');
    var comboplete_exchange = new Awesomplete(exchange, {
        minChars: 0,
        list: [
            { label: "NYSE American", value: "AMEX" },
            { label: "NASDAQ", value: "NASDAQ" },
            { label: "National Stock Exchange of India", value: "NSE" },
            { label: "New York Stock Exchange", value: "NYSE" },
            { label: "Six Swiss Exchange", value: "SWX" },
            { label: "Toronto Stock Exchange", value: "TSX" },
        ]
    });
    exchange.addEventListener("awesomplete-select", function(e) {
            var url = 'https://dumbstockapi.com/stock?format=tickers-only&exchange=';
            url += e.text.value;
            fetch(url)
                .then(resp => resp.json())
                .then(rawData => {
                    ticker.innerText = "";
                    comboplete_ticker.list = rawData;
                })
                .catch(error => { document.getElementById('chart').innerHTML = error; });
    }, false);
    document.getElementById("exchange-btn")
            .addEventListener("click", function() {
        if (comboplete_exchange.ul.childNodes.length === 0) {
            comboplete_exchange.minChars = 0;
            comboplete_exchange.evaluate();
        }
        else if (comboplete_exchange.ul.hasAttribute('hidden')) {
            comboplete_exchange.open();
        }
        else {
            comboplete_exchange.close();
        }
    });
})();