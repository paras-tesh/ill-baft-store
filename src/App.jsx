import { useState, useEffect, useContext, useRef, createContext } from 'react'
import { Routes, Route, Link, NavLink, useNavigate, useLocation, useParams, Navigate } from 'react-router-dom'
import * as S from './store.js'
import Admin from './Admin.jsx'

const Ic = ({ d, size = 22 }) => <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
const HomeI = <Ic d={<path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-8z" />} />
const Grid = <Ic d={<><rect x="4" y="4" width="16" height="7" rx="2" /><rect x="4" y="13" width="16" height="7" rx="2" /></>} />
const SearchI = <Ic d={<><circle cx="11" cy="11" r="6" /><path d="M20 20l-4-4" /></>} />
const UserI = <Ic d={<><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>} />
const Bag = <Ic d={<><path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>} />
const Box = <Ic size={20} d={<><path d="M12 3l8 4v10l-8 4-8-4V7l8-4z" /><path d="M4 7l8 4 8-4M12 11v10" /></>} />
const Shield = <Ic size={20} d={<><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" /><path d="M9 12l2 2 4-4" /></>} />
const Card = <Ic size={20} d={<><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18M7 15h4" /></>} />

const css_ = x => (x ? `url(${x})` : 'none')
const bg = img => (img ? { backgroundImage: `url(${img})` } : {})
const Q = createContext({ q: '' })
const scrollTo_ = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

function Layout({ children }) {
  const s = S.useStore(), u = S.currentUser(s), { settings: st } = s
  const go = useNavigate(), loc = useLocation(), home = loc.pathname === '/'
  const [q, setQ] = useState(''), [open, setOpen] = useState(false), popRef = useRef(null), skipClose = useRef(false)
  const goto = id => { if (!home) go('/'); setTimeout(() => scrollTo_(id), 60) }
  const top = () => { setOpen(false); setQ(''); go('/'); scrollTo({ top: 0, behavior: 'smooth' }) }
  const onSearch = v => { setQ(v); if (!home) { skipClose.current = true; go('/') } }
  const submit = e => { e.preventDefault(); setOpen(false); if (!home) go('/'); setTimeout(() => scrollTo_('products'), 60) }
  const userPage = ['/login', '/signup', '/profile'].includes(loc.pathname)
  useEffect(() => { // بستن جعبه جستجو با کلیک بیرون یا Esc
    if (!open) return
    const onDown = e => { if (popRef.current?.contains(e.target) || e.target.closest?.('[data-search-toggle]')) return; setOpen(false) }
    const onKey = e => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', onDown); document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])
  useEffect(() => { if (skipClose.current) { skipClose.current = false; return } setOpen(false) }, [loc.pathname]) // با تغییر صفحه، جعبه جستجو بسته شود
  useEffect(() => { const close = () => setOpen(false); addEventListener('popstate', close); return () => removeEventListener('popstate', close) }, []) // دکمه بازگشت مرورگر
  return (<Q.Provider value={{ q, clear: () => setQ('') }}>
    <div className="topbar">{st.topBar}</div>
    <header className="header"><div className="wrap bar">
      <Link to="/" className="logo">
        {st.logo ? <img src={st.logo} alt="ایل بافت" /> : <b>ایل بافت</b>}
        <small>{st.tagline}</small>
      </Link>
      <nav>
        <NavLink to="/" end>صفحه اصلی</NavLink>
        <button className="lnk" onClick={() => goto('products')}>محصولات</button>
        <button className="lnk" onClick={() => goto('reviews')}>نظرات</button>
      </nav>
      <div className="acts">
        <button className="iconbtn" data-search-toggle onClick={() => setOpen(!open)} title="جستجو" aria-label="جستجو" aria-expanded={open}>{SearchI}</button>
        <Link to="/cart" className="iconbtn cart" title="سبد خرید" aria-label="سبد خرید">{Bag}<i>{S.fa(S.cartCount(s))}</i></Link>
        {u ? <Link className="btn sm ghost" to="/profile">{S.fullName(u)}</Link>
          : <><Link className="btn sm ghost" to="/login">ورود</Link><Link className="btn sm" to="/signup">ثبت‌نام</Link></>}
      </div>
    </div>
    {open && <form className="searchpop" ref={popRef} role="search" onSubmit={submit}>
      <span className="sicon">{SearchI}</span>
      <input autoFocus placeholder="جستجوی محصول…" value={q} onChange={e => onSearch(e.target.value)} aria-label="جستجوی محصول" />
      {q && <button type="button" className="sclear" aria-label="پاک کردن" onClick={() => setQ('')}>×</button>}
    </form>}
    </header>
    {children}
    <footer className="footer">© ایل بافت — فروشگاه فرش و محصولات دستباف</footer>
    <div className="dock"><span>{Box}ارسال سریع به سراسر کشور</span><span>{Shield}ضمانت اصالت کالا</span><span>{Card}پرداخت امن و مطمئن</span></div>
    <div className="tabbar" role="navigation" aria-label="ناوبری موبایل">
      <button className={home && !open ? 'on' : ''} onClick={top}><span className="ico">{HomeI}</span>خانه</button>
      <button onClick={() => goto('cats')}><span className="ico">{Grid}</span>دسته‌بندی‌ها</button>
      <button className={open ? 'on' : ''} data-search-toggle onClick={() => setOpen(!open)}><span className="ico">{SearchI}</span>جستجو</button>
      <button className={loc.pathname === '/cart' ? 'on' : ''} onClick={() => go('/cart')}><span className="ico">{Bag}<i>{S.fa(S.cartCount(s))}</i></span>سبد خرید</button>
      <button className={userPage ? 'on' : ''} onClick={() => go(u ? '/profile' : '/login')}><span className="ico">{UserI}</span>{u ? (u.firstName || 'پروفایل') : 'پروفایل'}</button>
    </div>
  </Q.Provider>)
}

function Reviews({ s, u, productId }) {
  const [f, setF] = useState({ rating: 5, text: '' }), [sent, setSent] = useState(false), [msg, setMsg] = useState('')
  const list = s.reviews.filter(r => r.approved && (!productId || r.productId === productId))
  const submit = e => {
    e.preventDefault()
    const r = S.addReview({ name: S.fullName(u), productId, rating: +f.rating, text: f.text })
    if (r) { setMsg(r); setSent(false); return }
    setF({ rating: 5, text: '' }); setSent(true); setMsg('')
  }
  return (<section id="reviews" className={'sec' + (productId ? '' : ' wrap')}>
    <h2 className="title">{productId ? 'نظرات درباره این محصول' : 'نظرات مشتریان'}</h2>
    <div className="grid g3">{list.map(r => <div className="card pad" key={r.id}>
      <div className="stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div><p>{r.text}</p><small>{r.name}</small>
      {!productId && r.productId && <small> — درباره: {s.products.find(p => p.id === r.productId)?.name}</small>}</div>)}
      {!list.length && <p>هنوز نظری ثبت نشده است.</p>}</div>
    <div className="card pad formbox">
      {u ? <form onSubmit={submit}><h3>نظر شما</h3>
        <select value={f.rating} onChange={e => setF({ ...f, rating: e.target.value })}>{[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{S.fa(n)} ستاره</option>)}</select>
        <textarea required placeholder="نظر خود را بنویسید…" value={f.text} onChange={e => setF({ ...f, text: e.target.value })} />
        <button className="btn">ارسال نظر</button>
        {msg && <p className="err">{msg}</p>}
        {sent && <p className="ok">نظر شما ثبت شد و پس از تایید مدیر نمایش داده می‌شود.</p>}</form>
        : <p>برای ثبت نظر ابتدا <Link to="/login" state={{ from: productId ? `/product/${productId}` : '/' }}>وارد شوید</Link>.</p>}
    </div>
  </section>)
}

function ProductCard({ p, s }) {
  const [added, setAdded] = useState(''), out = !(p.stock > 0)
  const add = () => { const r = S.addToCart(p.id); setAdded(r || 'ok'); setTimeout(() => setAdded(''), 1600) }
  return (<article className="card">
    <Link to={`/product/${p.id}`} className="pimg" style={bg(p.image)} aria-label={p.name}>
      {p.stock === 1 && <span className="tag">تک‌نسخه</span>}{out && <span className="tag sold">ناموجود</span>}</Link>
    <div className="pad"><h3><Link to={`/product/${p.id}`}>{p.name}</Link></h3><small>{S.catName(s, p)}</small>
      <p className="pdesc">{p.desc}</p>
      <div className="row prodrow"><b>{S.money(p.price)}</b>
        <button className="btn sm" disabled={out} onClick={add}>{out ? 'ناموجود' : added === 'ok' ? 'افزوده شد ✓' : 'افزودن به سبد خرید'}</button></div>
      {added && added !== 'ok' && <small className="err">{added}</small>}</div></article>)
}

function Strip({ id, title, em, list, s, onAll }) {
  const ref = useRef(null)
  if (!list.length) return null
  const sc = d => ref.current?.scrollBy({ left: d, behavior: 'smooth' })
  return (<section id={id} className="wrap sec">
    <div className="nhead"><h2>{title} <em>{em}</em></h2>
      <div className="nctl"><button onClick={() => sc(300)} aria-label="قبلی">›</button><button onClick={() => sc(-300)} aria-label="بعدی">‹</button>
        <button className="lnk" onClick={onAll}>مشاهده همه ‹</button></div></div>
    <div className="strip" ref={ref}>{list.map(p => <ProductCard key={p.id} p={p} s={s} />)}</div></section>)
}

function Home() {
  const s = S.useStore(), u = S.currentUser(s), st = s.settings, { q, clear } = useContext(Q)
  const [cat, setCat] = useState(''), [all, setAll] = useState(false), prevQ = useRef('')
  useEffect(() => { if (q && !prevQ.current) scrollTo_('products'); prevQ.current = q }, [q]) // فقط با اولین حرف اسکرول شود
  const items = s.products.filter(p => (!cat || p.categoryId === cat) && (!q || (p.name + p.desc + S.catName(s, p)).includes(q.trim())))
  const catTitle = st.categories.find(c => c.id === cat)?.name
  const newest = [...s.products].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 8)
  const showAll = () => { setAll(true); setTimeout(() => scrollTo_('products'), 60) }
  const filtered = q || cat || all
  return (<>
    <div className="fold">
    <section className="hero" style={{ '--hd': css_(st.heroImage || st.heroImageMobile), '--hm': css_(st.heroImageMobile || st.heroImage) }}><div className="wrap"><div className="herotxt">
      <p className="lead">{st.heroLine1}</p><h1>{st.heroLine2}</h1><div className="orn"><i /></div>
      <button className="btn herobtn" onClick={() => scrollTo_('products')}>مشاهده محصولات <span>←</span></button></div></div></section>
    <div id="cats" className="wrap cats">{st.categories.map(c =>
      <button key={c.id} className={'cat' + (cat === c.id ? ' on' : '')} style={bg(c.image)} onClick={() => { setCat(cat === c.id ? '' : c.id); scrollTo_('products') }}>
        <span>{c.name}</span></button>)}</div>
    </div>
    {!filtered && <Strip title="جدیدترین" em="محصولات" list={newest} s={s} onAll={showAll} />}
    {filtered
      ? <section id="products" className="wrap sec">
          <div className="nhead"><h2>{q ? 'نتایج جستجو' : <>محصولات <em>ویژه</em></>}{catTitle && ` — ${catTitle}`}</h2>
            {q ? <button className="lnk redlnk" onClick={clear}>پاک کردن جستجو ×</button>
              : cat ? <button className="lnk redlnk" onClick={() => setCat('')}>حذف فیلتر ×</button>
              : all && <button className="lnk redlnk" onClick={() => setAll(false)}>نمایش کمتر ›</button>}</div>
          <div className="grid g4">{items.map(p => <ProductCard key={p.id} p={p} s={s} />)}{!items.length && <p>محصولی پیدا نشد.</p>}</div></section>
      : <Strip id="products" title="محصولات" em="ویژه" list={items} s={s} onAll={showAll} />}
    <Reviews s={s} u={u} />
  </>)
}

function ProductPage() {
  const { id } = useParams(), s = S.useStore(), u = S.currentUser(s), p = s.products.find(x => x.id === id)
  const [added, setAdded] = useState('')
  useEffect(() => { if (!p) return; document.title = `${p.name} | ایل بافت`; return () => { document.title = 'ایل بافت | فروشگاه فرش' } }, [p?.name])
  if (!p) return (<div className="wrap sec empty"><h2>محصول پیدا نشد</h2><Link className="btn" to="/">بازگشت به فروشگاه</Link></div>)
  const out = !(p.stock > 0)
  const add = () => { const r = S.addToCart(p.id); setAdded(r || 'ok'); setTimeout(() => setAdded(''), 1600) }
  return (<div className="wrap sec">
    <div className="crumbs"><Link to="/">خانه</Link> / <span>{S.catName(s, p)}</span> / <span>{p.name}</span></div>
    <div className="pgrid">
      <div className="pbig" style={bg(p.image)} />
      <div className="pinfo"><h1>{p.name}</h1><small>{S.catName(s, p)}</small>
        {p.stock === 1 && <span className="tag inline">تک‌نسخه</span>}{out && <span className="tag sold inline">ناموجود</span>}
        <div className="pprice">{S.money(p.price)}</div>
        <button className="btn wide" disabled={out} onClick={add}>{out ? 'ناموجود' : added === 'ok' ? 'افزوده شد ✓' : 'افزودن به سبد خرید'}</button>
        {added && added !== 'ok' && <p className="err">{added}</p>}
        <Link className="btn wide ghost dark" to="/cart">مشاهده سبد خرید</Link></div>
    </div>
    <section className="card pad pdetail"><h2>جزئیات محصول</h2>
      <p>{p.desc || 'توضیحاتی برای این محصول ثبت نشده است.'}</p>
      <table className="specs"><tbody>
        <tr><th>دسته‌بندی</th><td>{S.catName(s, p)}</td></tr>
        {p.size && <tr><th>ابعاد</th><td>{p.size}</td></tr>}
        {p.material && <tr><th>جنس</th><td>{p.material}</td></tr>}
        <tr><th>موجودی</th><td>{out ? 'ناموجود' : p.stock === 1 ? 'تک‌نسخه' : `${S.fa(p.stock)} عدد`}</td></tr></tbody></table></section>
    <Reviews s={s} u={u} productId={p.id} />
  </div>)
}

function Auth({ mode }) {
  const loc = useLocation(), s = S.useStore()
  const [f, setF] = useState({ firstName: '', lastName: '', phone: '', email: '', password: '', again: '' }), [err, setErr] = useState(''), [show, setShow] = useState(false)
  useEffect(() => { setErr('') }, [mode])
  const isUp = mode === 'signup', from = loc.state?.from || '/'
  if (S.currentUser(s)) return <Navigate to={from} replace />
  const set = k => e => setF({ ...f, [k]: e.target.value })
  const submit = e => {
    e.preventDefault()
    if (isUp && f.password !== f.again) return setErr('رمز عبور و تکرار آن یکسان نیست.')
    const r = isUp ? S.signup(f) : S.login(f.phone, f.password)
    if (r) setErr(r)
  }
  const pt = show ? 'text' : 'password'
  return (<div className="wrap sec"><div className="authwrap card">
    <aside className="authside"><b>ایل بافت</b><div className="orn" /><p>زیبایی ماندگار خانه شما</p><small>با ساخت حساب، سفارش‌ها و آدرس‌های خود را مدیریت کنید.</small></aside>
    <form className="authform" onSubmit={submit}>
      <div className="authtabs">
        <Link to="/login" state={{ from }} className={!isUp ? 'on' : ''}>ورود</Link>
        <Link to="/signup" state={{ from }} className={isUp ? 'on' : ''}>ثبت‌نام</Link></div>
      {isUp && <div className="name2"><input required placeholder="نام" value={f.firstName} onChange={set('firstName')} /><input required placeholder="نام خانوادگی" value={f.lastName} onChange={set('lastName')} /></div>}
      <input required placeholder={isUp ? 'شماره موبایل (۰۹۱۲…)' : 'شماره موبایل یا ایمیل'} value={f.phone} onChange={set('phone')} dir="ltr" inputMode={isUp ? 'numeric' : 'text'} />
      {isUp && <input type="email" placeholder="ایمیل (اختیاری)" value={f.email} onChange={set('email')} dir="ltr" />}
      <input required type={pt} placeholder="رمز عبور" value={f.password} onChange={set('password')} dir="ltr" />
      {isUp && <input required type={pt} placeholder="تکرار رمز عبور" value={f.again} onChange={set('again')} dir="ltr" />}
      <label className="chk"><input type="checkbox" checked={show} onChange={() => setShow(!show)} />نمایش رمز عبور</label>
      {err && <p className="err">{err}</p>}
      <button className="btn wide">{isUp ? 'ساخت حساب' : 'ورود'}</button>
    </form></div></div>)
}

function InfoTab({ u }) {
  const [f, setF] = useState({ firstName: u.firstName || '', lastName: u.lastName || '', email: u.email || '' }), [ok, setOk] = useState(false), [err, setErr] = useState('')
  const set = k => e => setF({ ...f, [k]: e.target.value })
  const save = e => { e.preventDefault(); const r = S.updateProfile(f); if (r) return setErr(r); setErr(''); setOk(true); setTimeout(() => setOk(false), 2000) }
  return (<form className="card pad pform" onSubmit={save}><h3>اطلاعات کاربری</h3>
    <input required placeholder="نام" value={f.firstName} onChange={set('firstName')} />
    <input required placeholder="نام خانوادگی" value={f.lastName} onChange={set('lastName')} />
    <input type="email" placeholder="ایمیل (اختیاری)" value={f.email} onChange={set('email')} dir="ltr" />
    {u.phone && <><input value={u.phone} disabled dir="ltr" /><small className="hint">شماره موبایل قابل تغییر نیست.</small></>}
    {err && <p className="err">{err}</p>}
    <button className="btn">ذخیره تغییرات</button>{ok && <span className="ok"> ذخیره شد ✓</span>}</form>)
}

function AddressTab({ u }) {
  const empty = { title: '', city: '', text: '', postal: '' }
  const [f, setF] = useState(empty)
  const set = k => e => setF({ ...f, [k]: e.target.value })
  const save = e => { e.preventDefault(); S.saveAddress(f); setF(empty) }
  return (<div className="two">
    <form className="card pad" onSubmit={save}><h3>{f.id ? 'ویرایش آدرس' : 'آدرس جدید'}</h3>
      <input required placeholder="عنوان (مثلاً خانه)" value={f.title} onChange={set('title')} />
      <input required placeholder="استان و شهر" value={f.city} onChange={set('city')} />
      <textarea required placeholder="آدرس کامل" value={f.text} onChange={set('text')} />
      <input placeholder="کد پستی (۱۰ رقم)" pattern="[0-9۰-۹]{10}" title="کد پستی ۱۰ رقمی" value={f.postal} onChange={set('postal')} dir="ltr" inputMode="numeric" />
      <button className="btn">{f.id ? 'ذخیره تغییرات' : 'افزودن آدرس'}</button>
      {f.id && <button type="button" className="btn ghost dark" onClick={() => setF(empty)}>انصراف</button>}</form>
    <div>{u.addresses.map(a => <div className="card pad prow" key={a.id}>
      <div><b>{a.title}</b><br /><small>{a.city} — {a.text}{a.postal && ` — کد پستی: ${S.fa(a.postal)}`}</small></div>
      <div><button className="btn sm ghost dark" onClick={() => setF(a)}>ویرایش</button>
        <button className="btn sm danger" onClick={() => confirm('این آدرس حذف شود؟') && S.deleteAddress(a.id)}>حذف</button></div></div>)}
      {!u.addresses.length && <p>هنوز آدرسی ثبت نکرده‌اید.</p>}</div></div>)
}

function OrdersTab({ s, u }) {
  const list = s.orders.filter(o => o.userId === u.id)
  if (!list.length) return (<div className="empty"><p>هنوز سفارشی ثبت نکرده‌اید.</p><Link className="btn" to="/">دیدن محصولات</Link></div>)
  return (<>{list.map(o => <div className="card pad ocard" key={o.id}>
    <div className="row"><b>سفارش {S.fa(o.no)}</b><span className="badge">{S.STATUS[o.status] || o.status}</span></div>
    <small>{new Date(o.date).toLocaleDateString('fa-IR')}</small>
    <ul>{o.items.map(i => <li key={i.id}>{i.name} × {S.fa(i.qty)} — {S.money(i.price * i.qty)}</li>)}</ul>
    <small>تحویل به: {o.address.city} — {o.address.text}</small>
    {o.tracking && <small>کد رهگیری: {S.fa(o.tracking)}</small>}
    <div className="row total"><span>جمع کل</span><b>{S.money(o.total)}</b></div></div>)}</>)
}

function Profile() {
  const s = S.useStore(), u = S.currentUser(s), go = useNavigate(), loc = useLocation()
  const [tab, setTab] = useState(loc.state?.tab || 'info')
  if (!u) return <Navigate to="/login" state={{ from: '/profile' }} replace />
  const tabs = { info: 'اطلاعات کاربری', addresses: 'آدرس‌ها', orders: 'سفارش‌ها' }
  return (<div className="wrap sec"><h2 className="title">پروفایل من</h2>
    <div className="tabs">{Object.entries(tabs).map(([k, v]) => <button key={k} className={'btn sm' + (tab === k ? '' : ' ghost dark')} onClick={() => setTab(k)}>{v}</button>)}
      <button className="btn sm danger" onClick={() => { S.logout(); go('/') }}>خروج از حساب</button></div>
    {tab === 'info' && <InfoTab u={u} />}{tab === 'addresses' && <AddressTab u={u} />}{tab === 'orders' && <OrdersTab s={s} u={u} />}</div>)
}

function CartPage() {
  const s = S.useStore(), u = S.currentUser(s), go = useNavigate(), [msg, setMsg] = useState(''), [aid, setAid] = useState('')
  const rows = S.getCart(s).map(i => ({ ...i, p: s.products.find(p => p.id === i.id) })).filter(r => r.p)
  const total = rows.reduce((n, r) => n + r.p.price * r.qty, 0)
  const addrs = u?.addresses || [], addr = addrs.find(a => a.id === aid)?.id || addrs[0]?.id
  const pay = () => {
    if (!u) return go('/login', { state: { from: '/cart' } })
    if (!addr) return setMsg('noaddr')
    const r = S.placeOrder(addr)
    typeof r === 'string' ? setMsg(r) : go('/profile', { state: { tab: 'orders' } })
  }
  if (!rows.length) return (<div className="wrap sec empty"><h2>سبد خرید شما خالی است</h2><p>محصولات را ببینید و به سبد خرید اضافه کنید.</p><Link className="btn" to="/">دیدن محصولات</Link></div>)
  return (<div className="wrap sec"><h2 className="title">سبد خرید</h2><div className="cartgrid">
    <div>{rows.map(({ p, qty }) => <div className="card pad crow" key={p.id}>
      <Link to={`/product/${p.id}`} className="thumb big" style={bg(p.image)} />
      <div className="cinfo"><b>{p.name}</b><small>{S.catName(s, p)}</small><span>{S.money(p.price)}</span>
        {qty > p.stock && <small className="err">{p.stock > 0 ? `موجودی فقط ${S.fa(p.stock)} عدد است` : 'ناموجود شده است'}</small>}</div>
      <div className="qty"><button disabled={qty >= p.stock} onClick={() => S.setQty(p.id, qty + 1)} aria-label="افزایش">+</button><span>{S.fa(qty)}</span><button onClick={() => S.setQty(p.id, qty - 1)} aria-label="کاهش">−</button></div>
      <div className="ctot"><b>{S.money(p.price * qty)}</b><button className="lnk del" onClick={() => S.removeFromCart(p.id)}>حذف</button></div></div>)}</div>
    <aside className="card pad summary"><h3>خلاصه سفارش</h3>
      <div className="row"><span>تعداد کالا</span><b>{S.fa(rows.reduce((n, r) => n + r.qty, 0))}</b></div>
      <div className="row total"><span>مبلغ قابل پرداخت</span><b>{S.money(total)}</b></div>
      {u && addrs.length > 0 && <><label className="lbl">آدرس تحویل</label><select value={addr} onChange={e => setAid(e.target.value)}>{addrs.map(a => <option key={a.id} value={a.id}>{a.title} — {a.city}</option>)}</select></>}
      {msg === 'noaddr' && <p className="err">برای ثبت سفارش ابتدا یک آدرس اضافه کنید. <Link to="/profile" state={{ tab: 'addresses' }}>افزودن آدرس</Link></p>}
      {msg && msg !== 'noaddr' && <p className="err">{msg}</p>}
      <button className="btn wide" onClick={pay}>{S.GATEWAY_READY ? 'پرداخت' : 'ثبت سفارش'}</button>
      {!u && <small>برای ثبت سفارش باید وارد حساب شوید.</small>}
      {!S.GATEWAY_READY && <small>اتصال به درگاه پرداخت در مرحله بعد انجام می‌شود؛ فعلاً سفارش با وضعیت «در انتظار پرداخت» ثبت می‌شود.</small>}</aside></div></div>)
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { scrollTo(0, 0) }, [pathname])
  return null
}

export default function App() {
  return (<Layout><ScrollToTop /><Routes>
    <Route path="/" element={<Home />} />
    <Route path="/product/:id" element={<ProductPage />} />
    <Route path="/login" element={<Auth mode="login" />} />
    <Route path="/signup" element={<Auth mode="signup" />} />
    <Route path="/profile" element={<Profile />} />
    <Route path="/cart" element={<CartPage />} />
    <Route path="/admin" element={<Admin />} />
    <Route path="*" element={<Navigate to="/" />} />
  </Routes></Layout>)
}
