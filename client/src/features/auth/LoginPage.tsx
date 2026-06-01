import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../stores/auth.store'
import { authApi } from './api'
import { LoginInput } from './types'

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
})

export function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true)
    try {
      const res = await authApi.login(data)
      const { user, access_token } = res.data.data
      setAuth(user, access_token)
      toast.success(`Selamat datang, ${user.name}!`)
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Login gagal, periksa email dan password Anda'
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-2xl mb-4 shadow-md">
            <span className="text-3xl select-none">🍊</span>
          </div>
          <h1 className="text-2xl font-bold text-stone-900">POS O-JERUK</h1>
          <p className="text-sm text-stone-500 mt-1">Sistem Kasir Multi Cabang</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
          <h2 className="text-lg font-semibold text-stone-900 mb-5">Masuk ke Akun</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-stone-700">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="nama@email.com"
                autoComplete="email"
                disabled={isLoading}
                className={`w-full border rounded-lg h-10 px-3 text-sm bg-white
                  focus:outline-none focus:ring-2 transition-all placeholder:text-stone-400
                  disabled:opacity-60 disabled:cursor-not-allowed
                  ${errors.email
                    ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
                    : 'border-stone-300 focus:border-orange-400 focus:ring-orange-400/20'
                  }`}
              />
              {errors.email && (
                <p className="text-[13px] text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-stone-700">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isLoading}
                  className={`w-full border rounded-lg h-10 px-3 pr-10 text-sm bg-white
                    focus:outline-none focus:ring-2 transition-all placeholder:text-stone-400
                    disabled:opacity-60 disabled:cursor-not-allowed
                    ${errors.password
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
                      : 'border-stone-300 focus:border-orange-400 focus:ring-orange-400/20'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                >
                  {showPassword
                    ? <EyeOff size={16} />
                    : <Eye size={16} />
                  }
                </button>
              </div>
              {errors.password && (
                <p className="text-[13px] text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700
                text-white rounded-lg h-10 font-medium text-sm transition-all duration-150
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2 mt-1"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Sedang masuk...
                </>
              ) : (
                'Masuk'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[13px] text-stone-400 mt-6">
          Fezora Technology &copy; 2026
        </p>
      </div>
    </div>
  )
}
