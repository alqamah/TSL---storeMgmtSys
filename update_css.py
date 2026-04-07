import re

file_path = r"d:\TSL\TSL---storeMgmtSys\frontend\src\index.css"
with open(file_path, "r", encoding="utf-8") as f:
    css = f.read()

# Replace variables
replacements = {
    "--bg-primary: #0a0e1a;": "--bg-primary: #121212;",
    "--bg-secondary: #111827;": "--bg-secondary: #1a1a1a;",
    "--bg-card: #1a2235;": "--bg-card: #222222;",
    "--bg-card-hover: #1f2a40;": "--bg-card-hover: #2c2c2c;",
    "--bg-input: #151d2e;": "--bg-input: #1a1a1a;",
    
    "--border-default: #2a3450;": "--border-default: #404040;",
    "--border-focus: #3b82f6;": "--border-focus: #ffffff;",
    "--border-subtle: #1e293b;": "--border-subtle: #333333;",
    
    "--text-primary: #f1f5f9;": "--text-primary: #ffffff;",
    "--text-secondary: #94a3b8;": "--text-secondary: #a3a3a3;",
    "--text-muted: #64748b;": "--text-muted: #737373;",
    "--text-inverse: #0f172a;": "--text-inverse: #000000;",
    
    "--accent-blue: #3b82f6;": "--accent-blue: #ffffff;",
    "--accent-blue-hover: #2563eb;": "--accent-blue-hover: #e5e5e5;",
    "--accent-green: #10b981;": "--accent-green: #e5e5e5;",
    "--accent-green-hover: #059669;": "--accent-green-hover: #cccccc;",
    "--accent-amber: #f59e0b;": "--accent-amber: #cccccc;",
    "--accent-amber-hover: #d97706;": "--accent-amber-hover: #a3a3a3;",
    "--accent-red: #ef4444;": "--accent-red: #a3a3a3;",
    "--accent-red-hover: #dc2626;": "--accent-red-hover: #737373;",
    "--accent-purple: #8b5cf6;": "--accent-purple: #ffffff;",
    
    "--gradient-blue: linear-gradient(135deg, #3b82f6, #6366f1);": "--gradient-blue: #ffffff;",
    "--gradient-green: linear-gradient(135deg, #10b981, #06b6d4);": "--gradient-green: #e5e5e5;",
    "--gradient-amber: linear-gradient(135deg, #f59e0b, #ef4444);": "--gradient-amber: #cccccc;",
    
    "--radius-sm: 6px;": "--radius-sm: 0px;",
    "--radius-md: 10px;": "--radius-md: 0px;",
    "--radius-lg: 14px;": "--radius-lg: 0px;",
    "--radius-xl: 20px;": "--radius-xl: 0px;",
    "--radius-full: 9999px;": "--radius-full: 0px;",
    
    "--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);": "--shadow-sm: none;",
    "--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);": "--shadow-md: none;",
    "--shadow-lg: 0 12px 40px rgba(0, 0, 0, 0.5);": "--shadow-lg: none;",
    "--shadow-glow-blue: 0 0 20px rgba(59, 130, 246, 0.3);": "--shadow-glow-blue: none;",
    "--shadow-glow-green: 0 0 20px rgba(16, 185, 129, 0.3);": "--shadow-glow-green: none;"
}

for old, new_val in replacements.items():
    css = css.replace(old, new_val)

# Fix buttons
css = re.sub(
    r"\.btn-primary\s*\{\s*background:\s*var\(--accent-blue\);\s*color:\s*white;\s*\}",
    ".btn-primary {\n  background: var(--text-primary);\n  color: var(--bg-primary);\n}",
    css
)
css = re.sub(
    r"\.btn-success\s*\{\s*background:\s*var\(--accent-green\);\s*color:\s*white;\s*\}",
    ".btn-success {\n  background: var(--text-primary);\n  color: var(--bg-primary);\n}",
    css
)
css = re.sub(
    r"\.btn-danger\s*\{\s*background:\s*var\(--accent-red\);\s*color:\s*white;\s*\}",
    ".btn-danger {\n  background: var(--text-primary);\n  color: var(--bg-primary);\n}",
    css
)

# Fix stat-icons
css = re.sub(
    r"\.stat-icon\.blue\s*\{[^}]*\}\s*\.stat-icon\.green\s*\{[^}]*\}\s*\.stat-icon\.amber\s*\{[^}]*\}\s*\.stat-icon\.red\s*\{[^}]*\}\s*\.stat-icon\.purple\s*\{[^}]*\}",
    ".stat-icon.blue, .stat-icon.green, .stat-icon.amber, .stat-icon.red, .stat-icon.purple {\n  background: var(--bg-card-hover);\n  color: var(--text-primary);\n  border: 1px solid var(--border-default);\n}",
    css,
    flags=re.MULTILINE | re.DOTALL
)

# Fix Badges
css = re.sub(
    r"\.badge-green\s*\{[^}]*\}\s*\.badge-amber\s*\{[^}]*\}\s*\.badge-red\s*\{[^}]*\}\s*\.badge-blue\s*\{[^}]*\}",
    ".badge-green, .badge-amber, .badge-red, .badge-blue {\n  background: transparent;\n  color: var(--text-primary);\n  border: 1px solid var(--border-default);\n}",
    css,
    flags=re.MULTILINE | re.DOTALL
)

# Fix Toasts
css = re.sub(
    r"\.toast-success\s*\{[^}]*\}\s*\.toast-error\s*\{[^}]*\}\s*\.toast-info\s*\{[^}]*\}",
    ".toast-success, .toast-error, .toast-info {\n  background: var(--bg-card);\n  color: var(--text-primary);\n  border: 1px solid var(--border-default);\n}",
    css,
    flags=re.MULTILINE | re.DOTALL
)

# Fix Logo text colors
css = css.replace(
'''  background: var(--gradient-blue);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-lg);
  color: white;''',
'''  background: var(--gradient-blue);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-lg);
  color: var(--bg-primary);'''
)
css = css.replace(
'''  background: var(--gradient-blue);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: var(--font-sm);
  color: white;''',
'''  background: var(--gradient-blue);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: var(--font-sm);
  color: var(--bg-primary);'''
)
css = css.replace(
'''  background: var(--gradient-blue);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-2xl);
  color: white;''',
'''  background: var(--gradient-blue);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-2xl);
  color: var(--bg-primary);'''
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(css)

print("CSS updated successfully!")
