#!/usr/bin/env python3

# Read the file
with open('app_clean.py', 'r') as f:
    content = f.read()

# Replace the origins line
old_line = 'origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3764").split(",")'
new_line = 'origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3764,http://localhost:3765").split(",")'

if old_line in content:
    content = content.replace(old_line, new_line)
    print('Found and replaced the origins line')
else:
    print('Could not find the exact line to replace')
    # Try with different spacing
    old_line2 = '    origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3764").split(",")'
    new_line2 = '    origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3764,http://localhost:3765").split(",")'
    if old_line2 in content:
        content = content.replace(old_line2, new_line2)
        print('Found and replaced the origins line with indentation')
    else:
        print('Still could not find the line')

# Write the file back
with open('app_clean.py', 'w') as f:
    f.write(content)
    
print('File updated successfully')
