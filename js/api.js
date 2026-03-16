async function loadCrypto(){

const url="https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd"

const response=await fetch(url)

const data=await response.json()

document.getElementById("btcPrice").innerText="$"+data.bitcoin.usd

document.getElementById("ethPrice").innerText="$"+data.ethereum.usd

}

loadCrypto()
