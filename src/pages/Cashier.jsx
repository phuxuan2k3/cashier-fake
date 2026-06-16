import { useState, useEffect } from 'react'
import { flushSync } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { PAYMENT_METHODS } from '../data/paymentMethods'
import { calculateFees, formatVND } from '../utils/feeCalculator'
import feesConfig from '../config/fees.json'

export default function Cashier() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state

  const [showDetail, setShowDetail] = useState(false)
  const [showFeeTooltip, setShowFeeTooltip] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState(PAYMENT_METHODS[0])
  const [showAllPayments, setShowAllPayments] = useState(false)

  // Smoothly morph between screens (amount slides to its new spot, page crossfades)
  const transition = (update) => {
    if (typeof document !== 'undefined' && document.startViewTransition) {
      document.startViewTransition(() => flushSync(update))
    } else {
      update()
    }
  }

  useEffect(() => {
    if (!state) navigate('/')
  }, [state, navigate])

  if (!state) return null

  const { orderType, recipient, amount } = state

  const fees = calculateFees(feesConfig.rules, orderType.id, selectedPayment.id, amount)
  const totalAmount = amount + fees.total
  const isInsufficient = selectedPayment.balance < totalAmount && selectedPayment.type !== 'card' && selectedPayment.type !== 'qr'

  const displayedPayments = showAllPayments ? PAYMENT_METHODS : PAYMENT_METHODS.slice(0, 4)

  // ——— Processing screen (shown briefly before success) ———
  if (isProcessing) {
    return (
      <div className="min-h-screen bg-[#F5F3FF]">
        <div className="max-w-[430px] mx-auto min-h-screen flex flex-col">

          {/* Gradient header — identical to confirm/success */}
          <div className="bg-gradient-to-b from-primary-100 to-[#F5F3FF] px-5 pt-12 pb-6">

            {/* Spinning status icon */}
            <div className="relative w-14 h-14 mb-6">
              <span className="absolute inset-0 rounded-full bg-primary-300/40 animate-ring-pulse" />
              <svg className="relative w-14 h-14 spinner-ring" viewBox="0 0 50 50">
                <circle cx="25" cy="25" r="20" fill="none" stroke="#ddd6fe" strokeWidth="5" />
                <circle cx="25" cy="25" r="20" fill="none" stroke="#7c3aed" strokeWidth="5" strokeLinecap="round" strokeDasharray="36 120" />
              </svg>
            </div>

            {/* Title */}
            <h2 className="text-[26px] font-extrabold text-slate-800 font-cute leading-tight">
              Giao dịch đang xử lý
            </h2>
            <p className="text-sm text-slate-400 mt-1.5">
              {orderType.name} · {recipient}
            </p>

            {/* Amount — shared element that morphs across screens */}
            <div className="mt-5 flex items-end gap-1" style={{ viewTransitionName: 'vt-amount' }}>
              <span className="text-[42px] font-black text-primary-700 leading-none amount-text">
                {formatVND(totalAmount)}
              </span>
              <span className="text-xl font-bold text-primary-400 mb-1">đ</span>
            </div>

            {/* Chips */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <button
                onClick={() => setShowDetail(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary-200 bg-white/60 backdrop-blur text-primary-600 text-xs font-semibold hover:bg-white transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Chi tiết đơn hàng
              </button>
              {fees.total > 0 ? (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 text-orange-500 text-xs font-semibold">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Phí {formatVND(fees.total)}đ
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-100 text-primary-600 text-xs font-semibold">
                  🎉 Miễn phí
                </span>
              )}
            </div>
          </div>

          {/* Content on the same purple background */}
          <div className="flex-1 px-4 pt-3 pb-10">
            {showDetail && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-2.5 mb-3 animate-fade-up">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Số tiền gốc</span>
                  <span className="font-semibold text-slate-700">{formatVND(amount)}đ</span>
                </div>
                {fees.items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-slate-400">{item.label}</span>
                    <span className="font-semibold text-orange-500">+{formatVND(item.amount)}đ</span>
                  </div>
                ))}
                <div className="border-t border-slate-100 pt-2.5 flex justify-between text-sm">
                  <span className="font-bold text-slate-700">Tổng</span>
                  <span className="font-bold text-primary-600">{formatVND(totalAmount)}đ</span>
                </div>
              </div>
            )}

            {/* Reassurance card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-4 py-4 flex items-center gap-3">
              <span className="flex items-center gap-1.5 flex-shrink-0">
                <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" />
              </span>
              <p className="text-sm text-slate-500 leading-snug">
                Đang kết nối tới nhà cung cấp, vui lòng chờ trong giây lát…
              </p>
            </div>
          </div>

          {/* Bottom close button */}
          <div className="px-4 pb-8">
            <button
              onClick={() => navigate('/')}
              className="w-full py-4 rounded-2xl bg-white border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 active:scale-[0.98] transition-all"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (showSuccess) {
    const now = new Date()
    const txId = '#' + now.getFullYear().toString().slice(2) +
      String(now.getMonth()+1).padStart(2,'0') +
      String(now.getDate()).padStart(2,'0') +
      String(Math.floor(Math.random()*1000000000)).padStart(9,'0')
    const timeStr = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0')
    const dateStr = String(now.getDate()).padStart(2,'0') + '/' + String(now.getMonth()+1).padStart(2,'0') + '/' + now.getFullYear()

    const upsellOffers = [
      { label: 'Cashback 5%', desc: 'Khi thanh toán hóa đơn lần tiếp theo', tag: '-5%', originalPrice: null },
      { label: 'Miễn phí 1 giao dịch', desc: 'Cho đơn hàng từ 200.000đ', tag: 'FREE', originalPrice: null },
      { label: 'Giảm 10.000đ', desc: 'Áp dụng cho thẻ điện thoại', tag: '-10K', originalPrice: null },
    ]
    const randomOffer = upsellOffers[now.getSeconds() % upsellOffers.length]

    return (
      <div className="min-h-screen bg-[#F5F3FF]">
        <div className="max-w-[430px] mx-auto min-h-screen flex flex-col">

          {/* Top success header with gradient */}
          <div className="relative bg-gradient-to-b from-primary-100 to-[#F5F3FF] px-5 pt-12 pb-6 overflow-hidden">
            {/* sparkles */}
            <span className="absolute left-14 top-10 text-primary-400 text-lg animate-sparkle">✦</span>
            <span className="absolute left-2 top-24 text-primary-300 text-sm animate-sparkle delay-300">✦</span>
            <span className="absolute right-10 top-16 text-primary-400 text-base animate-sparkle delay-500">✦</span>

            {/* Animated check badge */}
            <div className="relative w-16 h-16 mb-5">
              <span className="absolute inset-0 rounded-full bg-primary-400/30 animate-ring-pulse" />
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-200 animate-pop-bounce">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path className="draw-check" strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800 mb-3 font-cute animate-fade-up">Giao dịch thành công 🎉</h2>
            <div className="space-y-1">
              <p className="text-sm text-slate-500">
                Mã giao dịch:{' '}
                <span className="text-primary-600 font-semibold">{txId}</span>
                <span className="text-primary-400 ml-1">›</span>
              </p>
              <p className="text-sm text-slate-500">Thời gian: {timeStr} {dateStr}</p>
              <p className="text-sm text-slate-500">{orderType.name} {recipient}</p>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 px-5 pb-32">
            {/* Large amount */}
            <div className="flex items-end gap-1 mb-4" style={{ viewTransitionName: 'vt-amount' }}>
              <span className="text-[46px] font-black text-primary-700 leading-none amount-text">
                {formatVND(totalAmount)}
              </span>
              <span className="text-2xl font-bold text-primary-500 mb-1">đ</span>
            </div>

            {/* Chi tiết đơn hàng toggle */}
            <button
              onClick={() => setShowDetail(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-slate-500 text-xs font-semibold mb-5 hover:bg-slate-100 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Chi tiết đơn hàng
              <svg className={`w-3 h-3 transition-transform ${showDetail ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showDetail && (
              <div className="bg-slate-50 rounded-2xl p-4 mb-4 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Dịch vụ</span>
                  <span className="font-semibold text-slate-700">{orderType.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">{orderType.recipientLabel}</span>
                  <span className="font-semibold text-slate-700">{recipient}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Phương thức</span>
                  <span className="font-semibold text-slate-700">{selectedPayment.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Số tiền gốc</span>
                  <span className="font-semibold text-slate-700">{formatVND(amount)}đ</span>
                </div>
                {fees.items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-slate-400">{item.label}</span>
                    <span className="font-semibold text-orange-500">+{formatVND(item.amount)}đ</span>
                  </div>
                ))}
                <div className="border-t border-slate-200 pt-2.5 flex justify-between text-sm">
                  <span className="font-bold text-slate-700">Tổng</span>
                  <span className="font-bold text-primary-600">{formatVND(totalAmount)}đ</span>
                </div>
              </div>
            )}

            {/* Upsell card */}
            <div className="bg-primary-50 rounded-2xl p-4 mb-5 flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm text-slate-700 leading-snug mb-2">
                  Nhận <span className="font-bold text-primary-600">{randomOffer.label}</span> {randomOffer.desc}
                </p>
                <button className="text-sm font-bold text-primary-600 flex items-center gap-0.5 hover:text-primary-700">
                  Xem chi tiết
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center text-2xl flex-shrink-0">
                🎁
              </div>
            </div>

            {/* Ưu đãi section */}
            <p className="text-sm font-bold text-slate-700 mb-3">Ưu đãi của bạn</p>
            <div className="space-y-3">
              {[
                { icon: '💳', name: 'Hoàn tiền Túi', desc: 'Dành cho thành viên mới', price: '10đ', original: '500đ', discount: '-98%' },
                { icon: '🎯', name: 'Ưu đãi nạp thẻ', desc: 'Cho đơn từ 100.000đ', price: '0đ', original: '5.000đ', discount: '-100%' },
              ].map((offer, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="w-11 h-11 rounded-xl bg-primary-100 flex items-center justify-center text-xl flex-shrink-0">
                    {offer.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{offer.name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{offer.desc}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs font-bold text-emerald-600">{offer.price}</span>
                      <span className="text-[10px] text-slate-300 line-through">{offer.original}</span>
                      <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">{offer.discount}</span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom fixed buttons */}
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-slate-100 px-4 py-4 flex gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              Đóng
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 py-3.5 rounded-2xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 transition-colors shadow-lg shadow-primary-100"
            >
              Thanh toán thêm
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F3FF]">
      <div className="max-w-[430px] mx-auto min-h-screen flex flex-col relative">

        {/* Top gradient header */}
        <div className="bg-gradient-to-b from-primary-100 to-[#F5F3FF] px-5 pt-12 pb-6">

          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-white/70 backdrop-blur flex items-center justify-center mb-6 shadow-sm"
          >
            <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Order info header */}
          <div className="flex items-start gap-3 animate-fade-up">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm animate-float"
              style={{ backgroundColor: orderType.color + '20' }}
            >
              {orderType.icon}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 leading-tight font-cute">{orderType.name}</h2>
              <p className="text-sm text-slate-400 mt-0.5">{recipient}</p>
            </div>
          </div>

          {/* Large amount */}
          <div className="mt-6 mb-1 flex items-end gap-1" style={{ viewTransitionName: 'vt-amount' }}>
            <span className="text-[42px] font-black text-primary-700 leading-none amount-text">
              {formatVND(totalAmount)}
            </span>
            <span className="text-xl font-bold text-slate-300 mb-1">đ</span>
          </div>

          {/* Chi tiết đơn hàng toggle */}
          <button
            onClick={() => setShowDetail(v => !v)}
            className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary-200 bg-white/60 backdrop-blur text-primary-600 text-xs font-semibold transition-all hover:bg-white"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Chi tiết đơn hàng
            <svg
              className={`w-3 h-3 transition-transform ${showDetail ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col px-4 gap-3 pb-36">

          {/* Order detail card - collapsible */}
          {showDetail && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-50">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Chi tiết đơn hàng</p>
              </div>
              <div className="px-4 py-3 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Loại dịch vụ</span>
                  <span className="font-semibold text-slate-700">{orderType.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">{orderType.recipientLabel}</span>
                  <span className="font-semibold text-slate-700">{recipient}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Số tiền gốc</span>
                  <span className="font-semibold text-slate-700">{formatVND(amount)}đ</span>
                </div>
                {fees.items.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Tổng phí</span>
                    <span className="font-semibold text-orange-500">+{formatVND(fees.total)}đ</span>
                  </div>
                )}
                <div className="flex justify-between text-sm border-t border-slate-100 pt-2.5">
                  <span className="font-bold text-slate-700">Tổng thanh toán</span>
                  <span className="font-bold text-primary-600">{formatVND(totalAmount)}đ</span>
                </div>
              </div>
            </div>
          )}

          {/* Fee row */}
          <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
                <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-slate-600">
                {fees.total > 0 ? `Phí: ${formatVND(fees.total)}đ` : 'Miễn phí'}
              </span>
            </div>
            {fees.items.length > 0 && (
              <button
                onClick={() => setShowFeeTooltip(v => !v)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            )}

            {/* Fee tooltip */}
            {showFeeTooltip && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowFeeTooltip(false)}
                />
                <div className="absolute right-0 bottom-full mb-3 z-50 w-72 bg-[#1b3a8c] text-white rounded-2xl px-4 py-3.5 shadow-2xl">
                  <p className="text-sm font-semibold leading-snug mb-2">Chi tiết phí</p>
                  {fees.items.map(item => (
                    <p key={item.id} className="text-sm leading-relaxed">
                      {item.label}: <span className="font-bold">+{formatVND(item.amount)}đ</span>
                    </p>
                  ))}
                  {/* Triangle arrow pointing down toward ? button */}
                  <div className="absolute right-3 top-full w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-[#1b3a8c]" />
                </div>
              </>
            )}
          </div>

          {/* Payment methods section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-4 pt-4 pb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-slate-700">Phương thức thanh toán</p>
              <button
                onClick={() => setShowAllPayments(v => !v)}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700"
              >
                {showAllPayments ? 'Thu gọn' : 'Xem tất cả'}
              </button>
            </div>
            <div className="px-3 pb-3 grid grid-cols-2 gap-2">
              {displayedPayments.map(method => {
                const isSelected = selectedPayment.id === method.id
                const methodInsufficient = method.balance < totalAmount && method.type !== 'card' && method.type !== 'qr'
                return (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPayment(method)}
                    className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-primary-400 bg-primary-50 shadow-sm'
                        : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ backgroundColor: method.bgColor }}
                    >
                      {method.icon}
                    </div>
                    <div className="text-left min-w-0">
                      <p className={`text-xs font-semibold truncate ${isSelected ? 'text-primary-700' : 'text-slate-700'}`}>
                        {method.shortName}
                      </p>
                      {method.type !== 'card' && method.type !== 'qr' ? (
                        <p className={`text-[10px] font-medium mt-0.5 ${methodInsufficient ? 'text-red-400' : 'text-slate-400'}`}>
                          {formatVND(method.balance)}đ
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-400 mt-0.5">Không giới hạn</p>
                      )}
                    </div>
                    {methodInsufficient && (
                      <span className="ml-auto flex-shrink-0">
                        <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Insufficient balance error */}
          {isInsufficient && (
            <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-sm font-medium text-red-600">
                Số dư không đủ: {formatVND(selectedPayment.balance)}đ
              </p>
            </div>
          )}
        </div>

        {/* Bottom fixed area */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-gradient-to-t from-[#F5F3FF] via-[#F5F3FF] to-transparent px-4 pt-6 pb-8">
          <button
            disabled={isInsufficient || isProcessing}
            onClick={() => {
              setShowFeeTooltip(false)
              transition(() => setIsProcessing(true))
              setTimeout(() => {
                transition(() => {
                  setIsProcessing(false)
                  setShowSuccess(true)
                })
              }, 2400)
            }}
            className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
              isInsufficient
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700 active:scale-[0.97] text-white shadow-lg shadow-primary-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Xác nhận thanh toán
          </button>
          <p className="text-center text-[10px] text-slate-400 mt-3 flex items-center justify-center gap-1.5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Bảo mật & An toàn là ưu tiên hàng đầu · PCI DSS
          </p>
        </div>

      </div>
    </div>
  )
}
