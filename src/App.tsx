import { useEffect, useRef, useState } from 'react'
import './App.css'

interface Position {
  x: number
  y: number
}

interface Paddle {
  x: number
  y: number
  width: number
  height: number
}

interface Ball {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [score, setScore] = useState({ player: 0, ai: 0 })
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)

  const gameStateRef = useRef({
    ball: { x: 0, y: 0, vx: 0, vy: 0, radius: 8 } as Ball,
    playerPaddle: { x: 0, y: 0, width: 12, height: 100 } as Paddle,
    aiPaddle: { x: 0, y: 0, width: 12, height: 100 } as Paddle,
    mouseY: 0,
    canvasWidth: 800,
    canvasHeight: 600
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const state = gameStateRef.current
    state.canvasWidth = canvas.width
    state.canvasHeight = canvas.height

    // Initialize positions
    state.ball.x = state.canvasWidth / 2
    state.ball.y = state.canvasHeight / 2
    state.ball.vx = 0
    state.ball.vy = 0

    state.playerPaddle.x = 30
    state.playerPaddle.y = state.canvasHeight / 2 - state.playerPaddle.height / 2

    state.aiPaddle.x = state.canvasWidth - 30 - state.aiPaddle.width
    state.aiPaddle.y = state.canvasHeight / 2 - state.aiPaddle.height / 2

    // Mouse movement handler
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      state.mouseY = e.clientY - rect.top
    }

    canvas.addEventListener('mousemove', handleMouseMove)

    // Game loop
    let animationId: number
    let lastTime = Date.now()

    const update = () => {
      const currentTime = Date.now()
      const deltaTime = (currentTime - lastTime) / 1000
      lastTime = currentTime

      if (gameStarted && !gameOver) {
        // Update player paddle position
        const targetY = state.mouseY - state.playerPaddle.height / 2
        state.playerPaddle.y = Math.max(0, Math.min(state.canvasHeight - state.playerPaddle.height, targetY))

        // Update ball position
        state.ball.x += state.ball.vx * deltaTime
        state.ball.y += state.ball.vy * deltaTime

        // Ball collision with top and bottom walls
        if (state.ball.y - state.ball.radius <= 0 || state.ball.y + state.ball.radius >= state.canvasHeight) {
          state.ball.vy *= -1
          state.ball.y = Math.max(state.ball.radius, Math.min(state.canvasHeight - state.ball.radius, state.ball.y))
        }

        // Ball collision with player paddle
        if (
          state.ball.x - state.ball.radius <= state.playerPaddle.x + state.playerPaddle.width &&
          state.ball.x + state.ball.radius >= state.playerPaddle.x &&
          state.ball.y >= state.playerPaddle.y &&
          state.ball.y <= state.playerPaddle.y + state.playerPaddle.height
        ) {
          state.ball.vx = Math.abs(state.ball.vx)
          const hitPos = (state.ball.y - state.playerPaddle.y) / state.playerPaddle.height - 0.5
          state.ball.vy = hitPos * 600
        }

        // Ball collision with AI paddle
        if (
          state.ball.x + state.ball.radius >= state.aiPaddle.x &&
          state.ball.x - state.ball.radius <= state.aiPaddle.x + state.aiPaddle.width &&
          state.ball.y >= state.aiPaddle.y &&
          state.ball.y <= state.aiPaddle.y + state.aiPaddle.height
        ) {
          state.ball.vx = -Math.abs(state.ball.vx)
          const hitPos = (state.ball.y - state.aiPaddle.y) / state.aiPaddle.height - 0.5
          state.ball.vy = hitPos * 600
        }

        // Ball out of bounds (scoring)
        if (state.ball.x - state.ball.radius <= 0) {
          setScore(prev => ({ ...prev, ai: prev.ai + 1 }))
          resetBall()
        } else if (state.ball.x + state.ball.radius >= state.canvasWidth) {
          setScore(prev => ({ ...prev, player: prev.player + 1 }))
          resetBall()
        }

        // Simple AI
        const aiSpeed = 250
        const aiTargetY = state.ball.y - state.aiPaddle.height / 2
        if (state.aiPaddle.y < aiTargetY - 10) {
          state.aiPaddle.y += aiSpeed * deltaTime
        } else if (state.aiPaddle.y > aiTargetY + 10) {
          state.aiPaddle.y -= aiSpeed * deltaTime
        }
        state.aiPaddle.y = Math.max(0, Math.min(state.canvasHeight - state.aiPaddle.height, state.aiPaddle.y))
      }

      // Render
      render(ctx)
      animationId = requestAnimationFrame(update)
    }

    const resetBall = () => {
      state.ball.x = state.canvasWidth / 2
      state.ball.y = state.canvasHeight / 2
      const angle = (Math.random() - 0.5) * Math.PI / 3
      const speed = 400
      state.ball.vx = speed * Math.cos(angle) * (Math.random() > 0.5 ? 1 : -1)
      state.ball.vy = speed * Math.sin(angle)
    }

    const render = (ctx: CanvasRenderingContext2D) => {
      // Clear canvas
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, state.canvasWidth, state.canvasHeight)

      // Draw center line
      ctx.strokeStyle = '#444'
      ctx.lineWidth = 2
      ctx.setLineDash([10, 10])
      ctx.beginPath()
      ctx.moveTo(state.canvasWidth / 2, 0)
      ctx.lineTo(state.canvasWidth / 2, state.canvasHeight)
      ctx.stroke()
      ctx.setLineDash([])

      // Draw paddles
      ctx.fillStyle = '#fff'
      ctx.fillRect(state.playerPaddle.x, state.playerPaddle.y, state.playerPaddle.width, state.playerPaddle.height)
      ctx.fillRect(state.aiPaddle.x, state.aiPaddle.y, state.aiPaddle.width, state.aiPaddle.height)

      // Draw ball
      ctx.beginPath()
      ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2)
      ctx.fill()
    }

    update()

    return () => {
      cancelAnimationFrame(animationId)
      canvas.removeEventListener('mousemove', handleMouseMove)
    }
  }, [gameStarted, gameOver])

  const startGame = () => {
    setGameStarted(true)
    setGameOver(false)
    const state = gameStateRef.current
    const angle = (Math.random() - 0.5) * Math.PI / 3
    const speed = 400
    state.ball.vx = speed * Math.cos(angle) * (Math.random() > 0.5 ? 1 : -1)
    state.ball.vy = speed * Math.sin(angle)
  }

  const resetGame = () => {
    setScore({ player: 0, ai: 0 })
    setGameStarted(false)
    setGameOver(false)
    const state = gameStateRef.current
    state.ball.x = state.canvasWidth / 2
    state.ball.y = state.canvasHeight / 2
    state.ball.vx = 0
    state.ball.vy = 0
  }

  useEffect(() => {
    if (score.player >= 5 || score.ai >= 5) {
      setGameOver(true)
      setGameStarted(false)
    }
  }, [score])

  return (
    <div className="app">
      <div className="game-container">
        <div className="score-board">
          <div className="score">
            <div className="score-label">Player</div>
            <div className="score-value">{score.player}</div>
          </div>
          <div className="score">
            <div className="score-label">AI</div>
            <div className="score-value">{score.ai}</div>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="game-canvas"
        />

        {!gameStarted && !gameOver && (
          <div className="game-overlay">
            <h1>Pong</h1>
            <p>Move your mouse to control the paddle</p>
            <button onClick={startGame} className="start-button">Start Game</button>
          </div>
        )}

        {gameOver && (
          <div className="game-overlay">
            <h1>{score.player >= 5 ? 'You Win!' : 'AI Wins!'}</h1>
            <p>Final Score: {score.player} - {score.ai}</p>
            <button onClick={resetGame} className="start-button">Play Again</button>
          </div>
        )}

        {gameStarted && !gameOver && (
          <div className="instructions">
            Move your mouse to control the paddle • First to 5 wins
          </div>
        )}
      </div>
    </div>
  )
}

export default App
