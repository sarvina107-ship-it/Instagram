import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PATHS } from '@/shared/config/routes'
import { useLogin } from '@/features/auth'
import Logo from '@/assets/icons/Logo.png'
import Facebook from '@/assets/icons/Facebook.png'
import Meta from '@/assets/icons/Meta.png'
import LoginImg from '@/assets/img/LoginImg.png'

const getLoginErrorMessage = (message: string) => {
  if (message === 'Failed to fetch') {
    return 'Не удалось подключиться к серверу. Перезапустите dev-сервер (npm run dev).'
  }
  if (message.includes("noto'g'ri") || message.includes('401')) {
    return 'Неверный логин или пароль. Сначала зарегистрируйтесь, если аккаунта нет.'
  }
  return message
}

const FOOTER_LINKS = [
  'Meta',
  'Информация',
  'Блог',
  'Вакансии',
  'Помощь',
  'API',
  'Конфиденциальность',
  'Условия',
  'Места',
  'Популярное',
  'Instagram Lite',
  'Meta AI',
  'Threads',
  'Загрузка контактов и лица, не являющиеся пользователями',
  'Meta Verified',
]

export default function LoginPage() {
  const navigate = useNavigate()
  const { mutate: login, isPending, error } = useLogin()
  const [form, setForm] = useState({ identifier: '', password: '' })

  const onChange =
    (key: 'identifier' | 'password') => (e: { target: { value: string } }) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    login(
      {
        identifier: form.identifier.trim(),
        password: form.password,
      },
      {
        onSuccess: () => navigate(PATHS.FEED, { replace: true }),
      },
    )
  }

  const isValid = form.identifier.trim() && form.password.length >= 6

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#262626]">
      <div className="flex flex-1">
        {/* Левая колонка — промо */}
        <div className="flex flex-1 flex-col border-r border-[#dbdbdb] px-12 py-10 xl:px-20">
          <img src={Logo} alt="Instagram" className="h-[72px] w-[72px] shrink-0 object-contain" />

          <div className="flex flex-1 flex-col items-center justify-center pb-16 pt-8">
            <h1
              className="max-w-[480px] text-center text-[32px] leading-[1.25] tracking-[-0.02em] text-black"
              style={{ fontFamily: '"Instagram Sans", Georgia, "Times New Roman", serif' }}
            >
              Посмотрите, какими моментами из жизни поделились ваши{' '}
              <span className="bg-gradient-to-r from-[#ff6d6d] via-[#ee2a7b] to-[#6228d7] bg-clip-text font-semibold text-transparent">
                близкие друзья
              </span>
              .
            </h1>

            <div className="mt-14 flex w-full max-w-[520px] justify-center">
              <img
                src={LoginImg}
                alt=""
                className="h-[380px] w-full max-w-[460px] object-cover"
              />
            </div>
          </div>
        </div>

        {/* Правая колонка — форма */}
        <div className="flex flex-1 flex-col items-center justify-center px-12 py-10 xl:px-20">
          <div className="flex w-full max-w-[360px] flex-col">
            <h2 className="mb-6 text-[16px] font-semibold text-black">Войти в Instagram</h2>

            <form onSubmit={onSubmit} className="w-full space-y-3">
              <input
                type="text"
                placeholder="Имя пользователя, номер мобильного телефона или электронны..."
                value={form.identifier}
                onChange={onChange('identifier')}
                autoComplete="username"
                className="w-full rounded-full border border-[#dbdbdb] bg-white px-4 py-[11px] text-[14px] outline-none placeholder:text-[#8e8e8e] focus:border-[#a8a8a8]"
              />
              <input
                type="password"
                placeholder="Пароль"
                value={form.password}
                onChange={onChange('password')}
                autoComplete="current-password"
                className="w-full rounded-full border border-[#dbdbdb] bg-white px-4 py-[11px] text-[14px] outline-none placeholder:text-[#8e8e8e] focus:border-[#a8a8a8]"
              />
              {error && (
                <p className="text-center text-[12px] text-red-500">
                  {getLoginErrorMessage(error.message)}
                </p>
              )}
              <button
                type="submit"
                disabled={!isValid || isPending}
                className="mt-1 w-full rounded-full bg-[#abc1f5] py-[10px] text-[14px] font-semibold text-white transition enabled:bg-[#4c5fd5] enabled:hover:bg-[#3f51c9] disabled:cursor-not-allowed"
              >
                {isPending ? 'Вход…' : 'Войти'}
              </button>
            </form>

            <button
              type="button"
              className="mt-5 w-full text-center text-[12px] font-semibold text-black"
            >
              Забыли пароль?
            </button>

            <div className="mt-10 w-full space-y-3">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-full border border-[#dbdbdb] bg-white px-4 py-[10px] text-[14px] font-semibold text-[#0064e0] transition hover:bg-[#fafafa]"
              >
                <img src={Facebook} alt="Facebook" className="h-[18px] w-[18px] object-contain" />
                Войти через Facebook
              </button>

              <Link
                to={PATHS.REGISTER}
                className="flex w-full items-center justify-center rounded-full border border-[#0064e0] bg-white px-4 py-[10px] text-[14px] font-semibold text-[#0064e0] transition hover:bg-[#f0f8ff]"
              >
                Создать новый аккаунт
              </Link>
            </div>

            <div className="mt-12 flex items-center justify-center gap-1.5">
              <img src={Meta} alt="Meta" className="h-[16px] w-[16px] object-contain" />
              <span className="text-[14px] font-semibold text-[#0064e0]">Meta</span>
            </div>
          </div>
        </div>
      </div>

      {/* Футер */}
      <footer className="border-t border-transparent px-8 pb-8 pt-4">
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          {FOOTER_LINKS.map((link) => (
            <a
              key={link}
              href="#"
              className="text-[12px] text-[#8e8e8e] hover:underline"
            >
              {link}
            </a>
          ))}
        </nav>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[12px] text-[#8e8e8e]">
          <button type="button" className="flex items-center gap-1 hover:underline">
            Русский
            <svg
              aria-hidden="true"
              className="h-2 w-2"
              viewBox="0 0 12 12"
              fill="currentColor"
            >
              <path d="M6 8.5L1.5 4h9L6 8.5z" />
            </svg>
          </button>
          <span>© 2026 Instagram from Meta</span>
        </div>
      </footer>
    </div>
  )
}
