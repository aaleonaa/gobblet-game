document.addEventListener("DOMContentLoaded", () => {
  const board = document.getElementById('board');
  const turnText = document.getElementById('turn');
  const pieceSizeSelect = document.getElementById('piece-size');
  const replaceInfoText = document.getElementById('replace-info');
  const resetButton = document.getElementById('reset-button');
  const pieceCounts = document.getElementById('piece-counts');
  const toggleCountsButton = document.getElementById('toggle-counts');
  const undoButton = document.getElementById('undo-button');

  undoButton.disabled = true; // ★追加：初期は無効化

  const historyLogWrapper = document.createElement('div');
  const toggleHistoryButton = document.createElement('button');
  toggleHistoryButton.textContent = '履歴を表示/非表示';
  const historyLog = document.createElement('div');
  historyLog.id = 'history-log';
  historyLogWrapper.appendChild(toggleHistoryButton);
  historyLogWrapper.appendChild(historyLog);
  document.body.appendChild(historyLogWrapper);
  historyLogWrapper.style.marginTop = '20px';

  toggleHistoryButton.addEventListener('click', () => {
    historyLog.style.display = historyLog.style.display === 'none' ? 'block' : 'none';
  });
  historyLog.style.display = 'none';

  let currentPlayer;
  let mustReplacePiece;
  let gameEnded;
  let history = [];
  let players;

  const sizeLabels = {
    small: '小',
    medium: '中',
    large: '大'
  };

  function indexToPos(index) {
    const row = Math.floor(index / 3) + 1;
    const col = index % 3 + 1;
    return `${row}.${col}`;
  }

  function logMove(text) {
    const entry = document.createElement('div');
    entry.textContent = text;
    historyLog.appendChild(entry);
  }

  function saveHistory(moveText = null) {
    const cells = Array.from(document.querySelectorAll('.cell')).map(cell => {
      return Array.from(cell.children).map(piece => ({
        size: piece.classList.contains('large') ? 'large' :
              piece.classList.contains('medium') ? 'medium' : 'small',
        color: piece.classList.contains('red') ? 'red' : 'blue'
      }));
    });

    const state = {
      board: cells,
      currentPlayer,
      mustReplacePiece,
      gameEnded,
      players: JSON.parse(JSON.stringify(players)),
      turnText: turnText.textContent
    };

    history.push(state);

    if (moveText) {
      logMove(`ターン ${history.length - 1}: ${moveText}`);
    }

    if (history.length > 2) {
      undoButton.disabled = false; // ★追加：履歴が2件以上になったら有効化
    }
  }

  function loadHistory() {
    if (history.length <= 2) {
      undoButton.disabled = true;  // ★追加：履歴が1件以下ならボタン無効化
      return;
    }

    history.pop();

    if (historyLog.lastChild) {
      historyLog.removeChild(historyLog.lastChild);
    }

    
    const prev = history[history.length - 1];

    board.innerHTML = '';
    createBoard();

    prev.board.forEach((pieces, i) => {
      const cell = board.children[i];
      pieces.forEach(p => {
        const piece = document.createElement('div');
        piece.classList.add('piece', p.size, p.color);
        cell.appendChild(piece);
      });
    });

    currentPlayer = prev.currentPlayer;
    mustReplacePiece = prev.mustReplacePiece;
    gameEnded = prev.gameEnded;
    players = JSON.parse(JSON.stringify(prev.players));

    updatePieceDisplay();
    replaceInfoText.style.display = mustReplacePiece ? 'block' : 'none';
    pieceSizeSelect.value = mustReplacePiece || '';

    turnText.textContent = prev.turnText;

    currentPlayer = prev.currentPlayer === 1 ? 2 : 1;
    turnText.textContent = `${currentPlayer === 1 ? '赤' : '青'}のターン`;

    if (history.length <= 2) {
      undoButton.disabled = true; // ★追加：履歴が1件以下になったら無効化
    }
    
  }

  function resetGame() {
    board.innerHTML = '';
    historyLog.innerHTML = '';
    currentPlayer = 1;
    mustReplacePiece = null;
    gameEnded = false;
    players = {
      1: { small: 2, medium: 2, large: 2 },
      2: { small: 2, medium: 2, large: 2 },
    };
    turnText.textContent = '赤のターン';
    replaceInfoText.style.display = 'none';
    pieceSizeSelect.value = '';
    createBoard();
    updatePieceDisplay();
    history = [];
    saveHistory();
    undoButton.disabled = true; // ★追加：リセット時も無効化
  }

  function updatePieceDisplay() {
    const p1 = players[1];
    const p2 = players[2];
    pieceCounts.innerHTML = 
      `<div><strong>赤のプレイヤー</strong>：小:${p1.small} 中:${p1.medium} 大:${p1.large}</div>
       <div><strong>青のプレイヤー</strong>：小:${p2.small} 中:${p2.medium} 大:${p2.large}</div>`;
  }

  function createBoard() {
    for (let i = 0; i < 9; i++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.index = i;
      cell.addEventListener('click', () => handleCellClick(cell));
      board.appendChild(cell);
    }
  }

  function getTopPiece(cell) {
    const pieces = Array.from(cell.querySelectorAll('.piece'));
    return pieces.length ? pieces[pieces.length - 1] : null;
  }

  let lastMoveIndex = null;

  function handleCellClick(cell) {
    if (gameEnded) return;

    const top = getTopPiece(cell);
    const index = parseInt(cell.dataset.index);

    if (top && top.classList.contains(currentPlayer === 1 ? 'red' : 'blue')) {
      const size = top.classList.contains('large') ? 'large' :
                   top.classList.contains('medium') ? 'medium' : 'small';

      const selectedSize = pieceSizeSelect.value;
      if (['small', 'medium', 'large'].indexOf(selectedSize) > ['small', 'medium', 'large'].indexOf(size)) {
        const newPiece = document.createElement('div');
        newPiece.classList.add('piece', selectedSize, currentPlayer === 1 ? 'red' : 'blue');
        cell.appendChild(newPiece);
        players[currentPlayer][selectedSize]--;
        updatePieceDisplay();

        mustReplacePiece = null;
        replaceInfoText.style.display = 'none';
        pieceSizeSelect.value = '';
        const from = indexToPos(index);
        saveHistory(`${currentPlayer === 1 ? '赤' : '青'} ${from} に ${sizeLabels[selectedSize]} を重ねた`);
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        turnText.textContent = `${currentPlayer === 1 ? '赤' : '青'}のターン`;

        const winner = checkWinner();
        if (winner !== 0) {
          turnText.textContent = `${winner}の勝利！ (${winner === 1 ? '赤' : '青'})`;
          gameEnded = true;
        }
        return;
      }

      const confirmRemove = confirm('本当に回収しますか？');
      if (confirmRemove) {
        cell.removeChild(top);
        players[currentPlayer][size]++;
        if (cell.lastChild) cell.lastChild.style.display = 'block';
        updatePieceDisplay();
        mustReplacePiece = size;
        replaceInfoText.style.display = 'block';
        pieceSizeSelect.value = size;
        lastMoveIndex = index;

        saveHistory(`${currentPlayer === 1 ? '赤' : '青'} ${indexToPos(index)} の ${sizeLabels[size]} を回収`);
        const winner = checkWinner();
        if (winner !== 0) {
          turnText.textContent = `${winner}の勝利！ (${winner === 1 ? '赤' : '青'})`;
          gameEnded = true;
        }
      }
      return;
    }

    const size = pieceSizeSelect.value;
    if (!['small', 'medium', 'large'].includes(size)) {
      alert('駒のサイズを選んでください。');
      return;
    }

    if (mustReplacePiece && size !== mustReplacePiece) {
      alert(`回収した${sizeLabels[mustReplacePiece]}の駒を配置してください。`);
      return;
    }

    if (players[currentPlayer][size] <= 0) {
      alert('そのサイズの駒は残っていません。');
      return;
    }

    const existing = Array.from(cell.querySelectorAll('.piece'));
    const newSize = size === 'large' ? 3 : size === 'medium' ? 2 : 1;
    if (existing.length > 0) {
      const top = existing[existing.length - 1];
      const topSize = top.classList.contains('large') ? 3 : top.classList.contains('medium') ? 2 : 1;
      if (newSize <= topSize) {
        alert('その駒は重ねられません。');
        return;
      }
      top.style.display = 'none';
    }

    const newPiece = document.createElement('div');
    newPiece.classList.add('piece', size, currentPlayer === 1 ? 'red' : 'blue');
    cell.appendChild(newPiece);
    players[currentPlayer][size]--;
    updatePieceDisplay();

    const moveText = mustReplacePiece
      ? `${currentPlayer === 1 ? '赤' : '青'} ${indexToPos(lastMoveIndex)} から ${indexToPos(index)} に移動 ${sizeLabels[size]}`
      : `${currentPlayer === 1 ? '赤' : '青'} ${indexToPos(index)} に ${sizeLabels[size]} を配置`;
    saveHistory(moveText);

    mustReplacePiece = null;
    replaceInfoText.style.display = 'none';
    pieceSizeSelect.value = '';

    const winner = checkWinner();
    if (winner !== 0) {
      turnText.textContent = `${winner}の勝利！ (${winner === 1 ? '赤' : '青'})`;
      gameEnded = true;
      return;
    }

    currentPlayer = currentPlayer === 1 ? 2 : 1;
    turnText.textContent = `${currentPlayer === 1 ? '赤' : '青'}のターン`;
  }

  function checkWinner() {
    const cells = document.querySelectorAll('.cell');
    const lines = [
      [0,1,2],[3,4,5],[6,7,8],
      [0,3,6],[1,4,7],[2,5,8],
      [0,4,8],[2,4,6]
    ];

    for (const [a,b,c] of lines) {
      const A = getTopPiece(cells[a]);
      const B = getTopPiece(cells[b]);
      const C = getTopPiece(cells[c]);
      if (A && B && C &&
          A.classList.contains('red') === B.classList.contains('red') &&
          B.classList.contains('red') === C.classList.contains('red')) {
        return A.classList.contains('red') ? 1 : 2;
      }
    }
    return 0;
  }

  toggleCountsButton.addEventListener('click', () => {
    pieceCounts.style.display = pieceCounts.style.display === 'none' ? 'block' : 'none';
  });

  resetButton.addEventListener('click', () => {
    const confirmed = confirm('本当にリセットしますか？');
    if (confirmed) {
      resetGame();
    }
  });
  undoButton.addEventListener('click', loadHistory);

  resetGame();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(reg => {
        console.log('Service Worker registered.', reg);
      })
      .catch(err => {
        console.log('Service Worker registration failed:', err);
      });
  });
}