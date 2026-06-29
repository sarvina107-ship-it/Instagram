import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PATHS } from '@/shared/config/routes'
import { useRegister } from '@/features/auth'
import Meta from '@/assets/icons/Meta.png'

const FOOTER_LINKS_ROW_1 = [
  'Meta',
  'Информация',
  'Блог',
  'Вакансии',
  'Помощь',
  'API',
  'Конфиденциальность',
  'Условия',
  'Места',
  'Instagram Lite',
]

const FOOTER_LINKS_ROW_2 = [
  'Загрузка контактов и лица, не являющиеся пользователями',
  'Meta Verified',
]

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)
const MONTHS = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
]
const YEARS = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i)

const inputClassName =
  'w-full rounded-lg border border-[#dbdbdb] bg-white px-3 py-2 text-[14px] outline-none placeholder:text-[#8e8e8e] focus:border-[#a8a8a8]'

const selectClassName =
  'w-full appearance-none rounded-lg border border-[#dbdbdb] bg-white px-3 py-2 text-[14px] text-[#262626] outline-none focus:border-[#a8a8a8]'

const labelClassName = 'mb-1 block text-[14px] font-semibold text-black'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { mutate: register, isPending, error } = useRegister()
  const [form, setForm] = useState({
    contact: '',
    password: '',
    birthDay: '',
    birthMonth: '',
    birthYear: '',
    fullName: '',
    username: '',
  })

  const onChange =
    (key: keyof typeof form) =>
    (e: { target: { value: string } }) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    register(
      {
        email: form.contact.trim().toLowerCase(),
        fullName: form.fullName.trim(),
        username: form.username.trim().toLowerCase(),
        password: form.password,
      },
      {
        onSuccess: () => navigate(PATHS.FEED, { replace: true }),
      },
    )
  }

  const isValid =
    form.contact.includes('@') &&
    form.password.length >= 6 &&
    form.birthDay &&
    form.birthMonth &&
    form.birthYear &&
    form.fullName.trim() &&
    form.username.trim()

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#262626]">
      <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col px-4 py-6">
        <div className="relative mb-6 flex items-center justify-center">
          <Link
            to={PATHS.LOGIN}
            className="absolute left-0 flex h-8 w-8 items-center justify-center text-black"
            aria-label="Назад"
          >
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>

          <div className="flex items-center gap-1.5">
            <img src={Meta} alt="Meta" className="h-[16px] w-[16px] object-contain" />
            <span className="text-[14px] font-semibold text-[#0064e0]">Meta</span>
          </div>
        </div>

        <h1 className="mb-2 text-center text-[20px] font-semibold text-black">
          Зарегистрируйтесь в Instagram
        </h1>
        <p className="mb-6 text-center text-[14px] text-[#737373]">
          Зарегистрируйтесь, чтобы смотреть фото и видео ваших друзей.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className={labelClassName}>Мобильный телефон или электронный адрес</label>
            <input
              type="text"
              placeholder="Номер мобильного телефона или электронный адрес"
              value={form.contact}
              onChange={onChange('contact')}
              autoComplete="email tel"
              className={inputClassName}
            />
            <p className="mt-2 text-[12px] leading-[1.4] text-[#737373]">
              Вы можете получать от нас уведомления.{' '}
              <a href="#" className="font-semibold text-[#0095f6] hover:underline">
                Подробнее о том, почему мы запрашиваем вашу контактную информацию
              </a>
            </p>
          </div>

          <div>
            <label className={labelClassName}>Пароль</label>
            <input
              type="password"
              placeholder="Пароль"
              value={form.password}
              onChange={onChange('password')}
              autoComplete="new-password"
              className={inputClassName}
            />
          </div>

          <div>
            <div className="mb-1 flex items-center gap-1">
              <label className="text-[14px] font-semibold text-black">Дата рождения</label>
              <button
                type="button"
                className="flex h-4 w-4 items-center justify-center rounded-full border border-[#737373] text-[10px] font-semibold text-[#737373]"
                aria-label="Справка"
              >
                i
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="relative">
                <select
                  value={form.birthDay}
                  onChange={onChange('birthDay')}
                  className={`${selectClassName} ${!form.birthDay ? 'text-[#8e8e8e]' : ''}`}
                >
                  <option value="" disabled>
                    День
                  </option>
                  {DAYS.map((day) => (
                    <option key={day} value={String(day)}>
                      {day}
                    </option>
                  ))}
                </select>
                <svg
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3 top-1/2 h-2 w-2 -translate-y-1/2 text-[#8e8e8e]"
                  viewBox="0 0 12 12"
                  fill="currentColor"
                >
                  <path d="M6 8.5L1.5 4h9L6 8.5z" />
                </svg>
              </div>
              <div className="relative">
                <select
                  value={form.birthMonth}
                  onChange={onChange('birthMonth')}
                  className={`${selectClassName} ${!form.birthMonth ? 'text-[#8e8e8e]' : ''}`}
                >
                  <option value="" disabled>
                    Месяц
                  </option>
                  {MONTHS.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
                <svg
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3 top-1/2 h-2 w-2 -translate-y-1/2 text-[#8e8e8e]"
                  viewBox="0 0 12 12"
                  fill="currentColor"
                >
                  <path d="M6 8.5L1.5 4h9L6 8.5z" />
                </svg>
              </div>
              <div className="relative">
                <select
                  value={form.birthYear}
                  onChange={onChange('birthYear')}
                  className={`${selectClassName} ${!form.birthYear ? 'text-[#8e8e8e]' : ''}`}
                >
                  <option value="" disabled>
                    Год
                  </option>
                  {YEARS.map((year) => (
                    <option key={year} value={String(year)}>
                      {year}
                    </option>
                  ))}
                </select>
                <svg
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3 top-1/2 h-2 w-2 -translate-y-1/2 text-[#8e8e8e]"
                  viewBox="0 0 12 12"
                  fill="currentColor"
                >
                  <path d="M6 8.5L1.5 4h9L6 8.5z" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className={labelClassName}>Название</label>
            <input
              type="text"
              placeholder="Имя и фамилия"
              value={form.fullName}
              onChange={onChange('fullName')}
              autoComplete="name"
              className={inputClassName}
            />
          </div>

          <div>
            <label className={labelClassName}>Имя пользователя</label>
            <input
              type="text"
              placeholder="Имя пользователя"
              value={form.username}
              onChange={onChange('username')}
              autoComplete="username"
              className={inputClassName}
            />
          </div>

          <p className="text-[12px] leading-[1.5] text-[#737373]">
            Люди, которые пользуются нашим сервисом, могли загрузить вашу контактную информацию в
            Instagram.{' '}
            <a href="#" className="font-semibold text-[#0095f6] hover:underline">
              Подробнее
            </a>
          </p>

          <p className="text-[12px] leading-[1.5] text-[#737373]">
            Нажимая «Отправить», вы принимаете условия{' '}
            <a href="#" className="font-semibold text-[#0095f6] hover:underline">
              Пользовательского соглашения
            </a>
            ,{' '}
            <a href="#" className="font-semibold text-[#0095f6] hover:underline">
              Политики конфиденциальности
            </a>{' '}
            и{' '}
            <a href="#" className="font-semibold text-[#0095f6] hover:underline">
              Политики в отношении файлов cookie
            </a>
            .
          </p>

          <p className="text-[12px] leading-[1.5] text-[#737373]">
            Мы используем предоставленную вами информацию для персонализации контента и рекламы, а
            также для обеспечения безопасности и улучшения нашего сервиса.
          </p>

          {error && (
            <p className="text-center text-[12px] text-red-500">{error.message}</p>
          )}

          <button
            type="submit"
            disabled={!isValid || isPending}
            className="w-full rounded-lg bg-[#0095f6] py-2 text-[14px] font-semibold text-white transition hover:bg-[#0086e0] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? 'Отправка…' : 'Отправить'}
          </button>

          <Link
            to={PATHS.LOGIN}
            className="flex w-full items-center justify-center rounded-lg border border-[#dbdbdb] bg-white py-2 text-[14px] font-semibold text-black transition hover:bg-[#fafafa]"
          >
            У меня уже есть аккаунт
          </Link>
        </form>
      </div>

      <footer className="px-4 pb-8 pt-4">
        <nav className="mb-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
          {FOOTER_LINKS_ROW_1.map((link) => (
            <a key={link} href="#" className="text-[12px] text-[#8e8e8e] hover:underline">
              {link}
            </a>
          ))}
        </nav>
        <nav className="mb-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
          {FOOTER_LINKS_ROW_2.map((link) => (
            <a key={link} href="#" className="text-[12px] text-[#8e8e8e] hover:underline">
              {link}
            </a>
          ))}
        </nav>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[12px] text-[#8e8e8e]">
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
          <span>© 2024 Instagram from Meta</span>
        </div>
      </footer>
    </div>
  )
}
