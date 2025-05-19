import React, { useState } from 'react'
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Button,
} from 'react-native'

type Color = 'white' | 'black'
type Coord = [number, number]
type BoardState = (Piece | null)[][]

interface Piece {
  color: Color
  symbol: string
  canMove(board: BoardState, from: Coord, to: Coord): boolean
}

abstract class PieceBase implements Piece {
  constructor(public color: Color) {}
  abstract symbol: string
  abstract canMove(board: BoardState, from: Coord, to: Coord): boolean
}

class King extends PieceBase {
  symbol = this.color === 'white' ? '♔' : '♚'
  canMove(board: BoardState, [r1, c1], [r2, c2]) {
    const dr = Math.abs(r2 - r1), dc = Math.abs(c2 - c1)
    return (
      dr <= 1 &&
      dc <= 1 &&
      (!board[r2][c2] || board[r2][c2]!.color !== this.color)
    )
  }
}

class Queen extends PieceBase {
  symbol = this.color === 'white' ? '♕' : '♛'
  canMove(board: BoardState, from, to) {
    return (
      new Rook(this.color).canMove(board, from, to) ||
      new Bishop(this.color).canMove(board, from, to)
    )
  }
}

class Rook extends PieceBase {
  symbol = this.color === 'white' ? '♖' : '♜'
  canMove(board: BoardState, [r1, c1], [r2, c2]) {
    if (r1 !== r2 && c1 !== c2) return false
    const dr = Math.sign(r2 - r1), dc = Math.sign(c2 - c1)
    let r = r1 + dr, c = c1 + dc
    while (r !== r2 || c !== c2) {
      if (board[r][c]) return false
      r += dr; c += dc
    }
    return !board[r2][c2] || board[r2][c2]!.color !== this.color
  }
}

class Bishop extends PieceBase {
  symbol = this.color === 'white' ? '♗' : '♝'
  canMove(board: BoardState, [r1, c1], [r2, c2]) {
    const dr = r2 - r1, dc = c2 - c1
    if (Math.abs(dr) !== Math.abs(dc)) return false
    const stepR = Math.sign(dr), stepC = Math.sign(dc)
    let r = r1 + stepR, c = c1 + stepC
    while (r !== r2 && c !== c2) {
      if (board[r][c]) return false
      r += stepR; c += stepC
    }
    return !board[r2][c2] || board[r2][c2]!.color !== this.color
  }
}

class Knight extends PieceBase {
  symbol = this.color === 'white' ? '♘' : '♞'
  canMove(board: BoardState, [r1, c1], [r2, c2]) {
    const dr = Math.abs(r2 - r1), dc = Math.abs(c2 - c1)
    return (
      ((dr === 2 && dc === 1) || (dr === 1 && dc === 2)) &&
      (!board[r2][c2] || board[r2][c2]!.color !== this.color)
    )
  }
}

class Pawn extends PieceBase {
  symbol = this.color === 'white' ? '♙' : '♟︎'
  canMove(board: BoardState, [r1, c1], [r2, c2]) {
    const dir = this.color === 'white' ? -1 : 1
    // forward one
    if (c1 === c2 && r2 === r1 + dir && !board[r2][c2]) return true
    // initial two-step
    if (
      c1 === c2 &&
      ((this.color === 'white' && r1 === 6) || (this.color === 'black' && r1 === 1)) &&
      r2 === r1 + 2 * dir &&
      !board[r1 + dir][c1] && !board[r2][c2]
    ) return true
    // capture diagonal
    if (
      Math.abs(c2 - c1) === 1 && r2 === r1 + dir &&
      board[r2][c2]?.color !== this.color
    ) return true
    return false
  }
}

const makeBoard = (): BoardState => {
  const b: BoardState = Array.from({ length: 8 }, () => Array<Piece | null>(8).fill(null))
  for (let c = 0; c < 8; c++) {
    b[1][c] = new Pawn('black')
    b[6][c] = new Pawn('white')
  }
  const order = [Rook, Knight, Bishop, Queen, King, Bishop, Knight, Rook] as const
  order.forEach((P, i) => {
    b[0][i] = new P('black')
    b[7][i] = new P('white')
  })
  return b
}

export default function App() {
  const [board, setBoard] = useState<BoardState>(makeBoard())
  const [turn, setTurn] = useState<Color>('white')
  const [selected, setSelected] = useState<Coord | null>(null)
  const [promotionCoord, setPromotionCoord] = useState<Coord | null>(null)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<Color | null>(null)

  const resetGame = () => {
    setBoard(makeBoard())
    setTurn('white')
    setSelected(null)
    setPromotionCoord(null)
    setGameOver(false)
    setWinner(null)
  }

  const checkKingAlive = (b: BoardState, color: Color) =>
    b.some(row => row.some(p => p instanceof King && p.color === color))

  const onCellPress = (r: number, c: number) => {
    if (gameOver || promotionCoord) return
    const piece = board[r][c]
    if (!selected) {
      if (piece && piece.color === turn) setSelected([r, c])
      return
    }
    const [r1, c1] = selected
    const mover = board[r1][c1]!
    if (mover.canMove(board, selected, [r, c])) {
      const nb = board.map(row => row.slice()) as BoardState
      nb[r][c] = mover
      nb[r1][c1] = null
      setBoard(nb)
      setSelected(null)
      // promotion
      if (mover instanceof Pawn && (r === 0 || r === 7)) {
        setPromotionCoord([r, c])
        return
      }
      // check king
      const opponent: Color = turn === 'white' ? 'black' : 'white'
      if (!checkKingAlive(nb, opponent)) {
        setGameOver(true)
        setWinner(turn)
        return
      }
      setTurn(opponent)
    } else {
      setSelected(null)
    }
  }

  const promote = (type: 'Queen' | 'Rook' | 'Bishop' | 'Knight') => {
    if (!promotionCoord) return
    const [r, c] = promotionCoord
    const color = board[r][c]!.color
    const nb = board.map(row => row.slice()) as BoardState
    let newPiece: Piece
    switch (type) {
      case 'Queen': newPiece = new Queen(color); break
      case 'Rook': newPiece = new Rook(color); break
      case 'Bishop': newPiece = new Bishop(color); break
      case 'Knight': newPiece = new Knight(color); break
    }
    nb[r][c] = newPiece
    setBoard(nb)
    setPromotionCoord(null)
    const opponent: Color = turn === 'white' ? 'black' : 'white'
    setTurn(opponent)
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.board}>
        {board.map((row, r) => (
          <View key={r} style={styles.row}>
            {row.map((piece, c) => {
              const isSel = selected?.[0] === r && selected?.[1] === c
              return (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.cell,
                    (r + c) % 2 === 0 ? styles.light : styles.dark,
                    isSel && styles.selected,
                  ]}
                  onPress={() => onCellPress(r, c)}
                >
                  <Text style={styles.piece}>{piece?.symbol || ''}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        ))}
      </View>
      {gameOver && <Text style={styles.gameOver}>Game Over: {winner?.toUpperCase()} wins</Text>}
      <Text style={styles.turn}>{turn.charAt(0).toUpperCase() + turn.slice(1)} to move</Text>
      <Button title="Reset Game" onPress={resetGame} />

      <Modal visible={promotionCoord !== null} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalText}>Promote pawn to:</Text>
          <View style={styles.modalButtons}>
            {['Queen','Rook','Bishop','Knight'].map(t => (
              <Button key={t} title={t} onPress={() => promote(t as any)} />
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  board: { width: '90%', aspectRatio: 1 },
  row: { flex: 1, flexDirection: 'row' },
  cell: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  light: { backgroundColor: '#ddd' },
  dark: { backgroundColor: '#555' },
  selected: { borderWidth: 2, borderColor: 'gold' },
  piece: { fontSize: 24 },
  turn: { marginTop: 12, fontSize: 18, fontWeight: '600' },
  gameOver: { marginTop: 8, fontSize: 20, fontWeight: '700', color: 'red' },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalText: { fontSize: 18, marginBottom: 12, color: '#fff' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-around', width: '80%' },
})
