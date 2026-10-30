"""Récupère les documents Claude Docs exportés pendant une session Claude Code.

Après des appels à l'export Claude Docs (format markdown), le contenu se trouve dans le journal de
la session (~/.claude/projects/<projet>/<session>.jsonl). Ce script le décode et écrit un fichier
Markdown par document, précédé de sa source.

Usage : python3 -I extraire_claude_docs.py <session.jsonl> <dossier de sortie (dans prive/)>
"""
import base64, json, re, sys, pathlib
transcript, dest = sys.argv[1], pathlib.Path(sys.argv[2])
found = {}
def walk(o):
    if isinstance(o, dict):
        for v in o.values():
            yield from walk(v)
    elif isinstance(o, list):
        for v in o:
            yield from walk(v)
    elif isinstance(o, str) and '"bytes_b64"' in o:
        yield o
with open(transcript, encoding='utf-8') as f:
    for line in f:
        if '"bytes_b64' not in line:
            continue
        try:
            rec = json.loads(line)
        except Exception:
            continue
        for s in walk(rec):
            try:
                d = json.loads(s)
            except Exception:
                continue
            data, frame = d.get('data', {}), d.get('frame', {})
            if 'bytes_b64' in data:
                found[frame.get('url')] = (data['name'], base64.b64decode(data['bytes_b64']).decode('utf-8'))
for url, (name, text) in found.items():
    safe = re.sub(r'[\\/:*?"<>|]', '-', name)
    (dest / safe).write_text(f'<!-- Source : {url} (Claude Docs, export du 30/10/2026) -->\n\n' + text, encoding='utf-8')
    print(len(text), safe)
print(len(found), 'documents')
