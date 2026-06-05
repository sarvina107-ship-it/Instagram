// pages/register — Instagram uslubidagi ro'yxatdan o'tish sahifasi.
// API hali yo'q: forma faqat lokal state bilan ishlaydi.

import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Input } from '@/shared/ui'
import { PATHS } from '@/shared/config/routes'
import { session } from '@/shared/lib/session'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email: '',
    fullName: '',
    username: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)

  const onChange =
    (key: keyof typeof form) => (e: { target: { value: string } }) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // TODO: API ulanganda authApi.register(form) chaqiriladi
    setTimeout(() => {
      session.setToken('demo-token')
      navigate(PATHS.FEED, { replace: true })
    }, 500)
  }

  const isValid =
    form.email.includes('@') &&
    form.fullName.trim() &&
    form.username.trim() &&
    form.password.length >= 6

  return (
    <div className="space-y-3">
      <div className="rounded border border-gray-200 bg-white px-10 py-8">
        <h1 className="mb-2 text-center font-serif text-4xl italic tracking-tight">
          Instagram
        </h1>
        <p className="mb-6 text-center text-sm font-semibold text-gray-500">
          Do'stlaringizning rasmlarini ko'rish uchun ro'yxatdan o'ting.
        </p>

        <form onSubmit={onSubmit} className="space-y-2">
          <Input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={onChange('email')}
            autoComplete="email"
          />
          <Input
            type="text"
            placeholder="To'liq ism"
            value={form.fullName}
            onChange={onChange('fullName')}
            autoComplete="name"
          />
          <Input
            type="text"
            placeholder="Foydalanuvchi nomi"
            value={form.username}
            onChange={onChange('username')}
            autoComplete="username"
          />
          <Input
            type="password"
            placeholder="Parol (kamida 6 ta belgi)"
            value={form.password}
            onChange={onChange('password')}
            autoComplete="new-password"
          />
          <Button type="submit" loading={loading} disabled={!isValid}>
            Ro'yxatdan o'tish
          </Button>
        </form>
      </div>

      <div className="rounded border border-gray-200 bg-white py-4 text-center text-sm">
        Akkauntingiz bormi?{' '}
        <Link to={PATHS.LOGIN} className="font-semibold text-sky-500">
          Kirish
        </Link>
      </div>
    </div>
  )
}
