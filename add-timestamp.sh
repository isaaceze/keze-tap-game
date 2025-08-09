#!/bin/bash
# Created: 2025-08-07 05:57:00 UTC
# Updated: 2025-08-07 05:57:00 UTC
# Purpose: Automated timestamp addition script for Keze Tap Game files

echo "📅 Keze Tap Game - Timestamp Addition Tool"
echo "========================================="
echo ""

# Get current UTC timestamp
TIMESTAMP=$(date -u '+%Y-%m-%d %H:%M:%S UTC')

# Function to add timestamp to different file types
add_timestamp() {
    local file_path="$1"
    local file_ext="${file_path##*.}"
    local temp_file=$(mktemp)

    echo "📝 Adding timestamp to: $file_path"

    case "$file_ext" in
        "tsx"|"ts"|"js"|"jsx")
            # JavaScript/TypeScript files
            echo "/**" > "$temp_file"
            echo " * Created: $TIMESTAMP" >> "$temp_file"
            echo " * Updated: $TIMESTAMP" >> "$temp_file"
            echo " * Purpose: [Add file purpose here]" >> "$temp_file"
            echo " */" >> "$temp_file"

            # Add original content (skip if already has timestamp)
            if ! head -5 "$file_path" | grep -q "Created:"; then
                cat "$file_path" >> "$temp_file"
                mv "$temp_file" "$file_path"
                echo "✅ Timestamp added to $file_path"
            else
                echo "⚠️  Timestamp already exists in $file_path"
                rm "$temp_file"
            fi
            ;;

        "py")
            # Python files
            echo '"""' > "$temp_file"
            echo "Created: $TIMESTAMP" >> "$temp_file"
            echo "Updated: $TIMESTAMP" >> "$temp_file"
            echo "Purpose: [Add file purpose here]" >> "$temp_file"
            echo '"""' >> "$temp_file"
            echo "" >> "$temp_file"

            # Add original content (skip if already has timestamp)
            if ! head -5 "$file_path" | grep -q "Created:"; then
                cat "$file_path" >> "$temp_file"
                mv "$temp_file" "$file_path"
                echo "✅ Timestamp added to $file_path"
            else
                echo "⚠️  Timestamp already exists in $file_path"
                rm "$temp_file"
            fi
            ;;

        "md")
            # Markdown files
            # Get first line (should be title)
            first_line=$(head -1 "$file_path")
            echo "$first_line" > "$temp_file"
            echo "**Created**: $TIMESTAMP  " >> "$temp_file"
            echo "**Updated**: $TIMESTAMP" >> "$temp_file"
            echo "" >> "$temp_file"

            # Add rest of content (skip if already has timestamp)
            if ! head -5 "$file_path" | grep -q "Created:"; then
                tail -n +2 "$file_path" >> "$temp_file"
                mv "$temp_file" "$file_path"
                echo "✅ Timestamp added to $file_path"
            else
                echo "⚠️  Timestamp already exists in $file_path"
                rm "$temp_file"
            fi
            ;;

        "sh")
            # Shell scripts
            first_line=$(head -1 "$file_path")
            echo "$first_line" > "$temp_file"
            echo "# Created: $TIMESTAMP" >> "$temp_file"
            echo "# Updated: $TIMESTAMP" >> "$temp_file"
            echo "# Purpose: [Add script purpose here]" >> "$temp_file"
            echo "" >> "$temp_file"

            # Add rest of content (skip if already has timestamp)
            if ! head -5 "$file_path" | grep -q "Created:"; then
                tail -n +2 "$file_path" >> "$temp_file"
                mv "$temp_file" "$file_path"
                echo "✅ Timestamp added to $file_path"
            else
                echo "⚠️  Timestamp already exists in $file_path"
                rm "$temp_file"
            fi
            ;;

        *)
            echo "⚠️  Unsupported file type: $file_ext"
            rm "$temp_file"
            ;;
    esac
}

# Main execution
if [ $# -eq 0 ]; then
    echo "🔍 Usage: $0 <file_path> [file_path2] [file_path3]..."
    echo ""
    echo "📋 Supported file types:"
    echo "   • .tsx, .ts, .js, .jsx (JavaScript/TypeScript)"
    echo "   • .py (Python)"
    echo "   • .md (Markdown)"
    echo "   • .sh (Shell scripts)"
    echo ""
    echo "💡 Examples:"
    echo "   $0 src/components/NewComponent.tsx"
    echo "   $0 src/lib/newFeature.ts"
    echo "   $0 docs/new-guide.md"
    echo ""
    exit 1
fi

# Process each file argument
for file_path in "$@"; do
    if [ -f "$file_path" ]; then
        add_timestamp "$file_path"
    else
        echo "❌ File not found: $file_path"
    fi
done

echo ""
echo "✅ Timestamp addition complete!"
echo "📝 Remember to:"
echo "   1. Update the 'Purpose' field with actual file description"
echo "   2. Commit changes with timestamped commit message"
echo "   3. Use: git commit -m \"$(date -u '+%Y-%m-%d'): Your commit message\""
echo ""
echo "🎯 Current timestamp: $TIMESTAMP"
