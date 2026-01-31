import sys
import os

def convert(input_file, output_file, var_name):
    with open(input_file, 'rb') as f:
        data = f.read()
    
    with open(output_file, 'w') as f:
        f.write(f'#pragma once\n\n')
        f.write(f'static const unsigned int {var_name}_len = {len(data)};\n')
        f.write(f'static const unsigned char {var_name}[] = {{\n')
        
        for i in range(0, len(data), 12):
            chunk = data[i:i+12]
            hex_chunk = ', '.join([f'0x{b:02x}' for b in chunk])
            f.write(f'    {hex_chunk},\n')
            
        f.write(f'}};\n')

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python binary_to_header.py <input> <output> <var_name>")
        sys.exit(1)
    convert(sys.argv[1], sys.argv[2], sys.argv[3])
