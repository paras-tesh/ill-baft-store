// لایه داده: فعلاً در localStorage مرورگر ذخیره می‌شود.
// برای اتصال به Supabase کافی است همین توابع را با فراخوانی API جایگزین کنید.
import { useSyncExternalStore } from 'react'
const BASE = import.meta.env?.BASE_URL || '/'
const HERO_D = BASE + 'images/hero-desktop.jpg', HERO_M = BASE + 'images/hero-mobile.jpg'
const CAT_IMG = { c3: BASE + 'images/cat-cushion.jpg', c4: BASE + 'images/cat-runner.jpg', c1: BASE + 'images/cat-canvas.jpg', c2: BASE + 'images/cat-rug.jpg' } // عکس پیش‌فرض دسته‌های کوسن و رانر
const KEY = 'illbaft_v1'
const seed = {
  settings: {
    logo: '', tagline: 'زیبایی ماندگار خانه شما',
    topBar: 'ارسال به سراسر کشور | ضمانت اصالت کالا',
    heroLine1: 'کوسن و رانر از تکه فرش‌های دستباف قدیمی', heroLine2: 'تک نسخه | اصیل', heroImage: HERO_D, heroImageMobile: HERO_M,
    categories: [
      { id: 'c4', name: 'رانر و رومیزی', image: CAT_IMG.c4 }, { id: 'c3', name: 'کوسن', image: CAT_IMG.c3 },
      { id: 'c2', name: 'فرشینه', image: CAT_IMG.c2 }, { id: 'c1', name: 'بوم‌فرش', image: CAT_IMG.c1 }],
    promoTitle: 'تلفیق هنر سنتی و زندگی مدرن', promoSub: 'با محصولات خاص و دستساز ایل بافت', promoImage: '',
  },
  products: [
    { id: 'p1', name: 'کوسن طرح ترنج', price: 850000, categoryId: 'c3', stock: 1, createdAt: 1, desc: 'کوسن دوخته‌شده از تکه فرش دستباف.', image: '' },
    { id: 'p2', name: 'رانر طرح لچک‌ترنج', price: 2400000, categoryId: 'c4', stock: 1, createdAt: 2, desc: 'رانر تک‌نسخه با رنگ سرمه‌ای و زرشکی.', image: '' }],
  reviews: [{ id: 'r1', name: 'مریم', rating: 5, text: 'کیفیت عالی بود و خیلی سریع رسید.', approved: true, date: Date.now() }],
  users: [],
  session: null, isAdmin: false, carts: {}, orders: [], v: 9,
}
let state
try { state = JSON.parse(localStorage.getItem(KEY)) || seed } catch { state = seed }
if ((state.v || 0) < 2) { // مهاجرت داده‌های قدیمی: نام و ترتیب جدید دسته‌ها
  const order = ['رانر و رومیزی', 'کوسن', 'فرشینه', 'بوم‌فرش'], idx = n => (order.indexOf(n) < 0 ? 9 : order.indexOf(n))
  state.settings.categories.forEach(c => { if (c.name === 'بومفرش') c.name = 'بوم‌فرش' })
  state.products.forEach(p => { if (p.category === 'بومفرش') p.category = 'بوم‌فرش' })
  state.settings.categories.sort((a, b) => idx(a.name) - idx(b.name)); state.v = 2
}
if (state.v < 3) { state.cart = []; state.v = 3 } // سبد خرید حالا لیستی از {id, qty} است
if (state.v < 4) { // کاربران: نام/نام خانوادگی/موبایل/آدرس‌ها و لیست سفارش‌ها
  state.orders = state.orders || []
  state.users.forEach(u => { u.firstName = u.firstName ?? u.name ?? ''; u.lastName = u.lastName ?? ''; u.phone = u.phone ?? ''; u.addresses = u.addresses || [] })
  state.v = 4
}
if (state.v < 5) { // دسته با id، موجودی، تاریخ ایجاد، سبد خرید هر کاربر
  const cats = state.settings.categories
  state.products.forEach((p, i) => { if (!p.categoryId) p.categoryId = (cats.find(c => c.name === p.category) || cats[0]).id; delete p.category; p.stock = p.stock ?? 1; p.createdAt = p.createdAt ?? Date.now() - i })
  state.carts = { guest: Array.isArray(state.cart) ? state.cart : [] }; delete state.cart; state.v = 5
}
if (state.v < 6) { // عکس پیش‌فرض بنر اصلی: دسکتاپ و موبایل (public/images)
  state.settings.heroImage = state.settings.heroImage || HERO_D
  state.settings.heroImageMobile = state.settings.heroImageMobile || HERO_M
  state.v = 6
}
if (state.v < 7) { // عکس پیش‌فرض دسته‌های کوسن و رانر (فقط اگر عکسی نداشته باشند)
  state.settings.categories.forEach(c => { if (!c.image && CAT_IMG[c.id]) c.image = CAT_IMG[c.id] })
  state.v = 7
}
if (state.v < 8) { // عکس پیش‌فرض دسته بوم‌فرش
  state.settings.categories.forEach(c => { if (!c.image && CAT_IMG[c.id]) c.image = CAT_IMG[c.id] })
  state.v = 8
}
if (state.v < 9) { // عکس پیش‌فرض دسته فرشینه
  state.settings.categories.forEach(c => { if (!c.image && CAT_IMG[c.id]) c.image = CAT_IMG[c.id] })
  state.v = 9
}
const subs = new Set()
export const get = () => state
export function update(fn) {
  state = fn(structuredClone(state))
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { alert('حافظه مرورگر پر شد؛ عکس کوچک‌تری انتخاب کنید.') }
  subs.forEach(s => s())
}
export const useStore = () => useSyncExternalStore(cb => (subs.add(cb), () => subs.delete(cb)), get)
const uid = () => Math.random().toString(36).slice(2, 9)

export const currentUser = s => s.users.find(u => u.id === s.session)
const normId = v => String(v).trim().replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[\s-]/g, '').toLowerCase()
export const fullName = u => `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || u.phone
export function login(id, password) {
  const k = normId(id)
  const u = get().users.find(u => (u.phone === k || (u.email && u.email.toLowerCase() === k)) && u.password === password)
  if (!u) return 'شماره موبایل/ایمیل یا رمز عبور اشتباه است.'
  update(s => (s.session = u.id, mergeGuest(s), s))
}
export function signup({ firstName, lastName, phone, email, password }) {
  phone = normId(phone); email = (email || '').trim().toLowerCase()
  if (!/^09\d{9}$/.test(phone)) return 'شماره موبایل معتبر نیست (مثال: 09123456789).'
  if (get().users.some(u => u.phone === phone)) return 'این شماره قبلاً ثبت‌نام کرده است.'
  if (email && get().users.some(u => u.email === email)) return 'این ایمیل قبلاً ثبت شده است.'
  if (password.length < 6) return 'رمز عبور حداقل ۶ کاراکتر باشد.'
  const id = uid()
  update(s => (s.users.push({ id, firstName: firstName.trim(), lastName: lastName.trim(), phone, email, password, addresses: [], role: 'user' }), s.session = id, mergeGuest(s), s))
}
export const logout = () => update(s => (s.session = null, s))
// ورود مدیر فقط با رمز (فعلاً در سمت مرورگر؛ برای نسخه واقعی باید سمت سرور چک شود)
const ADMIN_PASSWORD = 'admin123'
export function adminLogin(pw) { if (pw !== ADMIN_PASSWORD) return 'رمز اشتباه است.'; update(s => (s.isAdmin = true, s)) }
export const adminLogout = () => update(s => (s.isAdmin = false, s))
export const saveSettings = patch => update(s => (Object.assign(s.settings, patch), s))
export const saveProduct = p => update(s => {
  const i = s.products.findIndex(x => x.id === p.id)
  i >= 0 ? (s.products[i] = p) : s.products.unshift({ ...p, id: uid(), createdAt: Date.now() }); return s })
export const deleteProduct = id => update(s => (s.products = s.products.filter(p => p.id !== id), s))
export const addReview = r => update(s => (s.reviews.unshift({ ...r, id: uid(), approved: false, date: Date.now() }), s))
export const approveReview = id => update(s => (s.reviews.find(r => r.id === id).approved = true, s))
export const deleteReview = id => update(s => (s.reviews = s.reviews.filter(r => r.id !== id), s))
export const updateProfile = patch => update(s => (Object.assign(currentUser(s), patch), s))
export const saveAddress = a => update(s => { const u = currentUser(s), i = u.addresses.findIndex(x => x.id === a.id); i >= 0 ? (u.addresses[i] = a) : u.addresses.push({ ...a, id: uid() }); return s })
export const deleteAddress = id => update(s => (currentUser(s).addresses = currentUser(s).addresses.filter(a => a.id !== id), s))
export const STATUS = { pending: 'در انتظار پرداخت', paid: 'پرداخت‌شده', shipped: 'ارسال‌شده', canceled: 'لغو‌شده' }

export const fa = n => String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d])
export const money = n => fa(Number(n).toLocaleString('en-US')).replace(/,/g, '٬') + ' تومان'
export function readImage(file, max = 1000, type = 'image/jpeg') {
  return new Promise(res => {
    const r = new FileReader()
    r.onload = () => {
      const i = new Image()
      i.onload = () => {
        const k = Math.min(1, max / Math.max(i.width, i.height))
        const c = document.createElement('canvas'); c.width = i.width * k; c.height = i.height * k
        c.getContext('2d').drawImage(i, 0, 0, c.width, c.height); res(c.toDataURL(type, 0.75))
      }
      i.src = r.result
    }
    r.readAsDataURL(file)
  })
}

// ---- سبد خرید (برای هر کاربر جدا؛ مهمان با کلید guest) ----
const ck = s => s.session || 'guest'
export const getCart = s => s.carts[ck(s)] || []
export const cartCount = s => getCart(s).reduce((n, i) => n + i.qty, 0)
export const catName = (s, p) => s.settings.categories.find(c => c.id === p.categoryId)?.name || ''
export const usedPct = s => Math.min(100, Math.round(JSON.stringify(s).length / 50000))
export const GATEWAY_READY = false // وقتی درگاه وصل شد true شود تا دکمه «پرداخت» نمایش داده شود
function mergeGuest(s) {
  const g = s.carts.guest || [], mine = (s.carts[s.session] = s.carts[s.session] || [])
  g.forEach(i => { const x = mine.find(m => m.id === i.id); x ? (x.qty += i.qty) : mine.push(i) })
  s.carts.guest = []
}
export function addToCart(id) {
  const p = get().products.find(p => p.id === id)
  if (!p) return 'محصول پیدا نشد.'
  const have = getCart(get()).find(i => i.id === id)?.qty || 0
  if (have + 1 > (p.stock ?? 0)) return p.stock > 0 ? `حداکثر موجودی این محصول ${p.stock} عدد است.` : 'این محصول ناموجود است.'
  update(s => { const k = ck(s), c = (s.carts[k] = s.carts[k] || []), i = c.find(x => x.id === id); i ? i.qty++ : c.push({ id, qty: 1 }); return s })
}
export const setQty = (id, qty) => update(s => {
  const k = ck(s), c = s.carts[k] || [], p = s.products.find(p => p.id === id)
  if (qty < 1) s.carts[k] = c.filter(x => x.id !== id)
  else c.find(x => x.id === id).qty = Math.min(qty, p?.stock ?? qty)
  return s
})
export const removeFromCart = id => update(s => (s.carts[ck(s)] = (s.carts[ck(s)] || []).filter(x => x.id !== id), s))
export function placeOrder(addressId) { // موفق: شیء سفارش، ناموفق: متن خطا
  const s0 = get(), u = currentUser(s0), a = u?.addresses.find(x => x.id === addressId)
  const items = getCart(s0).map(i => { const p = s0.products.find(p => p.id === i.id); return p && { id: p.id, name: p.name, price: p.price, qty: i.qty } }).filter(Boolean)
  if (!u || !a || !items.length) return 'اطلاعات سفارش کامل نیست.'
  const short = items.find(i => i.qty > (s0.products.find(p => p.id === i.id).stock ?? 0))
  if (short) return `موجودی «${short.name}» کافی نیست؛ تعداد را کم کنید.`
  const o = { id: uid(), no: 1001 + s0.orders.length, userId: u.id, items, total: items.reduce((n, i) => n + i.price * i.qty, 0), address: a, status: 'pending', date: Date.now() }
  update(s => { s.orders.unshift(o); items.forEach(i => { s.products.find(p => p.id === i.id).stock -= i.qty }); s.carts[ck(s)] = []; return s })
  return o
}
export const updateOrder = (id, patch) => update(s => {
  const o = s.orders.find(o => o.id === id)
  if (patch.status === 'canceled' && o.status !== 'canceled') o.items.forEach(i => { const p = s.products.find(p => p.id === i.id); if (p) p.stock += i.qty }) // لغو سفارش = برگشت موجودی
  Object.assign(o, patch); return s
})
