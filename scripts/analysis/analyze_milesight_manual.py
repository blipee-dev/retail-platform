#!/usr/bin/env python3
"""
Analyze Milesight fisheye camera user manual to extract key capabilities
"""

import PyPDF2
import re
from collections import defaultdict

def extract_pdf_text(pdf_path):
    """Extract text from PDF file"""
    text = ""
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            num_pages = len(pdf_reader.pages)
            print(f"Total pages: {num_pages}")
            
            for page_num in range(num_pages):
                page = pdf_reader.pages[page_num]
                text += f"\n\n--- Page {page_num + 1} ---\n"
                text += page.extract_text()
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return None
    
    return text

def analyze_content(text):
    """Analyze the extracted text for key features"""
    if not text:
        return None
    
    # Convert to lowercase for searching
    text_lower = text.lower()
    
    # Key sections to look for
    sections = {
        'analytics': [],
        'people_counting': [],
        'heatmap': [],
        'vca': [],
        'integration': [],
        'api': [],
        'notification': [],
        'zone': [],
        'region': [],
        'demographic': [],
        'object_detection': [],
        'multi_camera': [],
        'export': [],
        'onvif': [],
        'rtsp': []
    }
    
    # Search patterns
    patterns = {
        'analytics': r'(?i)(analytics?|analysis|intelligent|smart|ai)',
        'people_counting': r'(?i)(people\s*count|counting|footfall|traffic\s*count|visitor\s*count)',
        'heatmap': r'(?i)(heat\s*map|heatmap|density\s*map)',
        'vca': r'(?i)(vca|video\s*content\s*analysis)',
        'integration': r'(?i)(integrat|third.*party|platform|software)',
        'api': r'(?i)(api|sdk|interface|protocol)',
        'notification': r'(?i)(alert|notification|alarm|trigger|event)',
        'zone': r'(?i)(zone|area|region|roi)',
        'demographic': r'(?i)(demographic|age|gender|face)',
        'object_detection': r'(?i)(object\s*detect|classification|recognition)',
        'multi_camera': r'(?i)(multi.*camera|camera.*group|synchroniz)',
        'export': r'(?i)(export|download|csv|json|xml|data\s*format)',
        'onvif': r'(?i)(onvif)',
        'rtsp': r'(?i)(rtsp|streaming)'
    }
    
    # Split text into lines for context
    lines = text.split('\n')
    
    # Search for patterns and extract context
    for i, line in enumerate(lines):
        for key, pattern in patterns.items():
            if re.search(pattern, line):
                # Get context (previous and next line if available)
                context = []
                if i > 0:
                    context.append(lines[i-1])
                context.append(line)
                if i < len(lines) - 1:
                    context.append(lines[i+1])
                
                sections[key].append(' '.join(context).strip())
    
    return sections

def print_analysis(sections):
    """Print the analysis results"""
    print("\n=== MILESIGHT FISHEYE CAMERA CAPABILITY ANALYSIS ===\n")
    
    for section, findings in sections.items():
        if findings:
            print(f"\n{section.upper().replace('_', ' ')}:")
            print("-" * 50)
            # Remove duplicates and print unique findings
            unique_findings = list(set(findings))
            for i, finding in enumerate(unique_findings[:5]):  # Limit to 5 per section
                print(f"{i+1}. {finding[:200]}...")  # Limit length
    
    print("\n" + "="*50)

def main():
    pdf_path = "/workspaces/retail-platform/docs/specifications/milesight-fisheye-network-camera-user-manual.pdf"
    
    print("Extracting text from PDF...")
    text = extract_pdf_text(pdf_path)
    
    if text:
        print(f"\nExtracted {len(text)} characters of text")
        
        # Save full text for reference
        with open("/workspaces/retail-platform/milesight_manual_text.txt", "w", encoding="utf-8") as f:
            f.write(text)
        print("Full text saved to milesight_manual_text.txt")
        
        print("\nAnalyzing content...")
        sections = analyze_content(text)
        
        if sections:
            print_analysis(sections)
            
            # Also search for specific capability mentions
            print("\n\n=== SPECIFIC CAPABILITY SEARCH ===\n")
            
            # Search for specific features
            specific_searches = [
                "people counting",
                "heat map",
                "VCA",
                "video content analysis",
                "demographic",
                "age detection",
                "gender detection",
                "object tracking",
                "line crossing",
                "intrusion detection",
                "loitering",
                "crowd detection",
                "SDK",
                "API",
                "ONVIF",
                "RTSP",
                "JSON",
                "XML",
                "CSV",
                "export data",
                "third party",
                "integration",
                "multi-camera"
            ]
            
            for search_term in specific_searches:
                occurrences = len(re.findall(rf'(?i){search_term}', text))
                if occurrences > 0:
                    print(f"'{search_term}': Found {occurrences} occurrences")

if __name__ == "__main__":
    main()