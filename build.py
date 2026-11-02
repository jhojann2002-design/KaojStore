#!/usr/bin/env python3
"""
Compilador AOT (Ahead-of-Time) ultrarrápido para Kaoj Store.
Compila app.jsx a JavaScript nativo (app.js) usando JavaScriptCore nativo de macOS y Babel.
Elimina la necesidad de transpilación en vivo en el navegador, reduciendo el tiempo de carga a 0ms.
"""
import os, sys, time, subprocess

def compile_app():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    jsx_path = os.path.join(root_dir, 'app.jsx')
    js_path = os.path.join(root_dir, 'app.js')
    babel_path = os.path.join(root_dir, 'tools', 'babel.min.js')
    jsc_bin = '/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc'

    if not os.path.exists(jsx_path):
        print(f"Error: {jsx_path} no existe.")
        sys.exit(1)

    if not os.path.exists(babel_path):
        print(f"Error: {babel_path} no encontrado.")
        sys.exit(1)

    if not os.path.exists(jsc_bin):
        print(f"Error: motor JSC no encontrado en {jsc_bin}")
        sys.exit(1)

    runner_js = f"""
    var global = this;
    var window = this;
    var console = {{ log: print, error: print, warn: print, info: print, debug: print }};
    load("{babel_path}");

    var src = read("{jsx_path}");
    var t0 = Date.now();
    var res = Babel.transform(src, {{
      presets: [["react", {{ runtime: "classic" }}]]
    }});
    writeFile("{js_path}", res.code);
    print("Compilación AOT exitosa: " + res.code.length + " bytes generados en " + (Date.now() - t0) + "ms");
    """

    runner_path = '/tmp/build_runner.js'
    with open(runner_path, 'w', encoding='utf-8') as f:
        f.write(runner_js)

    proc = subprocess.run([jsc_bin, runner_path], capture_output=True, text=True)
    if proc.returncode != 0:
        print("Error en compilación:", proc.stderr or proc.stdout)
        sys.exit(1)
    else:
        print(proc.stdout.strip())
        print(f"Archivo de producción listo: {js_path}")

if __name__ == '__main__':
    compile_app()
