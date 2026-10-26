import { useState } from 'react'
import { Button } from '@/components/ui/button'

function App() {
  const [count, setCount] = useState(0)

  return (
    <main className="flex min-h-svh items-center justify-center px-6 py-16">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Pulse Rewards</h1>
          <p className="text-muted-foreground">项目已就绪，开始构建你的应用。</p>
        </div>
        <Button onClick={() => setCount((value) => value + 1)}>
          点击次数：{count}
        </Button>
      </div>
    </main>
  )
}

export default App
