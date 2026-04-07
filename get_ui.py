import csv

def find_in_csv(path, keyword, out_file):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if any(keyword.lower() in str(val).lower() for val in row.values()):
                    out_file.write(f"Found in {path}\n")
                    for k, v in row.items():
                        out_file.write(f"  {k}: {v}\n")
                    out_file.write("-" * 20 + "\n")
    except Exception as e:
        out_file.write(f"Error reading {path}: {e}\n")

with open('ui_data.txt', 'w', encoding='utf-8') as f:
    find_in_csv(r"C:\Users\alqam\.gemini\antigravity\skills\ui-ux-pro-max\data\styles.csv", "flat", f)
    find_in_csv(r"C:\Users\alqam\.gemini\antigravity\skills\ui-ux-pro-max\data\colors.csv", "monochrome", f)
