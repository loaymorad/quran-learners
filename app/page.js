"use client";
import { useEffect, useRef, useState } from "react";

const API = "https://api.alquran.cloud/v1";
// صوت كل آية منفصلة من EveryAyah — الشيخ محمد صديق المنشاوي (مرتل)
const pad = (n) => String(n).padStart(3, "0");
const audioUrl = (s, a) => `https://everyayah.com/data/Minshawy_Murattal_128kbps/${pad(s)}${pad(a)}.mp3`;
const ar = (n) => Number(n).toLocaleString("ar-EG");
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, Number(v) || lo));
const BISMILLAH_WORDS = 4;

export default function Page() {
  const audio = useRef(null);
  const [surahs, setSurahs] = useState([]);
  const [surah, setSurah] = useState(1);
  const [ayahs, setAyahs] = useState([]);
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(7);
  const [perAyah, setPerAyah] = useState(3);
  const [rounds, setRounds] = useState(2);
  const [pos, setPos] = useState(null); // { ayah, rep, round }
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/surah`).then((r) => r.json()).then((j) => setSurahs(j.data)).catch(() => setError("تعذّر تحميل قائمة السور"));
  }, []);

  useEffect(() => {
    stop();
    setAyahs([]);
    fetch(`${API}/surah/${surah}/quran-uthmani`)
      .then((r) => r.json())
      .then((j) => {
        const list = j.data.ayahs.map((a) => {
          let text = a.text;
          // الواجهة تضيف البسملة إلى الآية الأولى، نحذفها (ما عدا الفاتحة)
          if (surah !== 1 && surah !== 9 && a.numberInSurah === 1) text = text.split(" ").slice(BISMILLAH_WORDS).join(" ");
          return { n: a.numberInSurah, text };
        });
        setAyahs(list);
        setFrom(1);
        setTo(Math.min(5, list.length));
        setError("");
      })
      .catch(() => setError("تعذّر تحميل نص السورة"));
  }, [surah]);

  // تشغيل الآية كلما تغيّر الموضع
  useEffect(() => {
    if (!pos || !playing) return;
    const a = audio.current;
    a.src = audioUrl(surah, pos.ayah);
    a.play().catch(() => { setPlaying(false); setError("تعذّر تشغيل الصوت"); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos]);

  function next() {
    const p = pos;
    if (p.rep < perAyah) return { ...p, rep: p.rep + 1 };
    if (p.ayah < to) return { ayah: p.ayah + 1, rep: 1, round: p.round };
    if (p.round < rounds) return { ayah: from, rep: 1, round: p.round + 1 };
    return null;
  }

  function onEnded() {
    const n = next();
    if (n) setPos(n);
    else { setPlaying(false); setPos(null); }
  }

  function start(ayah = from) {
    setError("");
    setPlaying(true);
    setPos({ ayah, rep: 1, round: 1 });
  }
  function toggle() {
    const a = audio.current;
    if (playing) { a.pause(); setPlaying(false); }
    else if (pos) { a.play(); setPlaying(true); }
    else start();
  }
  function stop() {
    audio.current?.pause();
    setPlaying(false);
    setPos(null);
  }

  const max = ayahs.length || 1;
  const visible = ayahs.filter((a) => a.n >= from && a.n <= to);

  return (
    <main>
      <h1>تعلّم القراءة</h1>
      <p className="sub">اختر الآيات وعدد التكرار، واستمع بصوت الشيخ المنشاوي.</p>

      <section className="panel">
        <label className="wide">السورة
          <select value={surah} onChange={(e) => setSurah(Number(e.target.value))}>
            {surahs.map((s) => <option key={s.number} value={s.number}>{ar(s.number)}. {s.name}</option>)}
          </select>
        </label>
        <label>من آية
          <input type="number" min="1" max={max} value={from} onChange={(e) => { const v = clamp(e.target.value, 1, max); setFrom(v); if (v > to) setTo(v); stop(); }} />
        </label>
        <label>إلى آية
          <input type="number" min="1" max={max} value={to} onChange={(e) => { const v = clamp(e.target.value, 1, max); setTo(v); if (v < from) setFrom(v); stop(); }} />
        </label>
        <label>عدد مرات كل آية
          <input type="number" min="1" max="50" value={perAyah} onChange={(e) => setPerAyah(clamp(e.target.value, 1, 50))} />
        </label>
        <label>عدد مرات الدورة
          <input type="number" min="1" max="50" value={rounds} onChange={(e) => setRounds(clamp(e.target.value, 1, 50))} />
        </label>
      </section>

      {error && <p className="err">{error}</p>}

      <div className="text">
        {visible.map((a) => (
          <span key={a.n} className={`ayah ${pos?.ayah === a.n ? "on" : ""}`} onClick={() => start(a.n)}>
            {a.text}<span className="num">﴿{ar(a.n)}﴾</span>{" "}
          </span>
        ))}
      </div>

      <div className="bar">
        <div>
          <div className="status">
            {pos ? (<>الآية <b>{ar(pos.ayah)}</b> · التكرار <b>{ar(pos.rep)}</b> من {ar(perAyah)} · الدورة <b>{ar(pos.round)}</b> من {ar(rounds)}</>) : "جاهز للبدء"}
          </div>
          <div className="btns">
            <button className="main" onClick={toggle} disabled={!ayahs.length}>{playing ? "إيقاف مؤقت" : pos ? "متابعة" : "ابدأ"}</button>
            <button onClick={stop} disabled={!pos}>إنهاء</button>
          </div>
        </div>
      </div>

      <audio ref={audio} onEnded={onEnded} onError={() => { setPlaying(false); setError("تعذّر تحميل الصوت، تحقق من الاتصال"); }} />
    </main>
  );
}
