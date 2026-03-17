#!/usr/bin/env python3
"""
make_waveform.py
────────────────
Utilisé par Make pour générer les données de waveform à partir du MP3.
Make télécharge le fichier MP3 depuis Dropbox, l'envoie à ce script
via un module HTTP, et récupère un tableau de 26 valeurs.

Usage : python make_waveform.py <fichier.mp3>
Output : JSON sur stdout → {"waveform": [8, 12, 16, ...], "duration": "2:34"}

Dépendances : pip install pydub numpy
"""

import sys
import json
import math
import struct
import wave
import subprocess
import tempfile
import os

def get_waveform_ffmpeg(mp3_path, num_points=26):
    """Génère les peaks waveform via ffmpeg (plus robuste)."""
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
        wav_path = tmp.name

    try:
        # Convertit MP3 → WAV mono basse qualité pour analyse
        subprocess.run([
            'ffmpeg', '-i', mp3_path,
            '-ac', '1',          # mono
            '-ar', '8000',       # 8kHz suffit pour l'analyse de peaks
            '-y', wav_path
        ], capture_output=True, check=True)

        with wave.open(wav_path, 'rb') as wf:
            n_frames = wf.getnframes()
            framerate = wf.getframerate()
            duration_sec = n_frames / framerate
            raw = wf.readframes(n_frames)

        # Parse les samples PCM 16-bit
        samples = list(struct.unpack(f'{len(raw)//2}h', raw))
        chunk_size = max(1, len(samples) // num_points)

        peaks = []
        for i in range(num_points):
            chunk = samples[i * chunk_size:(i + 1) * chunk_size]
            if chunk:
                rms = math.sqrt(sum(s*s for s in chunk) / len(chunk))
                # Normalise entre 4 et 20
                peaks.append(min(20, max(4, int(rms / 1638))))
            else:
                peaks.append(8)

        # Normalise pour que le max soit 20
        max_peak = max(peaks) if peaks else 1
        normalized = [max(4, int(p * 20 / max_peak)) for p in peaks]

        mins = int(duration_sec // 60)
        secs = int(duration_sec % 60)
        duration_str = f"{mins}:{str(secs).zfill(2)}"

        return {"waveform": normalized, "duration": duration_str}

    except Exception as e:
        # Fallback : waveform aléatoire si ffmpeg indispo
        import random
        random.seed(hash(os.path.basename(mp3_path)))
        fallback = [random.randint(4, 20) for _ in range(num_points)]
        return {"waveform": fallback, "duration": "0:00", "error": str(e)}

    finally:
        if os.path.exists(wav_path):
            os.unlink(wav_path)


def parse_filename(filename):
    """
    Convention de nommage attendue :
    NOM DU BEAT_140bpm_Am_TRAP.mp3
    Ex : MIDNIGHT DRIP_140bpm_Am_TRAP.mp3
         GOLDEN ERA_95bpm_Gm_HIPHOP.mp3
    """
    base = os.path.splitext(os.path.basename(filename))[0]
    parts = base.split('_')

    result = {
        "name": parts[0].strip().upper() if len(parts) > 0 else base.upper(),
        "bpm": 130,
        "key": "Am",
        "tag": "TRAP",
        "price": 30,
    }

    for part in parts[1:]:
        part = part.strip()
        if part.lower().endswith('bpm'):
            try:
                result["bpm"] = int(part.lower().replace('bpm', ''))
            except ValueError:
                pass
        elif any(part.upper().startswith(k) for k in ['AM','BM','CM','DM','EM','FM','GM','AB','BB','CB','DB','EB','GB']):
            result["key"] = part
        elif part.upper() in ['TRAP', 'HIPHOP', 'HIP-HOP', 'DRILL', 'AFRO', 'RNB', 'BOOMBAP']:
            result["tag"] = part.upper().replace('HIPHOP', 'HIP-HOP')
        elif part.startswith('€') or part.endswith('€'):
            try:
                result["price"] = int(part.replace('€', ''))
            except ValueError:
                pass

    return result


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python make_waveform.py <fichier.mp3>"}))
        sys.exit(1)

    mp3_path = sys.argv[1]
    if not os.path.exists(mp3_path):
        print(json.dumps({"error": f"Fichier introuvable: {mp3_path}"}))
        sys.exit(1)

    waveform_data = get_waveform_ffmpeg(mp3_path)
    file_meta = parse_filename(mp3_path)

    output = {**file_meta, **waveform_data}
    print(json.dumps(output, ensure_ascii=False))
