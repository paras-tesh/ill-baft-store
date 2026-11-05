import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

// اگر چند پنجره روی هم باز باشد، Esc فقط بالاترین را می‌بندد
const stack = []

export function Modal({ title, onClose, children }) {
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    const me = {}
    stack.push(me)
    const onKey = e => { if (e.key === 'Escape' && stack[stack.length - 1] === me) closeRef.current() }
    const prevOverflow = document.body.style.overflow
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      stack.splice(stack.indexOf(me), 1)
      document.body.style.overflow = prevOverflow
    }
  }, [])

  return createPortal(
    <div className="mback">
      <div className="mbox" role="dialog" aria-modal="true" aria-label={title}>
        <div className="mhead">
          <h3>{title}</h3>
          <button type="button" className="mx" aria-label="بستن" onClick={onClose}>×</button>
        </div>
        <div className="mbody">{children}</div>
      </div>
    </div>,
    document.body
  )
}

// انتخاب بخشی از عکس و میزان زوم، قبل از آپلود
export function CropEditor({ src, aspect, outWidth = 1000, type = 'image/jpeg', onDone, onCancel }) {
  const frameRef = useRef(null)
  const pointers = useRef(new Map())
  const gesture = useRef(null)
  const [img, setImg] = useState(null)
  const [failed, setFailed] = useState(false)
  const [box, setBox] = useState({ w: 320, h: 320 / aspect })
  const [zoom, setZoom] = useState(1)
  const [center, setCenter] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const image = new Image()
    image.onload = () => { setImg(image); setCenter({ x: image.naturalWidth / 2, y: image.naturalHeight / 2 }) }
    image.onerror = () => setFailed(true)
    image.src = src
  }, [src])

  useEffect(() => {
    const fit = () => {
      const w = Math.min(520, window.innerWidth - 64)
      const h = Math.min(w / aspect, window.innerHeight * 0.5)
      setBox({ w: h * aspect, h })
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [aspect])

  useEffect(() => {
    const el = frameRef.current
    if (!el) return
    const onWheel = e => { e.preventDefault(); setZoom(z => clamp(z - e.deltaY * 0.002, 1, 5)) }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [img])

  const natW = img ? img.naturalWidth : 1
  const natH = img ? img.naturalHeight : 1
  const scale = Math.max(box.w / natW, box.h / natH) * zoom
  const halfW = box.w / (2 * scale)
  const halfH = box.h / (2 * scale)
  const cx = clamp(center.x, halfW, natW - halfW)
  const cy = clamp(center.y, halfH, natH - halfH)

  const pinchDistance = () => {
    const [a, b] = [...pointers.current.values()]
    return Math.hypot(a.x - b.x, a.y - b.y)
  }

  const onDown = e => {
    e.currentTarget.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    gesture.current = pointers.current.size === 2
      ? { dist: pinchDistance(), zoom }
      : { x: e.clientX, y: e.clientY, cx, cy }
  }

  const onMove = e => {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const g = gesture.current
    if (pointers.current.size === 2 && g.dist) {
      setZoom(clamp((g.zoom * pinchDistance()) / g.dist, 1, 5))
    } else if (g.cx !== undefined) {
      setCenter({ x: g.cx - (e.clientX - g.x) / scale, y: g.cy - (e.clientY - g.y) / scale })
    }
  }

  const onUp = e => {
    pointers.current.delete(e.pointerId)
    const [left] = [...pointers.current.values()]
    gesture.current = left ? { x: left.x, y: left.y, cx, cy } : null
  }

  const save = () => {
    const sw = box.w / scale
    const sh = box.h / scale
    const width = Math.max(1, Math.min(outWidth, Math.round(sw)))
    const height = Math.max(1, Math.round(width / aspect))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (type !== 'image/png') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, width, height) }
    ctx.drawImage(img, cx - sw / 2, cy - sh / 2, sw, sh, 0, 0, width, height)
    onDone(canvas.toDataURL(type, 0.85))
  }

  const reset = () => { setZoom(1); setCenter({ x: natW / 2, y: natH / 2 }) }

  return (
    <Modal title="تنظیم عکس" onClose={onCancel}>
      {failed && <p className="err">این فایل عکس معتبر نیست.</p>}
      {!failed && !img && <p>در حال بارگذاری…</p>}
      {img && (
        <>
          <p className="hint">عکس را بکشید تا بخش مورد نظر داخل کادر بیفتد و با نوار پایین زوم کنید.</p>
          <div className="cropbox" ref={frameRef} style={{ width: box.w, height: box.h }}
            onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
            <img src={src} alt="" draggable="false"
              style={{ width: natW * scale, height: natH * scale, left: box.w / 2 - cx * scale, top: box.h / 2 - cy * scale }} />
            <div className="cropgrid" />
          </div>
          <div className="zoomrow">
            <button type="button" className="btn sm ghost dark" onClick={() => setZoom(z => clamp(z - 0.25, 1, 5))} aria-label="کم کردن زوم">−</button>
            <input type="range" min="1" max="5" step="0.01" value={zoom} onChange={e => setZoom(Number(e.target.value))} aria-label="بزرگ‌نمایی" />
            <button type="button" className="btn sm ghost dark" onClick={() => setZoom(z => clamp(z + 0.25, 1, 5))} aria-label="زیاد کردن زوم">+</button>
          </div>
          <div className="mact">
            <button type="button" className="btn" onClick={save}>ثبت عکس</button>
            <button type="button" className="btn ghost dark" onClick={onCancel}>انصراف</button>
            <button type="button" className="lnk redlnk" onClick={reset}>بازنشانی</button>
          </div>
        </>
      )}
    </Modal>
  )
}
