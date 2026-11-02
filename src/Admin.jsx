import { useState } from 'react'
import * as S from './store.js'

function ImgInput({ label, value, onChange, max = 1200, type }) {
  return (<label className="imgin"><span>{label}</span>
    {value && <img src={value} alt="" />}
    <input type="file" accept="image/*" onChange={async e => {
      const file = e.target.files[0]; e.target.value = '' // انتخاب دوباره همان فایل هم کار کند
      if (!file) return
      const url = await S.readImage(file, max, type)
      url ? onChange(url) : alert('این فایل عکس معتبر نیست.')
    }} />
    {value && <button type="button" className="btn sm ghost" onClick={() => onChange('')}>حذف عکس</button>}</label>)
}

function Products({ s }) {
  const empty = { name: '', price: '', categoryId: s.settings.categories[0].id, stock: 1, desc: '', size: '', material: '', image: '' }
  const [f, setF] = useState(empty)
  const set = k => e => setF({ ...f, [k]: e.target.value })
  const submit = e => { e.preventDefault(); if (S.saveProduct({ ...f, price: +f.price, stock: Math.max(0, +f.stock || 0) })) setF(empty) }
  return (<div className="two">
    <form className="card pad" onSubmit={submit}>
      <h3>{f.id ? 'ویرایش محصول' : 'محصول جدید'}</h3>
      <input required placeholder="نام محصول" value={f.name} onChange={set('name')} />
      <input required type="number" min="0" placeholder="قیمت (تومان)" value={f.price} onChange={set('price')} />
      <input required type="number" min="0" placeholder="موجودی (تک‌نسخه = ۱ ، ناموجود = ۰)" value={f.stock} onChange={set('stock')} />
      <select value={f.categoryId} onChange={set('categoryId')}>{s.settings.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <textarea placeholder="توضیحات" value={f.desc} onChange={set('desc')} />
      <input placeholder="ابعاد (اختیاری، مثلاً ۲×۳ متر)" value={f.size || ''} onChange={set('size')} />
      <input placeholder="جنس (اختیاری)" value={f.material || ''} onChange={set('material')} />
      <ImgInput label="عکس محصول" value={f.image} onChange={image => setF({ ...f, image })} max={900} />
      <button className="btn">{f.id ? 'ذخیره تغییرات' : 'افزودن محصول'}</button>
      {f.id && <button type="button" className="btn ghost" onClick={() => setF(empty)}>انصراف</button>}
    </form>
    <div>{s.products.map(p => <div className="card pad prow" key={p.id}>
      <div className="thumb" style={p.image ? { backgroundImage: `url(${p.image})` } : {}} />
      <div><b>{p.name}</b><br /><small>{S.catName(s, p)} · {S.money(p.price)} · موجودی: {S.fa(p.stock ?? 0)}</small></div>
      <div><button className="btn sm ghost" onClick={() => { setF(p); scrollTo(0, 0) }}>ویرایش</button>
        <button className="btn sm danger" onClick={() => confirm('حذف شود؟') && S.deleteProduct(p.id)}>حذف</button></div></div>)}</div>
  </div>)
}

function Site({ s }) {
  const [d, setD] = useState(s.settings), [ok, setOk] = useState(false)
  const set = k => e => setD({ ...d, [k]: e.target.value })
  const cat = (i, patch) => setD({ ...d, categories: d.categories.map((c, j) => (j === i ? { ...c, ...patch } : c)) })
  const save = e => { e.preventDefault(); if (!S.saveSettings(d)) return; setOk(true); setTimeout(() => setOk(false), 2000) }
  return (<form className="card pad" onSubmit={save}>
    <h3>لوگو و متن‌ها</h3>
    <ImgInput label="لوگو (PNG شفاف بهتر است)" value={d.logo} onChange={logo => setD({ ...d, logo })} max={400} type="image/png" />
    <input placeholder="شعار زیر لوگو" value={d.tagline} onChange={set('tagline')} />
    <input placeholder="متن نوار بالای سایت" value={d.topBar} onChange={set('topBar')} />
    <h3>بنر اصلی</h3>
    <input placeholder="متن کوچک بنر" value={d.heroLine1} onChange={set('heroLine1')} />
    <input placeholder="عنوان بزرگ بنر" value={d.heroLine2} onChange={set('heroLine2')} />
    <ImgInput label="عکس بنر اصلی — دسکتاپ (افقی ۱۶:۹)" value={d.heroImage} onChange={heroImage => setD({ ...d, heroImage })} />
    <ImgInput label="عکس بنر — موبایل (مربع یا عمودی)" value={d.heroImageMobile} onChange={heroImageMobile => setD({ ...d, heroImageMobile })} max={900} />
    <h3>بنر دسته‌بندی محصولات</h3>
    {d.categories.map((c, i) => <div key={c.id} className="catedit">
      <input required value={c.name} onChange={e => cat(i, { name: e.target.value })} />
      <ImgInput label="عکس" value={c.image} onChange={image => cat(i, { image })} max={700} /></div>)}
    <button className="btn">ذخیره تغییرات</button>{ok && <span className="ok"> ذخیره شد ✓</span>}
  </form>)
}

function Reviews({ s }) {
  const pend = s.reviews.filter(r => !r.approved), done = s.reviews.filter(r => r.approved)
  const row = r => <div className="card pad prow" key={r.id}><div><b>{r.name}</b> <span className="stars">{'★'.repeat(r.rating)}</span><p>{r.text}</p>{r.productId && <small>درباره: {s.products.find(p => p.id === r.productId)?.name || 'محصول حذف‌شده'}</small>}</div>
    <div>{!r.approved && <button className="btn sm" onClick={() => S.approveReview(r.id)}>تایید</button>}
      <button className="btn sm danger" onClick={() => S.deleteReview(r.id)}>حذف</button></div></div>
  return (<><h3>در انتظار تایید ({S.fa(pend.length)})</h3>{pend.map(row)}{!pend.length && <p>نظر جدیدی نیست.</p>}
    <h3>نظرات نمایش‌داده‌شده</h3>{done.map(row)}</>)
}

function Orders({ s }) {
  const [flt, setFlt] = useState('all')
  const list = s.orders.filter(o => flt === 'all' || o.status === flt)
  const cnt = k => s.orders.filter(o => o.status === k).length
  const filters = [['all', 'همه', s.orders.length], ...Object.entries(S.STATUS).map(([k, v]) => [k, v, cnt(k)])]
  return (<>
    <div className="tabs">{filters.map(([k, v, n]) => <button key={k} className={'btn sm' + (flt === k ? '' : ' ghost')} onClick={() => setFlt(k)}>{v} ({S.fa(n)})</button>)}</div>
    {list.map(o => { const u = s.users.find(x => x.id === o.userId); return (<div className="card pad ocard" key={o.id}>
      <div className="row"><b>سفارش {S.fa(o.no)}</b><small>{new Date(o.date).toLocaleDateString('fa-IR')}</small></div>
      <p className="who">{u ? `${S.fullName(u)} — ${u.phone || u.email || ''}` : 'کاربر حذف‌شده'}</p>
      <ul>{o.items.map(i => <li key={i.id}>{i.name} × {S.fa(i.qty)} — {S.money(i.price * i.qty)}</li>)}</ul>
      <small>تحویل به: {o.address.title} — {o.address.city} — {o.address.text}{o.address.postal && ` — کد پستی: ${S.fa(o.address.postal)}`}</small>
      <div className="row total"><span>جمع کل</span><b>{S.money(o.total)}</b></div>
      <div className="ordctl">
        <select value={o.status} onChange={e => S.updateOrder(o.id, { status: e.target.value })}>{Object.entries(S.STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <input placeholder="کد رهگیری (اختیاری)" defaultValue={o.tracking || ''} dir="ltr" onBlur={e => e.target.value.trim() !== (o.tracking || '') && S.updateOrder(o.id, { tracking: e.target.value.trim() })} />
      </div></div>) })}
    {!list.length && <p>سفارشی در این وضعیت نیست.</p>}</>)
}

function Panel() {
  const s = S.useStore(), [tab, setTab] = useState('products')
  const tabs = { products: 'محصولات', orders: 'سفارش‌ها', site: 'بنرها و لوگو', reviews: 'نظرات' }
  const pend = s.orders.filter(o => o.status === 'pending').length
  return (<div className="wrap sec"><h2 className="title">پنل مدیریت</h2>
    <p className="meter">حافظه مرورگر: {S.fa(S.usedPct(s))}٪ پر است</p>
    <div className="tabs">{Object.entries(tabs).map(([k, v]) => <button key={k} className={'btn sm' + (tab === k ? '' : ' ghost')} onClick={() => setTab(k)}>{v}{k === 'orders' && pend ? ` (${S.fa(pend)})` : ''}</button>)}<button className="btn sm danger" onClick={S.adminLogout}>خروج از پنل</button></div>
    {tab === 'products' && <Products s={s} />}{tab === 'orders' && <Orders s={s} />}{tab === 'site' && <Site s={s} />}{tab === 'reviews' && <Reviews s={s} />}</div>)
}

export default function Admin() {
  const s = S.useStore(), [pw, setPw] = useState(''), [err, setErr] = useState('')
  if (s.isAdmin) return <Panel />
  return (<div className="wrap sec"><form className="card pad authbox" onSubmit={e => { e.preventDefault(); setErr(S.adminLogin(pw) || '') }}>
    <h2>ورود مدیر</h2>
    <input type="password" required placeholder="رمز مدیریت" value={pw} onChange={e => setPw(e.target.value)} dir="ltr" />
    {err && <p className="err">{err}</p>}
    <button className="btn">ورود</button></form></div>)
}
