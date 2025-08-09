#!/bin/bash
# Created: 2025-08-07 05:58:00 UTC
# Updated: 2025-08-07 05:58:00 UTC
# Purpose: Update existing timestamps in Keze Tap Game files

echo "🔄 Keze Tap Game - Timestamp Update Tool"
echo "======================================"
echo ""

# Get current UTC timestamp
TIMESTAMP=$(date -u '+%Y-%m-%d %H:%M:%S UTC')

# Function to update timestamp in different file types
update_timestamp() {
    local file_path="$1"
    local file_ext="${file_path##*.}"
    local temp_file=$(mktemp)

    echo "🔄 Updating timestamp in: $file_path"

    case "$file_ext" in
        "tsx"|"ts"|"js"|"jsx")
            # JavaScript/TypeScript files
            if grep -q "Updated:" "$file_path"; then
                sed "s/\* Updated: [0-9-]* [0-9:]* UTC/* Updated: $TIMESTAMP/" "$file_path" > "$temp_file"
                mv "$temp_file" "$file_path"
                echo "✅ Updated timestamp in $file_path"
            else
                echo "⚠️  No existing timestamp found in $file_path"
                rm "$temp_file"
            fi
            ;;

        "py")
            # Python files
            if grep -q "Updated:" "$file_path"; then
                sed "s/Updated: [0-9-]* [0-9:]* UTC/Updated: $TIMESTAMP/" "$file_path" > "$temp_file"
                mv "$temp_file" "$file_path"
                echo "✅ Updated timestamp in $file_path"
            else
                echo "⚠️  No existing timestamp found in $file_path"
                rm "$temp_file"
            fi
            ;;

        "md")
            # Markdown files
            if grep -q "Updated" "$file_path"; then
                sed "s/**Updated**: [0-9-]* [0-9:]* UTC/**Updated**: $TIMESTAMP/" "$file_path" > "$temp_file"
                mv "$temp_file" "$file_path"
                echo "✅ Updated timestamp in $file_path"
            else
                echo "⚠️  No existing timestamp found in $file_path"
                rm "$temp_file"
            fi
            ;;

        "sh")
            # Shell scripts
            if grep -q "Updated:" "$file_path"; then
                sed "s/# Updated: [0-9-]* [0-9:]* UTC/# Updated: $TIMESTAMP/" "$file_path" > "$temp_file"
                mv "$temp_file" "$file_path"
                echo "✅ Updated timestamp in $file_path"
            else
                echo "⚠️  No existing timestamp found in $file_path"
                rm "$temp_file"
            fi
            ;;

        *)
            echo "⚠️  Unsupported file type: $file_ext"
            rm "$temp_file"
            ;;
    esac
}

# Function to update timestamps for all modified files
update_git_modified() {
    echo "🔍 Finding modified files in Git..."

    # Get list of modified files
    modified_files=$(git diff --name-only HEAD)

    if [ -z "$modified_files" ]; then
        echo "ℹ️  No modified files found in Git"
        return
    fi

    echo "📝 Modified files found:"
    echo "$modified_files"
    echo ""

    # Update timestamp for each modified file
    for file in $modified_files; do
        if [ -f "$file" ]; then
            update_timestamp "$file"
        fi
    done
}

# Main execution
if [ $# -eq 0 ]; then
    echo "🔍 Usage: $0 <file_path> [file_path2] [file_path3]..."
    echo "   OR: $0 --git-modified (update all Git modified files)"
    echo ""
    echo "📋 Supported file types:"
    echo "   • .tsx, .ts, .js, .jsx (JavaScript/TypeScript)"
    echo "   • .py (Python)"
    echo "   • .md (Markdown)"
    echo "   • .sh (Shell scripts)"
    echo ""
    echo "💡 Examples:"
    echo "   $0 src/components/UpdatedComponent.tsx"
    echo "   $0 --git-modified"
    echo "   $0 src/lib/gameContext.tsx src/components/FriendsScreen.tsx"
    echo ""
    exit 1
fi

# Check for --git-modified flag
if [ "$1" = "--git-modified" ]; then
    update_git_modified
    echo ""
    echo "✅ Git modified files timestamp update complete!"
    echo "📝 Remember to commit changes with timestamped commit message:"
    echo "   git commit -m \"$(date -u '+%Y-%m-%d'): Your commit message\""
    echo ""
    echo "🎯 Current timestamp: $TIMESTAMP"
    exit 0
fi

# Process each file argument
for file_path in "$@"; do
    if [ -f "$file_path" ]; then
        update_timestamp "$file_path"
    else
        echo "❌ File not found: $file_path"
    fi
done

echo ""
echo "✅ Timestamp update complete!"
echo "📝 Remember to commit changes with timestamped commit message:"
echo "   git commit -m \"$(date -u '+%Y-%m-%d'): Your commit message\""
echo ""
echo "🎯 Current timestamp: $TIMESTAMP"
