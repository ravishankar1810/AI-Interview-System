import os

# --- PASTE YOUR API KEY INSIDE THE QUOTES BELOW ---
my_api_key = "AIzaSyAndiFsrUVqlTHZfBtSrkMlst1BOJvLIFc" 
# --------------------------------------------------

file_path = ".env"

# 1. Write the file programmatically (Guarantees correct name)
with open(file_path, "w") as f:
    f.write(f"OPENAI_API_KEY={my_api_key}")

print(f"✅ Success! Created .env file at: {os.path.abspath(file_path)}")
print("You can now run 'python main.py'")