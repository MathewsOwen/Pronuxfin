const stocks=["PETR4","VALE3","ITUB4","BBAS3","BBDC4"]

function renderRanking(){

const gainers=document.getElementById("topGainers")
const losers=document.getElementById("topLosers")

stocks.forEach(stock=>{

const change=(Math.random()*6-3).toFixed(2)

const li=document.createElement("li")

li.innerText=stock+" "+change+"%"

if(change>0){

gainers.appendChild(li)

}else{

losers.appendChild(li)

}

})

}

renderRanking()
