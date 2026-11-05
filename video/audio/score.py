#!/usr/bin/env python3
"""The soundtrack, synthesized from sine waves and noise on the film's 120 BPM grid.

Reads data/cues.json (written by render/cues.mjs from src/cues.js) and writes out/audio.wav (48 kHz, stereo).
Restrained on purpose: a warm pad, a quiet eighth-note pluck, soft impacts on the key moments, tactile clicks for
UI, and a resolved chord on the wordmark. No samples, no downloads.
"""
import json
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SR = 48000
CUES = json.loads((ROOT / "data" / "cues.json").read_text())
C = CUES["cues"]
DUR = CUES["duration"]
BEAT = 60 / CUES["bpm"]
N = int(SR * (DUR + 0.0))
rng = np.random.default_rng(177)

L = np.zeros(N)
R = np.zeros(N)
REV = np.zeros(N)  # mono send into the reverb


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def place(sig, t, gain=1.0, pan=0.0, send=0.25):
    i = int(round(t * SR))
    if i >= N or i + len(sig) <= 0:
        return
    s = sig * gain
    if i < 0:
        s = s[-i:]
        i = 0
    s = s[: N - i]
    lg, rg = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    L[i : i + len(s)] += s * lg * 1.414
    R[i : i + len(s)] += s * rg * 1.414
    REV[i : i + len(s)] += s * send


def env(n, a, d, curve=4.0):
    t = np.arange(n) / SR
    att = np.clip(t / max(a, 1e-4), 0, 1)
    return att * np.exp(-curve * t / d)


# ---------------------------------------------------------------- instruments
def pluck(midi, dur=0.6, bright=0.35):
    n = int(SR * dur)
    t = np.arange(n) / SR
    f = hz(midi)
    s = np.sin(2 * np.pi * f * t) + bright * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 9) + 0.12 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t * 14)
    return s * env(n, 0.003, dur, 5.0)


def pad(midis, dur, attack=0.8, release=1.2):
    n = int(SR * dur)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for m in midis:
        f = hz(m)
        for det in (-0.12, 0.0, 0.12):  # cents-ish detune
            ff = f * 2 ** (det / 12)
            s += np.sin(2 * np.pi * ff * t + rng.uniform(0, 6.28)) + 0.18 * np.sin(2 * np.pi * 2 * ff * t)
    s /= len(midis) * 3
    a = np.clip(t / attack, 0, 1)
    rel = np.clip((dur - t) / release, 0, 1)
    # slow shimmer
    lfo = 1 + 0.06 * np.sin(2 * np.pi * 0.25 * t)
    return s * a * rel * lfo


def click(freq=3200, dur=0.035, noise=0.5):
    n = int(SR * dur)
    t = np.arange(n) / SR
    s = (1 - noise) * np.sin(2 * np.pi * freq * t) + noise * rng.standard_normal(n)
    # simple one-pole lowpass on the noise part for softness
    out = np.zeros(n)
    acc = 0.0
    for i in range(n):
        acc += 0.35 * (s[i] - acc)
        out[i] = acc
    return out * np.exp(-t * 140)


def tick(midi, dur=0.25):
    """A small glassy tonal tick."""
    n = int(SR * dur)
    t = np.arange(n) / SR
    f = hz(midi)
    s = np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 30)
    return s * env(n, 0.001, dur, 7.0)


def impact(dur=1.6, f0=62, f1=44, body=1.0):
    """A soft low impact: a pitched-down sine thump with a short filtered noise breath. No trailer boom."""
    n = int(SR * dur)
    t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t * 7)
    ph = 2 * np.pi * np.cumsum(f) / SR
    thump = np.sin(ph) * np.exp(-t * 3.2) * body
    nz = rng.standard_normal(n)
    lp = np.zeros(n)
    acc = 0.0
    for i in range(min(n, int(SR * 0.25))):
        acc += 0.04 * (nz[i] - acc)
        lp[i] = acc
    breath = lp * np.exp(-t * 18) * 3.0
    a = np.clip(t / 0.006, 0, 1)
    return (thump + breath) * a * 0.5


def swell(dur, peak_at=0.85):
    """Filtered noise that rises and stops: a soft air movement for camera moves."""
    n = int(SR * dur)
    t = np.arange(n) / SR
    nz = rng.standard_normal(n)
    out = np.zeros(n)
    acc = 0.0
    for i in range(n):
        k = 0.01 + 0.06 * (t[i] / dur)
        acc += k * (nz[i] - acc)
        out[i] = acc
    shape = np.where(t < peak_at * dur, (t / (peak_at * dur)) ** 2, np.clip(1 - (t - peak_at * dur) / ((1 - peak_at) * dur), 0, 1) ** 1.5)
    return out * shape * 2.2


# ---------------------------------------------------------------- harmony
# D major, warm and unresolved until the end: Dmaj9 | Bm11 | Gmaj9 | Asus4, two bars each.
PROG = [[50, 57, 61, 64, 69], [47, 54, 57, 62, 64], [43, 50, 54, 57, 62], [45, 52, 55, 57, 62]]
ARP = [[62, 66, 69, 73, 76, 73, 69, 66], [59, 62, 66, 69, 71, 69, 66, 62], [55, 62, 66, 69, 71, 69, 66, 62], [57, 62, 64, 69, 71, 69, 64, 62]]
BAR = 4 * BEAT
CHORD_LEN = 2 * BAR

end_t = C["wordmark"]
# Pad across the film, phrase by phrase.
t = 0.0
k = 0
while t < end_t:
    d = min(CHORD_LEN, end_t - t) + 1.2
    place(pad(PROG[k % 4], d, attack=1.2 if t == 0 else 0.6, release=1.0), t, 0.16, pan=0.0, send=0.6)
    t += CHORD_LEN
    k += 1


def bed_gain(tt):
    """Where the pulse plays and how loud: quiet under reading, thinner for the collapse, out before the end."""
    if tt < C["hero"]:
        return 0.0
    if C["collapse"] - 0.5 <= tt < C["node"] + 0.5:
        return 0.0
    if tt >= C["bookend"]:
        return 0.0
    if C["mp"] <= tt < C["mpOut"]:
        return 0.55
    return 0.8


# Eighth-note pluck arpeggio.
step = BEAT / 2
i = 0
while i * step < C["bookend"]:
    tt = i * step
    g = bed_gain(tt)
    if g > 0:
        chord = int(tt // CHORD_LEN) % 4
        note = ARP[chord][i % 8]
        accent = 1.0 if i % 4 == 0 else 0.7
        place(pluck(note, 0.45, 0.3), tt, 0.05 * g * accent, pan=(-0.35 if i % 2 else 0.35), send=0.35)
    i += 1

# Soft sub pulse on each bar's downbeat while the bed plays.
b = 0
while b * BAR < C["bookend"]:
    tt = b * BAR
    if bed_gain(tt) > 0:
        place(impact(0.9, 55, 41, 0.6), tt, 0.14 * bed_gain(tt), send=0.05)
    b += 1

# ---------------------------------------------------------------- events
# Opening: the House fills with a rising run of glassy ticks, over a low soft impact.
place(impact(2.4, 58, 38, 1.0), 0.0, 0.42, send=0.25)
run = [62, 64, 66, 69, 71, 73, 74, 76, 78, 81, 83, 85]
for j, m in enumerate(run):
    place(tick(m + 12, 0.3), max(0.0, C["fill"]) + 0.08 + j * (1.1 / len(run)), 0.05 + 0.004 * j, pan=-0.8 + 1.6 * j / (len(run) - 1), send=0.5)
place(impact(1.4, 70, 50, 0.7), C["hero"], 0.22, send=0.3)

# Find your MP: keys, the press, the answer.
for j in range(7):
    if j == 3:
        continue  # the space bar is the gap in "K0A 1L0"
    place(click(2600 + 300 * (j % 3), 0.03, 0.6), C["typeStart"] + j * 0.25, 0.22, pan=-0.1, send=0.1)
place(click(1400, 0.05, 0.4), C["press"], 0.34, send=0.15)
place(tick(81, 0.6), C["result"], 0.12, pan=0.3, send=0.6)
place(tick(88, 0.5), C["result"] + 0.125, 0.06, pan=0.4, send=0.6)

# Vote 177: the move, the ballot wave, the tally, "Failed".
place(swell(1.0), C["vote"] - 0.2, 0.05, send=0.4)
for j in range(10):
    place(tick(74 + (j % 5) * 2, 0.18), C["wave"] + j * 0.125, 0.035, pan=-0.7 + 1.4 * j / 9, send=0.4)
for j in range(11):
    place(click(3800, 0.02, 0.3), C["tally"] + j * 0.125, 0.07 * (1 - j / 14), pan=0.4, send=0.1)
place(impact(2.0, 60, 40, 1.0), C["failed"], 0.5, send=0.35)

# Broke ranks: two seats lift.
place(tick(85, 0.7), C["dissent"], 0.09, pan=-0.5, send=0.7)
place(tick(88, 0.7), C["dissent"] + 0.25, 0.08, pan=-0.4, send=0.7)
# Party table rows tick in; the total lands.
for j in range(CUES["partyRows"]):
    place(click(3000, 0.025, 0.4), C["table"] + 0.25 + j * 0.25, 0.12, pan=0.35, send=0.1)
place(impact(1.6, 64, 44, 0.9), C["total"], 0.34, send=0.3)

# An MP's record.
place(swell(0.9), C["mp"] - 0.3, 0.04, send=0.4)
for j in range(2):
    place(click(2800, 0.025, 0.4), C["mpRows"] + j * 0.25, 0.1, send=0.1)
place(tick(83, 0.6), C["mpDissentRow"], 0.08, send=0.6)

# The whole vote collapses into one point on the bill's timeline.
place(swell(1.0, 0.95), C["collapse"], 0.09, send=0.35)
place(impact(1.8, 52, 36, 1.0), C["node"], 0.5, send=0.4)
# French and back.
place(click(2200, 0.04, 0.5), C["french"] - 0.25, 0.2, pan=0.6, send=0.15)
place(click(2200, 0.04, 0.5), C["english"] - 0.25, 0.2, pan=0.6, send=0.15)
place(tick(78, 0.8), C["summary"], 0.07, send=0.7)
place(tick(85, 0.6), C["summary"] + 0.25, 0.04, send=0.7)

# Every vote: rows tick in, then the bars bend into the chamber.
for j in range(CUES["ledgerRows"]):
    place(click(3300, 0.022, 0.35), C["ledger"] + 0.25 + j * 0.125, 0.09, pan=-0.3 + 0.06 * j, send=0.1)
place(swell(C["bend"] + 1.5 - C["pull"] + 0.2, 0.9), C["pull"], 0.07, send=0.5)
for j, m in enumerate([66, 69, 73, 76, 78, 81, 85, 88]):
    place(tick(m, 0.35), C["seats"] + j * 0.0625, 0.045, pan=-0.6 + 1.2 * j / 7, send=0.6)
place(impact(2.0, 58, 40, 1.0), C["bookend"], 0.42, send=0.4)

# The end: the chamber condenses into the mark; a resolved D major chord on the wordmark.
place(swell(1.2, 0.9), C["condense"] - 0.1, 0.06, send=0.5)
fin = DUR - C["wordmark"]
place(pad([38, 50, 57, 62, 66, 69, 74], fin, attack=0.05, release=2.6), C["wordmark"], 0.28, send=0.8)
for j, m in enumerate([62, 66, 69, 74]):
    place(pluck(m, 2.5, 0.25), C["wordmark"] + j * 0.06, 0.07, pan=-0.3 + 0.2 * j, send=0.8)
place(impact(2.4, 56, 37, 0.8), C["wordmark"], 0.3, send=0.4)
place(tick(86, 1.2), C["canada"], 0.05, pan=0.3, send=0.8)

# ---------------------------------------------------------------- reverb (FFT convolution with a decaying noise tail)
ir_len = int(SR * 2.6)
ti = np.arange(ir_len) / SR
irL = rng.standard_normal(ir_len) * np.exp(-ti * 2.6)
irR = rng.standard_normal(ir_len) * np.exp(-ti * 2.6)
for ir in (irL, irR):
    ir[: int(SR * 0.012)] = 0
    ir /= np.sqrt(np.sum(ir ** 2))


def conv(x, h):
    n = len(x) + len(h) - 1
    nf = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, nf) * np.fft.rfft(h, nf), nf)[: len(x)]


wetL = conv(REV, irL) * 0.32
wetR = conv(REV, irR) * 0.32
outL = L + wetL
outR = R + wetR

# Final fade so the last frame lands in near silence, and a soft limiter.
fade = np.ones(N)
fl = int(SR * 1.6)
fade[-fl:] = np.linspace(1, 0, fl) ** 1.5
outL *= fade
outR *= fade
target = 10 ** (-1.0 / 20)
# Drive so the overall RMS sits near -17 dBFS (about -16 LUFS for this material); tanh catches the impacts.
rms = np.sqrt(np.mean(((outL + outR) / 2)[: int(SR * C["wordmark"])] ** 2))
g = 10 ** (-17 / 20) / rms
def soft(x):
    # linear below the knee, tanh above it
    k = 0.6
    y = x.copy()
    m = np.abs(x) > k
    y[m] = np.sign(x[m]) * (k + (1 - k) * np.tanh((np.abs(x[m]) - k) / (1 - k)))
    return y * target


outL = soft(outL * g)
outR = soft(outR * g)

out_dir = ROOT / "out"
out_dir.mkdir(exist_ok=True)
pcm = (np.stack([outL, outR], axis=1) * 32767).astype(np.int16)
with wave.open(str(out_dir / "audio.wav"), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())

# Loudness curve: RMS per second in dBFS, so the mix can be checked without ears.
mono = (outL + outR) / 2
print("sec  rms_dBFS  peak_dBFS")
for s in range(int(DUR)):
    seg = mono[s * SR : (s + 1) * SR]
    rms = 20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-9)
    pk = 20 * np.log10(np.max(np.abs(seg)) + 1e-9)
    print(f"{s:3d}  {rms:7.1f}  {pk:7.1f}  " + "#" * max(0, int((rms + 50) / 1.5)))
print("wrote", out_dir / "audio.wav")
