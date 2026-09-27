import os
import re

directory = 'c:/Users/SUJAL SAHU/Desktop/VS/HOSHO-BOMS/frontend/src'

replacements = {
    r'#f8fafc': 'var(--text-main)',
    r'#94a3b8': 'var(--text-muted)',
    r'#e2e8f0': 'var(--text-main)',
    r'#cbd5e1': 'var(--text-muted)',
    r'rgba\(15,\s*23,\s*42,\s*0\.4\)': 'var(--surface-color)',
    r'rgba\(15,\s*23,\s*42,\s*0\.8\)': 'var(--surface-highlight)',
    r'rgba\(15,\s*23,\s*42,\s*0\.95\)': 'var(--surface-highlight)',
    r'rgba\(15,\s*23,\s*42,\s*0\.7\)': 'var(--surface-color)',
    r'rgba\(30,\s*41,\s*59,\s*0\.3\)': 'var(--surface-color)',
    r'rgba\(30,\s*41,\s*59,\s*0\.5\)': 'var(--surface-color)',
    r'rgba\(30,\s*41,\s*59,\s*0\.98\)': 'var(--bg-color)',
    r'rgba\(15,\s*23,\s*42,\s*0\.98\)': 'var(--surface-color)',
    r'rgba\(30,\s*41,\s*59,\s*0\.6\)': 'var(--surface-highlight)',
    r'#0f172a': 'var(--text-main)'
}

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.css') and file != 'index.css':
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original = content
            for pattern, repl in replacements.items():
                content = re.sub(pattern, repl, content)
                
            if content != original:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f'Updated {path}')
