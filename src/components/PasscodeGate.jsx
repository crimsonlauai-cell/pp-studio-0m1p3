import { useState } from 'react'
import { getToken, setToken, verifyToken } from '../data/api'

// Blocks the whole app until a valid passcode is stored in this browser
export default function PasscodeGate({ children }) {
  const [unlocked, setUnlocked] = useState(() => !!getToken())
  const [input, setInput] = useState('')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')

  if (unlocked) return children

  async function handleSubmit(e) {
    e.preventDefault()
    const token = input.trim()
    if (!token) return
    setChecking(true)
    setError('')
    try {
      if (await verifyToken(token)) {
        setToken(token)
        setUnlocked(true)
      } else {
        setError('暗號不正確，請再試一次')
      }
    } catch {
      setError('連線失敗，請稍後再試')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="min-h-screen bg-warm-50 flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-sm border border-warm-100 w-full max-w-sm text-center">
        <div className="text-5xl mb-3">🐾</div>
        <h1 className="text-xl font-extrabold text-gray-800 mb-1">Pet Photo Creator</h1>
        <p className="text-sm text-gray-400 mb-5">請輸入暗號進入</p>
        <input
          type="password"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="暗號"
          autoFocus
          className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-700 focus:outline-none focus:border-amber-400"
        />
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        <button
          type="submit"
          disabled={checking || !input.trim()}
          className={`mt-4 w-full py-3 rounded-xl font-bold text-sm transition-all
            ${checking || !input.trim()
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-amber-400 hover:bg-amber-500 text-white'}`}
        >
          {checking ? '驗證中…' : '進入'}
        </button>
      </form>
    </div>
  )
}
