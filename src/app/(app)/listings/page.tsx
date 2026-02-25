import { Suspense } from 'react'
import ListingsClient from './listings-client'

export default function ListingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ListingsClient />
    </Suspense>
  )
}
