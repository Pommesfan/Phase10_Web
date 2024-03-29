const inputFormSwitch = document.getElementById("inputFormSwitch")
const inputFormDiscard = document.getElementById("inputFormDiscard")
const inputFormInject = document.getElementById("inputFormInject")
const newCardDiv = document.getElementById("newCardDiv")
const openCardDiv = document.getElementById("openCardDiv")
const newCardP = document.getElementById("newCardP")
const openCardP = document.getElementById("openCardP")
const playerCardsDiv = document.getElementById("playerCards")
const discardedCardsDiv = document.getElementById("discardedCards")
const currentPlayerP = document.getElementById("currentPlayer")

var playerCards = []
var discardedCardIndices = []
var discardedCards = []
var newCard = null
var openCard = null
var selectedPlayerCard = null
var injectTo = null
var switchMode = null
var cardGroupSize = 0
var phase_description = []
var number_of_phase = []
var error_points = []
var sortCards = []

function show_player_cards(cards, show_checkboxes, show_radio_buttons, cardGroupSize) {
    playerCardsDiv.innerHTML = ""
    let rowDiv = document.createElement("div")
    rowDiv.setAttribute("class", "row")
    for (let i = 0; i < cards.length; i++) {
        let colDiv = document.createElement("div")
        colDiv.setAttribute("class", "col")
        colDiv.appendChild(drawCard(cards[i]['value'], cards[i]['color']))
        colDiv.appendChild(document.createElement("br"))
        if(show_radio_buttons) {
            colDiv.appendChild(radio_buttons_player_cards(i))
        }
        if(show_checkboxes) {
            checkboxes(i, cardGroupSize, colDiv)
        }
        rowDiv.appendChild(colDiv)
    }
    playerCardsDiv.appendChild(rowDiv)
}

function checkboxes(i, cardGroupSize, colDiv) {
    for (let j = 0; j < cardGroupSize; j++) {
        let checkbox = document.createElement("input")
        checkbox.setAttribute("class", "form-check-input")
        checkbox.type = "checkbox"
        checkbox.id = "inlineCheckbox" + j + "_" + i
        colDiv.appendChild(checkbox)
    }
}

function radio_buttons_player_cards(i) {
    let radioButton = document.createElement("input")
    radioButton.id = "selected_player_card_" + i
    radioButton.type="radio"
    radioButton.name="card_index"
    radioButton.value=i
    return radioButton
}

function radio_buttons_discarded_Cards(i,j,position) {
    let radioButton = document.createElement("input")
    radioButton.type = "radio"
    radioButton.name = "inject_to"
    radioButton.value = i + "_" + j + "_" + position
    return radioButton
}

function discarded_cards(cardStashes, show_radio_buttons) {
    discardedCardsDiv.innerHTML = ""
    for (let i = 0; i < cardStashes.length; i++) {
        let textViewDiv = document.createElement("div")
        let textView = document.createElement("strong")
        textView.setAttribute("class", "player_header")
        textViewDiv.innerHTML = textView
        let player_header = "Spieler: " + get_player_name(i) + "; Phase " + number_of_phase[i] + ": " +
            phase_description[i] + "; Fehlerpunkte: " + error_points[i]
        textView.innerHTML = player_header
        discardedCardsDiv.appendChild(textView)
        let cardGroups = cardStashes[i]
        if (cardGroups == null) {
            let textView2 = document.createElement("p")
            textView2.innerHTML = "Keine Karten"
            discardedCardsDiv.appendChild(textView2)
        } else {
            for(let j = 0; j < cardGroups.length; j++) {
                let cards = cardGroups[j]
                let col = document.createElement('div')
                col.setAttribute("class", "col")
                if(show_radio_buttons) {
                    col.appendChild(radio_buttons_discarded_Cards(i,j,INJECT_TO_FRONT))
                }

                for (let c in cards) {
                    let card = cards[c]
                    let cardView = drawCard(card['value'], card['color'])
                    col.appendChild(cardView)
                }

                if(show_radio_buttons) {
                    col.appendChild(radio_buttons_discarded_Cards(i,j,INJECT_AFTER))
                }
                discardedCardsDiv.appendChild(col)
            }
        }
    }
}

function newRoundMessage() {
    const number_of_players= sessionStorage.getItem(str_numberOfPlayers)
    let s = "Neue Runde:"
    for(let i = 0; i < number_of_players; i++) {
        s += ("\n" + get_player_name(i) + ": " + error_points[i] + " Fehlerpunkte; Phase: " + number_of_phase[i]
            + ": " + phase_description[i])
    }
    alert(s)
}

function new_round(data) {
    const number_of_players= sessionStorage.getItem(str_numberOfPlayers)
    discardedCards = new Array(parseInt(number_of_players)).fill(null)
    playerCards = data[str_cardStash]
    cardGroupSize = data[str_card_group_size]
    sortCards = data[str_sortCards]
    setPhaseAndPlayers(data)
    error_points = data[str_errorPoints]
    phase_description = data[str_phaseDescription]
    number_of_phase = data[str_numberOfPhase]
    newRoundMessage()
}

function load_discarded_cards() {
    //copy player cards as discarded
    let discarded_card_current_player = []
    for(let i = 0; i < discardedCardIndices.length; i++) {
        let indices = discardedCardIndices[i]
        let cardGroup = []
        for(let j = 0; j < indices.length; j++) {
            let idx = indices[j]
            cardGroup.push(playerCards[idx])
        }
        if (sortCards[i])
            sort_cards(cardGroup)
        discarded_card_current_player.push(cardGroup)
    }
    discardedCards[sessionStorage.getItem(str_thisPlayerIdx)] = discarded_card_current_player

    //remove player cards
    let playerCardIndices = inverted_idx_list(10, discardedCardIndices.flat())
    playerCards = map_cards(playerCardIndices, playerCards)
    discardedCardIndices = []
}

function load_injected_card() {
    let idx = injectTo.playerCard
    let card = playerCards[idx]
    let stashTo = discardedCards[injectTo.playerTo][injectTo.groupTo]
    let position_to = injectTo.positionTo
    if(position_to == INJECT_TO_FRONT) {
        stashTo.unshift(card)
    } else if(position_to == INJECT_AFTER) {
        stashTo.push(card)
    }
    injectTo = null
    let inverted_idx = inverted_idx_list(playerCards.length, [idx])
    playerCards = map_cards(inverted_idx, playerCards)
}

function load_new_open() {
    if(switchMode  == NEW_CARD) {
        playerCards[selectedPlayerCard] = newCard
    } else if (switchMode == OPEN_CARD) {
        playerCards[selectedPlayerCard] = openCard
    }
}

function turnEnded(data) {
    let success = data['success']
    if(success) {
        if (discardedCardIndices.length > 0) {
            load_discarded_cards()
        }
    } else {
        injectTo = null
        discardedCardIndices = []
        alert("Ungültiger Spielzug")
    }

    fullLoad(data)
    show_player_cards(playerCards, false, false, cardGroupSize)
    discarded_cards(discardedCards, false)
    inputFormSwitch.hidden = true
    inputFormDiscard.hidden = true
    inputFormInject.hidden = true
    newCardDiv.hidden = true
    openCardDiv.hidden = true
}


function setPhaseAndPlayers(data) {
    let currentPlayer = sessionStorage.getItem(str_thisPlayer)
    let team_id = sessionStorage.getItem("team_id")
    currentPlayerP.innerHTML = "Aktueller Spieler: " + currentPlayer + "; Team-ID: " + team_id
}

function fullLoad(data) {
    if(data['fullLoad']) {
        playerCards = data[str_cardStash]
        discardedCards = data[str_discardedStash]
        cardGroupSize = data[str_card_group_size]
        error_points= data[str_errorPoints]
        phase_description = data[str_phaseDescription]
        number_of_phase = data[str_numberOfPhase]
        sortCards = data[str_sortCards]
        loadPlayers(data)
        setPhaseAndPlayers(data)
    }
}

function playersTurn(data) {
    newCard = data['newCard']
    openCard = data['openCard']

    fullLoad(data)
    show_player_cards(playerCards, false, true, cardGroupSize)
    discarded_cards(discardedCards, false)

    newCardP.innerHTML = ""
    openCardP.innerHTML = ""
    newCardP.appendChild(drawCard(newCard['value'], newCard['color']))
    openCardP.appendChild(drawCard(openCard['value'], openCard['color']))

    inputFormSwitch.hidden = false
    inputFormDiscard.hidden = true
    inputFormInject.hidden = true
    newCardDiv.hidden = false
    openCardDiv.hidden = false
}

function goToDiscard(data) {
    load_new_open()

    fullLoad(data)
    show_player_cards(playerCards, true, false, cardGroupSize)
    discarded_cards(discardedCards, true)

    inputFormSwitch.hidden = true
    inputFormDiscard.hidden = false
    newCardDiv.hidden = true
    openCardDiv.hidden = true
}

function goToInject(data) {
    fullLoad(data)

    if(selectedPlayerCard != null) {
        load_new_open()
        selectedPlayerCard = null
    }
    inputFormSwitch.hidden = true
    inputFormInject.hidden = false
    newCardDiv.hidden = true
    openCardDiv.hidden = true

    if(injectTo != null) {
        load_injected_card()
    }

    show_player_cards(playerCards, false, true, cardGroupSize)
    discarded_cards(discardedCards, true)
}

function loadPlayers(data) {
    if(sessionStorage.getItem(str_numberOfPlayers) != null)
        return
    let names = data['players']
    const numberOfPlayers = data[str_numberOfPlayers]
    const thisPlayer = sessionStorage.getItem(str_thisPlayer)
    for(let i = 0; i < numberOfPlayers; i++) {
        sessionStorage.setItem("player_" + i, names[i])
        if(names[i] == thisPlayer)
            sessionStorage.setItem(str_thisPlayerIdx, i)
    }
    sessionStorage.setItem(str_numberOfPlayers, numberOfPlayers)
}

function newGameMessage(data) {
    let msg = "Neues Spiel\nPhase " + data[str_numberOfPhase][0] + ": " + data[str_phaseDescription][0] + "\n\nSpieler:"
    const numberOfPlayers = sessionStorage.getItem(str_numberOfPlayers)
    for(let i = 0; i < numberOfPlayers; i++) {
        let name = get_player_name(i)
        msg += "\n" + name
    }
    alert(msg)
}

function newGame(data) {
    loadPlayers(data)
    setPhaseAndPlayers(data)
    const numberOfPlayers = parseInt(sessionStorage.getItem(str_numberOfPlayers))
    error_points = new Array(numberOfPlayers).fill(0)
    playerCards = data[str_cardStash]
    cardGroupSize = data[str_card_group_size]
    sortCards = data[str_sortCards]
    newGameMessage(data)
}

function gameEnded(data) {
    let msg = "Spieler " + data['winningPlayer'] + " hat gewonnen\n"

    const length = sessionStorage.getItem(str_numberOfPlayers)
    const phases = data['phases']
    const errorPoints = data[str_errorPoints]

    for(let i = 0; i < length; i++) {
        const player = get_player_name(i)
        msg += "\n" + player + ": Phase " + phases[i] + "; " + errorPoints[i] + " Fehlerpunkte"
    }

    alert(msg)
    sessionStorage.clear()
    goto_homepage()
}

function playerHasDiscarded(data) {
    const playerTo = data['player']
    discardedCards[playerTo] = data['cards']
    discarded_cards(discardedCards, false)
}

function playerHasInjected(data) {
    let idxPlayerTo = data["playerTo"]
    let idxStashTo = data["stashTo"]
    let position = data["position"]
    let card = data["card"]

    let stashTo = discardedCards[idxPlayerTo][idxStashTo]
    if (position == INJECT_TO_FRONT) {
        stashTo.unshift(card)
    } else if(position == INJECT_AFTER) {
        stashTo.push(card)
    }
    discarded_cards(discardedCards, true)
}

function goto_homepage() {
    document.location.replace("/")
}

function update(data) {
    let event = data['event']

    if (event == "GoToDiscardEvent") {
        goToDiscard(data)
    } else if(event == "NewRoundEvent") {
        new_round(data)
    } else if(event == "TurnEndedEvent") {
        turnEnded(data)
    } else if(event == "PlayersTurnEvent") {
        alert("Du bist dran!")
        playersTurn(data)
    } else if (event == "GoToInjectEvent") {
        goToInject(data)
    }  else if (event == "NewGameEvent") {
        newGame(data)
    } else if(event == "GameEndedEvent") {
        gameEnded(data)
    } else if(event == "PlayerHasDiscarded") {
        playerHasDiscarded(data)
    } else if(event == "PlayerHasInjected") {
        playerHasInjected(data)
    } else if(event == "login_failed") {
        alert("Login fehlgeschlagen")
        goto_homepage()
    }
}

if(sessionStorage.getItem(str_thisPlayer) == null) {
    goto_homepage()
}

$( document ).ready(function() {
    console.log( "Document is ready." );
    websocket = connectWebSocket()
});
