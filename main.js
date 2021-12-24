// 設定遊戲狀態
const GAME_STATE = {
  FirstCardAwaits: "FirstCardAwaits",
  SecondCardAwaits: "SecondCardAwaits",
  CardsMatchFailed: "CardsMatchFailed",
  CardsMatched: "CardsMatched",
  GameFinished: "GameFinished",
}

// 花色陣列
const Symbols = [
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17989/__.png', // 黑桃
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17992/heart.png', // 愛心
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17991/diamonds.png', // 方塊
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17988/__.png' // 梅花
]

// 流程管理&邏輯相關物件
const controller = {
  currentState: GAME_STATE.FirstCardAwaits,
  // 啟動遊戲初始化
  generateCards() {
    view.displayCards(utility.getRandomNumberArray(52))
  },
  // 中樞系統，統一發派動作
  dispatchCardAction(card) {
    // 挑出"非卡背"的卡牌，排除執行處理(非卡背的牌，應為已被clicked或已matched，即使被點擊，也不應再執行動作)
    if (!card.classList.contains('back')) {
      return
    }
    // 比對目前狀態，並依照不同遊戲狀態，進行動作發派
    switch (this.currentState) {
      // 狀態為FirstCardAwaits：翻開卡片、卡片存入revealedCards、進入SecondCardAwaits
      case GAME_STATE.FirstCardAwaits:
        view.flipCards(card)
        model.revealedCards.push(card)
        this.currentState = GAME_STATE.SecondCardAwaits
        break
      // 狀態為SecondCardAwaits：翻開卡片、卡片存入revealedCards、比對翻開的兩張卡片數字是否相同
      case GAME_STATE.SecondCardAwaits:
        view.renderTriedTimes(model.triedTimes++)  //只要切換至 SecondCardAwaits，嘗試次數 +1
        view.flipCards(card)
        model.revealedCards.push(card)
        // 判斷是否配對成功
        if (model.isRevealedCardsMatched()) {
          // 配對成功
          view.renderScore(model.score += 10)  //配對成功得10分
          this.currentState = GAME_STATE.CardsMatched //進入CardsMatched狀態
          view.pairCards(...model.revealedCards) //卡片樣式變成 配對成功樣式
          model.revealedCards = [] //清空翻開暫存牌組
          //判斷遊戲是否結束
          if (model.score === 260) {
            console.log('Game Finished')
            this.currentState = GAME_STATE.GameFinished
            view.showGameFinished()
            return
          }
          this.currentState = GAME_STATE.FirstCardAwaits //動作結束後，狀態回到FirstCardAwaits
        } else {
          // 配對失敗
          this.currentState = GAME_STATE.CardsMatchFailed //進入CardsMatchFailed狀態
          view.appendWrongAnimation(...model.revealedCards) //卡片執行配對失敗動畫
          setTimeout(this.resetCards, 1000)  //延遲一秒讓使用者記憶卡片後，執行resetCards；1000 毫秒為 1 秒 //傳入函式本身，非函式結果
        }
        break
    }
    console.log('this.currentState', this.currentState)
    console.log('revealedCards', model.revealedCards.map(card => card.dataset.index))
  },

  resetCards() {
    view.flipCards(...model.revealedCards) //卡片翻回背面
    model.revealedCards = [] //清空翻開暫存牌組
    controller.currentState = GAME_STATE.FirstCardAwaits //動作結束後，狀態回到FirstCardAwaits  //this改為controller，因此時this的對象變為setTimeout，而 setTimeout 又是一個由瀏覽器提供的東西，而不是我們自己定義在 controller 的函式
  },
}

// 資料相關物件
const model = {
  revealedCards: [],
  // 比對翻開的兩張牌是否配對成功，回傳布林值，可用於controller內，設計if/else 流程使用
  isRevealedCardsMatched() {
    return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13
  },

  score: 0,
  triedTimes: 0,
}

// 視覺相關物件
const view = {  // tips省略屬性名稱：當物件的屬性與函式 / 變數名稱相同時，可省略不寫
  // 生成卡片內容(含數字&花色)
  // 直接用 0-51 來進行換算
  // 0-12：黑桃 1-13
  // 13-25：愛心 1-13
  // 26-38：方塊 1-13
  // 39-51：梅花 1-13

  // 取得牌面，透過點擊時，才由負責翻牌的函式來呼叫
  getCardContent(index) {
    const number = this.transformNumber((index % 13) + 1)
    const symbol = Symbols[Math.floor(index / 13)]
    return `
      <p>${number}</p>
      <img src="${symbol}">
      <p>${number}</p>
    `
  },

  // 取得牌背，遊戲初始預設，透過 view.displayCards 直接呼叫
  getCardElement(index) {
    return `
    <div data-index="${index}" class="card back">
    </div>
    `
  },

  // 特殊數字轉換(1,11,12,13 => A,J,Q,K)
  transformNumber(number) {
    switch (number) {
      case 1:
        return 'A'
      case 11:
        return 'J'
      case 12:
        return 'Q'
      case 13:
        return 'K'
      default:
        return number
    }
  },

  // 負責選出 #cards 並抽換內容
  displayCards(indexes) {
    const rootElement = document.querySelector('#cards')
    // 產生含有連續數字的陣列後
    // 使用map迭代該陣列，並依序將數字丟進 view.getCardElement()，會變成有 52 張卡片的陣列
    // 接著用 join("") 把陣列合併成一個大字串，才能當成 HTML template 使用
    // 把組合好的 template 用 innerHTML 放進 #cards 元素裡
    rootElement.innerHTML = indexes.map(index => this.getCardElement(index)).join('')
  },

  // 翻牌
  flipCards(...cards) {
    cards.map(card => {
      if (card.classList.contains('back')) {
        // 如果是背面，回傳正面
        // console.log(card.dataset.index) 測試用
        card.classList.remove('back')
        card.innerHTML = this.getCardContent(Number(card.dataset.index))
        return
      }
      // 如果是正面，回傳背面
      card.classList.add('back')
      card.innerHTML = null
    })
  },

  // 配對成功卡片樣式
  pairCards(...cards) {
    cards.map(card => {
      card.classList.add('paired')
    })
  },

  // 得分數顯示
  renderScore(score) {
    document.querySelector('.score').innerHTML = `Score: ${score}`
  },

  // 嘗試次數顯示
  renderTriedTimes(times) {
    document.querySelector('.tried').innerHTML = `You've tried: ${times} times`
  },

  // 配對失敗動畫顯示
  appendWrongAnimation(...cards) {
    cards.map(card => {
      card.classList.add('wrong')
      card.addEventListener('animationend', event => { event.target.classList.remove('wrong') }, { once: true })
    })
  },

  // 遊戲結束顯示
  showGameFinished() {
    const div = document.createElement('div')
    div.classList.add('completed')
    div.innerHTML = `
      <p>COMPLETE!</P>
      <p>Score: ${model.score}</p>
      <p>You've tried: ${model.triedTimes} times</p>
    `
    const header = document.querySelector('#header')
    header.before(div) //div元素搬移到header元素之前
  },
}

// 外掛小工具
const utility = {
  // 隨機洗牌(隨機重組陣列項目)
  getRandomNumberArray(count) {
    const number = Array.from(Array(count).keys())  // 生成連續數字陣列
    // 選定想交換的位置
    // 從最底部的卡牌開始，將它抽出來與前面的隨機一張牌交換
    // 接著做第二張牌、第三張牌⋯⋯以此類推，逐次做到頂部的第二張牌為止，
    for (let index = number.length - 1; index > 0; index--) {  // 取出最後一項
      const randomIndex = Math.floor(Math.random() * (index + 1)) // 找到一個隨機項目
        ;[number[index], number[randomIndex]] = [number[randomIndex], number[index]] //交換陣列元素；解構賦值
    }
    return number
  },
}

// 以下主程式
controller.generateCards()

// 每張卡牌寫下事件監聽
// Node List
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', event => {
    // console.log(card) 測試用
    // view.appendWrongAnimation(card) 測試用
    controller.dispatchCardAction(card)
  })
})
