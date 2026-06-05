// pages/login — Instagram uslubidagi kirish sahifasi.
// API hali yo'q: forma faqat lokal state bilan ishlaydi.

import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Input } from '@/shared/ui'
import { PATHS } from '@/shared/config/routes'
import { session } from '@/shared/lib/session'

export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)

  const onChange = (key: 'username' | 'password') => (e: { target: { value: string } }) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // TODO: API ulanganda authApi.login(form) chaqiriladi
    // Hozircha demo token bilan ichkariga kiritamiz
    setTimeout(() => {
      session.setToken('demo-token')
      navigate(PATHS.FEED, { replace: true })
    }, 500)
  }

  const isValid = form.username.trim() && form.password.length >= 6

  return (
    <div className="space-y-3">
      <div className="rounded border border-gray-200 bg-white px-10 py-8">
        <h1 className="mb-6 text-center font-serif text-4xl italic tracking-tight">
          Instagram
        </h1>

        <form onSubmit={onSubmit} className="space-y-2">
          <Input
            type="text"
            placeholder="Foydalanuvchi nomi yoki email"
            value={form.username}
            onChange={onChange('username')}
            autoComplete="username"
          />
          <Input
            type="password"
            placeholder="Parol"
            value={form.password}
            onChange={onChange('password')}
            autoComplete="current-password"
          />
          <Button type="submit" loading={loading} disabled={!isValid}>
            Kirish
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-gray-200" />
          <span className="text-xs font-semibold text-gray-400">YOKI</span>
          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <button
          type="button"
          className="w-full text-center text-sm font-semibold text-sky-900"
        >
          Parolni unutdingizmi?
        </button>
      </div>

      <div className="rounded border border-gray-200 bg-white py-4 text-center text-sm">
        Akkauntingiz yo'qmi?{' '}
        <Link to={PATHS.REGISTER} className="font-semibold text-sky-500">
          Ro'yxatdan o'tish
        </Link>
      </div>
    </div>
  )
}
