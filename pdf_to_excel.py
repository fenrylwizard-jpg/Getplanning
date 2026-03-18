import pdfplumber
import pandas as pd
import sys
import os

def extract_pdf_to_excel(pdf_path, output_excel):
    print(f"Opening {pdf_path}...")
    all_data = []
    
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages):
            print(f"Processing page {i+1}...")
            
            # Extract table. We use vertical/horizontal lines if present, 
            # otherwise we might need to rely on text alignment.
            # pdfplumber's default extract_table often works well for explicit grids.
            table = page.extract_table(table_settings={
                "vertical_strategy": "text", 
                "horizontal_strategy": "text",
                "intersection_tolerance": 15
            })
            
            if table:
                all_data.extend(table)
            else:
                # If text strategy fails, let's try explicit grid lines
                table_lines = page.extract_table()
                if table_lines:
                    all_data.extend(table_lines)
                else:
                    print(f"No table found on page {i+1}")

    if not all_data:
        print("Failed to extract any tabular data.")
        return False
        
    df = pd.DataFrame(all_data)
    
    # Clean up empty rows/columns
    df.dropna(how='all', inplace=True)
    
    # Save to Excel
    df.to_excel(output_excel, index=False, header=False)
    print(f"Successfully saved to {output_excel}")
    return True

if __name__ == "__main__":
    pdf_file = "C:\\Users\\Imam\\Downloads\\herlin\\6127.1 ECOLE HERLIN PLANNING D'INTENTION détaillé du 20251111 A3.pdf"
    out_file = "C:\\Users\\Imam\\Downloads\\herlin\\planning_extracted.xlsx"
    
    if os.path.exists(pdf_file):
        extract_pdf_to_excel(pdf_file, out_file)
    else:
        print(f"File not found: {pdf_file}")
