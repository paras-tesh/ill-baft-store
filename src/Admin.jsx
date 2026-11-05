import { useState, useEffect, useRef } from 'react'
import * as S from './store.js'
import { Modal, CropEditor } from './ui.jsx'

// aspect یعنی نسبت کادر؛ بدون آن (مثل لوگو) عکس مستقیم و بدون برش ثبت می‌شود
function ImgInput({ label, value, onChange, aspect, outWidth, max = 1200, type }) {
  const [src, setSrc] = useState(null)

  const closeEditor = () => {
    if (src && src.startsWith('blob:')) URL.revokeObjectURL(src)
    setSrc(null)
  }

  const pick = async e => {
    const file = e.target.files[0]
    e.target.value = '' // انتخاب دوباره همان فایل هم کار کند
    if (!file) return
    if (aspect) return setSrc(URL.createObjectURL(file))
    const url = await S.readImage(file, max, type)
    url ? onChange(url) : alert('این فایل عکس معتبر نیست.')
  }

  return (
    <div className="imgin">
      <span>{label}</span>
      {value && <img src={value} alt="" />}
      <input type="file" accept="image/*" onChange={pick} aria-label={label} />
      {value && aspect && <button type="button" className="btn sm ghost" onClick={() => setSrc(value)}>تنظیم کادر</button>}
      {value && <button type="button" className="btn sm ghost" onClick={() => onChange('')}>حذف عکس</button>}
      {src && <CropEditor src={src} aspect={aspect} outWidth={outWidth} type={type}
        onCancel={closeEditor} onDone={url => { onChange(url); closeEditor() }} />}
    </div>
  )
}

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
// انتخاب نقطه اصلی عکس بنر؛ کادر سفید ناحیه‌ای است که در بنر دیده می‌شود
function FocusPicker({ image, focus, onChange, aspect, hint }) {
  const ref = useRef(null), [dim, setDim] = useState(null)
  useEffect(() => { if (!image) return setDim(null); const i = new Image(); i.onload = () => setDim([i.naturalWidth, i.naturalHeight]); i.src = image }, [image])
  if (!image) return null
  const pick = e => { const r = ref.current.getBoundingClientRect(); onChange({ x: clamp((e.clientX - r.left) / r.width), y: clamp((e.clientY - r.top) / r.height) }) }
  let fw = 1, fh = 1
  if (dim) { const ia = dim[0] / dim[1]; ia > aspect ? (fw = aspect / ia) : (fh = ia / aspect) }
  const left = clamp(focus.x - fw / 2, 0, 1 - fw), top = clamp(focus.y - fh / 2, 0, 1 - fh)
  return (<div className="focus"><small className="hint">{hint}</small>
    <div className="fbox" ref={ref} onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); pick(e) }} onPointerMove={e => e.buttons && pick(e)}>
      <img src={image} alt="" draggable="false" />
      <div className="fframe" style={{ left: `${left * 100}%`, top: `${top * 100}%`, width: `${fw * 100}%`, height: `${fh * 100}%` }} />
      <i className="fdot" style={{ left: `${focus.x * 100}%`, top: `${focus.y * 100}%` }} /></div></div>)
}

function ProductModal({ s, product, onClose }) {
  const [f, setF] = useState(() => ({
    name: '', categoryId: s.settings.categories[0].id, desc: '', size: '', material: '', image: '',
    ...product, price: product.price ?? '', stock: product.stock ?? 1,
  }))
  const [error, setError] = useState('')
  const set = key => e => setF({ ...f, [key]: e.target.value })

  const submit = e => {
    e.preventDefault()
    const price = S.toInt(f.price)
    const stock = S.toInt(f.stock)
    if (price === null || stock === null) return setError('قیمت و موجودی باید عدد صحیح باشند (بدون اعشار و علامت).')
    if (S.saveProduct({ ...f, name: f.name.trim(), price, stock })) onClose()
  }

  return (
    <Modal title={product.id ? 'ویرایش محصول' : 'محصول جدید'} onClose={onClose}>
      <form onSubmit={submit}>
        <input required placeholder="نام محصول" value={f.name} onChange={set('name')} />
        <input required inputMode="numeric" placeholder="قیمت (تومان)" value={f.price} onChange={set('price')} />
        <input required inputMode="numeric" placeholder="موجودی — عدد صحیح (تک‌نسخه = ۱ ، ناموجود = ۰)" value={f.stock} onChange={set('stock')} />
        <select value={f.categoryId} onChange={set('categoryId')} aria-label="دسته‌بندی">
          {s.settings.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <textarea placeholder="توضیحات" value={f.desc} onChange={set('desc')} />
        <input placeholder="ابعاد (اختیاری، مثلاً ۲×۳ متر)" value={f.size || ''} onChange={set('size')} />
        <input placeholder="جنس (اختیاری)" value={f.material || ''} onChange={set('material')} />
        <ImgInput label="عکس محصول (کادر ۴ به ۳)" value={f.image} aspect={4 / 3} outWidth={1000} onChange={image => setF({ ...f, image })} />
        {error && <p className="err">{error}</p>}
        <div className="mact">
          <button className="btn">{product.id ? 'ذخیره تغییرات' : 'افزودن محصول'}</button>
          <button type="button" className="btn ghost dark" onClick={onClose}>انصراف</button>
        </div>
      </form>
    </Modal>
  )
}

function Products({ s }) {
  const [editing, setEditing] = useState(null) // null = بسته، {} = محصول جدید، یا خود محصول

  return (
    <>
      <div className="toolbar">
        <button className="btn" onClick={() => setEditing({})}>+ افزودن محصول</button>
        <small>{S.fa(s.products.length)} محصول</small>
      </div>
      {s.products.map(p => (
        <div className="card pad prow" key={p.id}>
          <div className="thumb" style={p.image ? { backgroundImage: `url(${p.image})` } : {}} />
          <div><b>{p.name}</b><br /><small>{S.catName(s, p)} · {S.money(p.price)} · موجودی: {S.fa(p.stock ?? 0)}</small></div>
          <div>
            <button className="btn sm ghost" onClick={() => setEditing(p)}>ویرایش</button>
            <button className="btn sm danger" onClick={() => confirm('حذف شود؟') && S.deleteProduct(p.id)}>حذف</button>
          </div>
        </div>
      ))}
      {editing && <ProductModal key={editing.id || 'new'} s={s} product={editing} onClose={() => setEditing(null)} />}
    </>
  )
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
    <ImgInput label="عکس بنر — دسکتاپ" value={d.heroImage} onChange={heroImage => setD({ ...d, heroImage })} aspect={3} outWidth={2000} />
    <small className="hint">اندازه پیشنهادی دسکتاپ: ۲۴۰۰×۸۰۰ پیکسل (نسبت ۳ به ۱). سوژه اصلی را وسط عکس بگذارید، چون روی صفحه‌های کوتاه‌تر یا بلندتر بالا و پایین عکس کمی بریده می‌شود.</small>
    <FocusPicker image={d.heroImage} focus={d.heroFocus.d} aspect={3.4} onChange={f => setD({ ...d, heroFocus: { ...d.heroFocus, d: f } })} hint="روی بخش اصلی عکس بزنید یا بکشید؛ این نقطه تا حد ممکن وسط بنر دسکتاپ می‌افتد. کادر سفید = ناحیه‌ای که دیده می‌شود." />
    <ImgInput label="عکس بنر — موبایل" value={d.heroImageMobile} onChange={heroImageMobile => setD({ ...d, heroImageMobile })} aspect={1.2} outWidth={1000} />
    <small className="hint">اندازه پیشنهادی موبایل: ۱۰۸۰×۱۰۰۰ پیکسل (تقریباً مربع). متن‌ها پایین بنر روی عکس می‌نشینند، پس سوژه را کمی بالاتر از وسط بگذارید.</small>
    <FocusPicker image={d.heroImageMobile} focus={d.heroFocus.m} aspect={1.2} onChange={f => setD({ ...d, heroFocus: { ...d.heroFocus, m: f } })} hint="نقطه اصلی عکس موبایل را مشخص کنید." />
    <h3>عکس دسته‌بندی‌ها</h3>
    <small className="hint">اندازه پیشنهادی: ۹۰۰×۶۰۰ پیکسل (نسبت ۳ به ۲).</small>
    {d.categories.map((c, i) => <div key={c.id} className="catedit">
      <input required value={c.name} onChange={e => cat(i, { name: e.target.value })} />
      <ImgInput label="عکس" value={c.image} onChange={image => cat(i, { image })} aspect={1.5} outWidth={900} /></div>)}
    <button className="btn">ذخیره تغییرات</button>{ok && <span className="ok"> ذخیره شد ✓</span>}
  </form>)
}

function FooterTab({ s }) {
  const [d, setD] = useState(s.settings.footer || {}), [ok, setOk] = useState(false)
  const set = k => e => setD({ ...d, [k]: e.target.value })
  const save = e => { e.preventDefault(); if (!S.saveSettings({ footer: d })) return; setOk(true); setTimeout(() => setOk(false), 2000) }
  return (<form className="card pad pform" onSubmit={save}>
    <h3>متن کوتاه «درباره ما» در فوتر</h3>
    <textarea value={d.about || ''} onChange={set('about')} />
    <h3>راه‌های ارتباطی (هر کدام خالی باشد نمایش داده نمی‌شود)</h3>
    <input dir="ltr" placeholder="اینستاگرام: نام کاربری یا لینک (مثلاً ill.baft)" value={d.instagram || ''} onChange={set('instagram')} />
    <input dir="ltr" placeholder="تلگرام: نام کاربری یا لینک" value={d.telegram || ''} onChange={set('telegram')} />
    <input dir="ltr" placeholder="واتساپ: شماره (مثلاً 09121234567)" value={d.whatsapp || ''} onChange={set('whatsapp')} />
    <input dir="ltr" placeholder="تلفن تماس" value={d.phone || ''} onChange={set('phone')} />
    <input dir="ltr" placeholder="ایمیل" value={d.email || ''} onChange={set('email')} />
    <textarea placeholder="آدرس" value={d.address || ''} onChange={set('address')} />
    <h3>نماد اعتماد الکترونیکی (اینماد)</h3>
    <textarea dir="ltr" placeholder="کد HTML نماد را از پنل اینماد کپی و اینجا Paste کنید" value={d.enamad || ''} onChange={set('enamad')} />
    {d.enamad && !S.parseEnamad(d.enamad) && <p className="err">کد معتبر نیست؛ باید شامل آدرس لینک و آدرس عکس با https باشد.</p>}
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
  const tabs = { products: 'محصولات', orders: 'سفارش‌ها', site: 'بنرها و لوگو', footer: 'فوتر و تماس', reviews: 'نظرات' }
  const pend = s.orders.filter(o => o.status === 'pending').length
  return (<div className="wrap sec"><h2 className="title">پنل مدیریت</h2>
    <p className="meter">حافظه مرورگر: {S.fa(S.usedPct(s))}٪ پر است</p>
    <div className="tabs">{Object.entries(tabs).map(([k, v]) => <button key={k} className={'btn sm' + (tab === k ? '' : ' ghost')} onClick={() => setTab(k)}>{v}{k === 'orders' && pend ? ` (${S.fa(pend)})` : ''}</button>)}<button className="btn sm danger" onClick={S.adminLogout}>خروج از پنل</button></div>
    {tab === 'products' && <Products s={s} />}{tab === 'orders' && <Orders s={s} />}{tab === 'site' && <Site s={s} />}{tab === 'footer' && <FooterTab s={s} />}{tab === 'reviews' && <Reviews s={s} />}</div>)
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
