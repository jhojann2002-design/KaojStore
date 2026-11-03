#!/usr/bin/env python3
"""
Compilador AOT (Ahead-of-Time) ultrarrápido para Kaoj Store.
Compila app.jsx a JavaScript nativo (app.js) e inyecta el bundle compilado en index.html
usando JavaScriptCore nativo de macOS y Babel.
"""
import os, sys, re, subprocess

def compile_app():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    jsx_path = os.path.join(root_dir, 'app.jsx')
    js_path = os.path.join(root_dir, 'app.js')
    html_path = os.path.join(root_dir, 'index.html')
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
      presets: [["react", {{ runtime: "classic" }}]],
      compact: false,
      generatorOpts: {{ compact: false }}
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

    print(proc.stdout.strip())
    print(f"Archivo de producción listo: {js_path}")

    # Sincronizar automáticamente dentro de index.html y admin.html
    html_targets = [html_path, os.path.join(root_dir, 'admin.html')]
    with open(js_path, 'r', encoding='utf-8') as f:
        compiled_js = f.read().strip()

    # Quitar únicamente la llamada final ReactDOM.createRoot(...).render(...) sin truncar ninguna otra línea
    compiled_js = re.sub(
        r'ReactDOM\.createRoot\(document\.getElementById\([\'"]root[\'"]\)\)\.render\([^;]+\);?\s*$',
        '',
        compiled_js
    ).strip()

    lines = compiled_js.splitlines()
    indented_js = '\n'.join(('    ' + line if line.strip() else '') for line in lines)

    start_marker = "      return;\n    }\n"
    end_marker = "\n    // Montaje infalible de React 18 / 17"

    for target in html_targets:
        if os.path.exists(target):
            with open(target, 'r', encoding='utf-8') as f:
                html_content = f.read()

            if start_marker in html_content and end_marker in html_content:
                before = html_content.split(start_marker, 1)[0] + start_marker + "\n"
                after = end_marker + html_content.split(end_marker, 1)[1]
                updated_html = before + indented_js + after
                with open(target, 'w', encoding='utf-8') as f:
                    f.write(updated_html)
                print(f"Bundle inyectado y sincronizado en: {target}")
            else:
                print(f"Advertencia: marcadores de script no encontrados en {target}")

    # Invalidate cache: actualizar automáticamente versión única en sw.js
    import time
    sw_path = os.path.join(root_dir, 'sw.js')
    if os.path.exists(sw_path):
        with open(sw_path, 'r', encoding='utf-8') as f:
            sw_code = f.read()
        new_version = f"kaoj-store-v26_{int(time.time())}"
        sw_code = re.sub(r"const CACHE_NAME = ['\"][^'\"]+['\"];", f"const CACHE_NAME = '{new_version}';", sw_code)
        with open(sw_path, 'w', encoding='utf-8') as f:
            f.write(sw_code)
        print(f"Service Worker actualizado con nueva versión de caché: {new_version}")

if __name__ == '__main__':
    compile_app()
