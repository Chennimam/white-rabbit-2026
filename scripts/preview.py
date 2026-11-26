"""Serve the existing static export locally; no network exposure or deployment."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import webbrowser
import argparse

parser = argparse.ArgumentParser()
parser.add_argument("--directory", type=Path)
parser.add_argument("--port", type=int, default=3000)
args = parser.parse_args()
root = args.directory.resolve() if args.directory else Path(__file__).resolve().parent.parent / "out"
if not (root / "index.html").exists():
    raise SystemExit("Сначала выполните npm ci и npm run build в папке проекта.")
handler = partial(SimpleHTTPRequestHandler, directory=str(root))
try:
    server = ThreadingHTTPServer(("127.0.0.1", args.port), handler)
except OSError:
    raise SystemExit(f"Порт {args.port} уже занят. Остановите предыдущий preview и запустите снова.")
url = f"http://127.0.0.1:{args.port}"
print(f"Локальный preview: {url}\nДля остановки нажмите Ctrl+C.", flush=True)
webbrowser.open(url)
try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
finally:
    server.server_close()
