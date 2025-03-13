#!/bin/bash

# Script to fix common build errors in ClaudeHopper

# Make the script executable
chmod +x fix_build_errors.sh
chmod +x test_image_search.sh
chmod +x tools/test_image_search.js

# Install required dependencies
npm install pdf-lib @types/pdf-lib

# Fix the type error in the image_search.ts file
echo "Fixing type error in image_search.ts..."
sed -i '' 's/retriever\.invoke({query: params\.description})/retriever.invoke(params.description)/' src/tools/operations/image_search.ts

# Create types directory and add pdf-lib type declaration
echo "Adding pdf-lib type declaration..."
mkdir -p src/types
cat > src/types/pdf-lib.d.ts << 'EOL'
// Basic type declarations for pdf-lib
declare module 'pdf-lib' {
  export class PDFDocument {
    static load(bytes: Uint8Array | ArrayBuffer | Buffer): Promise<PDFDocument>;
    getPageCount(): number;
    save(): Promise<Uint8Array>;
  }
}
EOL

echo "Errors fixed! Try building again with: npm run build"
