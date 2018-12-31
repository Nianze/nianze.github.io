const data = {
    "function": "TIME_SERIES_DAILY",
    "symbol": "MSFT",
    "outputsize": "compact",
    "datatype": "json",
    "apikey": "I7JY3EYLKK5LRI8L"
}
const url = "https://www.alphavantage.co/query"
var queryString = Object.keys(data).map(key => key + '=' + data[key]).join('&');
var queryUrl = url + '?' + queryString;


document.getElementById("query").innerHTML = queryUrl;
fetch(queryUrl)
	.then(data => {return data.json()})
	.then(res => {
		document.getElementById("demo").innerHTML = res["Meta Data"]["1. Information"]; 
		console.log(res); })
	.catch(error => {document.getElementById("demo").innerHTML = error;});


// test wavesurfer.
var wavesurfer = WaveSurfer.create({
    container: "#waveform",
    waveColor: 'blue',
    progressColor: 'black',
    barWidth: 3
});

function load() {
    wavesurfer.load('../../../test.mp3');
    //document.getElementById("load").disabled = true;
    var button = document.getElementById('waveButton');
    button.removeAttribute('onclick');
    button.innerHTML = 'Play/pause';
    button.addEventListener('click', () => { wavesurfer.playPause(); });
}